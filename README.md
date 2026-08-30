# Bureau of Indian Standards (BIS) AI Assistant — Full-Stack Hybrid RAG & PWA

An enterprise-grade, government-standard AI conversational assistant for Indian Standards (IS), ISI Mark Product Certification (Scheme-I), Compulsory Registration Scheme (CRS Scheme-II), Hallmarking, and Laboratory Testing Directories.

---

## ??? Project Architecture

```
bis_project/
+-- api_server.py                 # FastAPI Backend (Hybrid RAG with Supabase Cloud Vector DB & Gemini)
+-- sync_and_ingest.py            # Vector ingestion & OCR extraction pipeline
+-- frontend/                     # React (TypeScript) + Tailwind CSS + Vite PWA
¦   +-- src/
¦   ¦   +-- services/api.ts       # Strict contract API Client (POST /chat & /chat/multimodal)
¦   ¦   +-- hooks/
¦   ¦   ¦   +-- useChat.ts        # Chat state, sessions, and optimistic messaging
¦   ¦   ¦   +-- usePWAInstall.ts  # PWA installation prompt and standalone detection
¦   ¦   +-- components/
¦   ¦   ¦   +-- chat/             # MessageList, Markdown renderer, Citations & Sources UI
¦   ¦   ¦   +-- estimator/        # BIS Statutory Fee & MSME Concession Calculator
¦   ¦   ¦   +-- library/          # Indian Standards (IS 302, IS 10500, IS 1293...) catalog
¦   ¦   ¦   +-- directory/        # BIS Central, Regional, and Recognized Testing Labs
¦   ¦   ¦   +-- layout/           # Header, Collapsible Sidebar, Install Modal
¦   +-- vite.config.ts            # Vite PWA Manifest & Service Worker Configuration
```

---

## ?? Getting Started

### 1. Start the Backend Server (FastAPI)
```bash
# In the root project directory:
python api_server.py
# Or with uvicorn:
uvicorn api_server:app --reload --host 127.0.0.1 --port 8000
```
Backend runs at: `http://127.0.0.1:8000`  
Interactive Swagger Docs: `http://127.0.0.1:8000/docs`

---

### 2. Start the Frontend PWA (Vite + React)
```bash
cd frontend
npm install
npm run dev
```
Frontend development server opens at: `http://localhost:5173`

---

## ?? Progressive Web App (PWA) Features
- **Install App Button**: Integrated directly into the Top Header.
- **Offline Precaching**: Workbox Service Worker precaches core UI and offline fallbacks.
- **Cross-Platform**: Full support for Android Chrome, Desktop Chrome/Edge, and iOS Safari ("Add to Home Screen").

---

## ?? API Integration Contract
- **Base URL**: `http://127.0.0.1:8000`
- **Endpoint**: `POST /chat`
- **Request Body**:
```json
{
  "session_id": "web_user_1",
  "message": "What tests are mandatory under IS 302 for electrical appliances?"
}
```
- **Response Format**:
```json
{
  "reply": "Markdown formatted AI response...",
  "citations": [
    {
      "document": "IS 302-1",
      "page": 5,
      "text": "Extracted clause snippet from vector index"
    }
  ]
}
```
