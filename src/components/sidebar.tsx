'use client';

import { useState, useEffect } from 'react';
import { Upload, File, Loader2 } from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
}

const STORAGE_KEY = 'forgent-uploaded-files';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export function Sidebar() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string>(''); // Track selected project
  const [fileId, setFileId] = useState<string>(''); // Track uploaded file ID

  // Load files and project/file IDs from localStorage on component mount
  useEffect(() => {
    const savedFiles = localStorage.getItem(STORAGE_KEY);
    const savedProjectId = localStorage.getItem('project_id');
    const savedFileId = localStorage.getItem('file_id');
    
    if (savedFiles) {
      try {
        setFiles(JSON.parse(savedFiles));
      } catch (e) {
        console.error('Failed to parse saved files:', e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    if (savedProjectId) {
      setProjectId(savedProjectId);
    }

    if (savedFileId) {
      setFileId(savedFileId);
    }
  }, []);

  // Save files, project_id, and file_id to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    if (projectId) {
      localStorage.setItem('project_id', projectId);
    }
    if (fileId) {
      localStorage.setItem('file_id', fileId);
    }
  }, [files, projectId, fileId]);

  // Handle project selection
  const handleProjectSelect = (projectId: string) => {
    setProjectId(projectId);
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList) return;

    if (!BACKEND_URL) {
      setError('Backend URL is not configured');
      return;
    }

    if (!projectId) {
      setError('Please select a project before uploading a file');
      return; // Prevent file upload if no project is selected
    }

    setIsUploading(true);
    setError(null);

    try {
      for (const file of Array.from(fileList)) {
        const newFile: UploadedFile = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
        };

        // Upload the file
        const uploadedFileId = await uploadFile(file);
        if (uploadedFileId) {
          setFileId(uploadedFileId); // Update file_id
          await processFile(uploadedFileId); // Process the file after upload
          setFiles((prev) => [...prev, newFile]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload files');
    } finally {
      setIsUploading(false);
      event.target.value = ''; // Reset file input
    }
  };

  // Function to upload the file
  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BACKEND_URL}/api/v1/data/upload/${projectId}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload ${file.name}`);
    }

    const { file_id }: { file_id: string } = await response.json();
    return file_id;
  };

  // Function to process the file after upload
  const processFile = async (fileId: string) => {
    if (!BACKEND_URL || !projectId) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/data/process/${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_id: fileId,
          chunk_size: 1000,  // Adjust as needed
          overlap_size: 100, // Adjust as needed
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process file');
      }

      const data = await response.json();
      console.log('File processing successful:', data);
    } catch (err) {
      console.error('Error processing file:', err);
      setError('Failed to process file');
    }
  };

  const handleClearFiles = () => {
    setFiles([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <aside className="w-80 border-r dark:border-gray-700 p-4 flex flex-col">
      <div className="mb-6 space-y-2">
        <select
          value={projectId}
          onChange={(e) => handleProjectSelect(e.target.value)}
          className="w-full p-2 border dark:border-gray-700 rounded-md"
        >
          <option value="">Select Project</option>
          <option value="1">Project 1</option>
          <option value="2">Project 2</option>
        </select>
        {error && !projectId && <p className="text-xs text-red-500">Please select a project</p>}
      </div>

      <div className="mb-6 space-y-2">
        <label
          htmlFor="file-upload"
          className={`flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer ${
            isUploading || !projectId ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {isUploading ? 'Uploading...' : 'Upload Files'}
          <input
            id="file-upload"
            type="file"
            multiple
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading || !projectId}  // Disable upload if no project selected
          />
        </label>
        {error && (
          <p className="mt-2 text-sm text-red-500">
            {error}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold">Uploaded Files</h2>
          {files.length > 0 && (
            <button
              onClick={handleClearFiles}
              className="text-xs text-red-500 hover:text-red-600"
            >
              Clear All
            </button>
          )}
        </div>
        {files.length === 0 ? (
          <p className="text-gray-500 text-sm">No files uploaded yet</p>
        ) : (
          <ul className="space-y-2">
            {files.map((file) => (
              <li
                key={file.id}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <File className="h-4 w-4 text-gray-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
