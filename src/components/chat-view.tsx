'use client';

import { useState,useEffect } from 'react';
import { Send, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Source {
  text: string;
  file_id: string;
  chunk_index: number;
}

interface APIResponse {
  answer: string;
  reasoning: string | null;
  sources: Source[];
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  sources?: Source[];
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);
  const [projectId, setSelectedProject] = useState<string>(''); 
  const [fileId, setSelectedFileId] = useState<string>(''); 
  // Get project_id and file_id from localStorage
  
  useEffect(() => {
    const projectId = localStorage.getItem('project_id') || '';
    const fileId = localStorage.getItem('file_id') || '';
    setSelectedProject(projectId);
    setSelectedFileId(fileId);
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !projectId || !fileId) return;

    if (!BACKEND_URL) {
      setError('Backend URL is not configured');
      return;
    }

    const userMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      content: input.trim(),
      role: 'user',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/data/query/${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage.content,
          file_id: fileId,  // Use the file_id from localStorage
          project_id: projectId, // Use the project_id from localStorage
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from the server');
      }

      const data: APIResponse = await response.json();

      const aiResponse: Message = {
        id: Math.random().toString(36).substr(2, 9),
        content: data.answer,
        role: 'assistant',
        sources: data.sources,
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response');
      const errorMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        content: 'Sorry, there was an error processing your request.',
        role: 'assistant',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-auto p-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            Start a conversation by sending a message
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                <div
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            {children}
                          </a>
                        ),
                        code: ({ children }) => (
                          <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded">
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre className="bg-black/10 dark:bg-white/10 p-2 rounded-lg my-2 overflow-x-auto">
                            {children}
                          </pre>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
                {message.sources && message.sources.length > 0 && (
                  <div className="ml-4 space-y-1">
                    <p className="text-xs text-gray-500 font-medium">Sources:</p>
                    {message.sources.map((source, index) => (
                      <div key={index} className="flex items-center gap-1 text-xs text-gray-500">
                        <FileText className="h-3 w-3" />
                        {source.file_id} (Chunk: {source.chunk_index})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 rounded-lg border dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isLoading}
          >
            <Send className="h-4 w-4" />
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
