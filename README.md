# Mini-RAG Frontend

**Note:**  
This is the **frontend part** of an end-to-end Retrieval-Augmented Generation (RAG) web application that allows users to:

- Upload PDF or Excel files  
- Ask questions based on the uploaded content  
- Get AI-generated answers from a language model based on retrieved context  

The **backend** is in a separate repository: [Mini-RAG-application](https://github.com/Karim-Bennia/Mini-RAG-application).

---

## Architecture

- **Frontend:** Next.js 15.1 with TypeScript  
- **Styling:** TailwindCSS with Dark/Light mode support  
- **Features:** File upload and chat interface  

---

## Environment Variables

The application requires several environment variables to be set. See the file:
frontend/.env.dist

---

## Setup Instructions

### Set up the frontend

```bash
cd frontend
npm install
cp .env.dist .env

Edit .env and set:
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
