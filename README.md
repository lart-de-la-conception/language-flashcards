# AI Flashcards

A full-stack flashcard web app for language learning, built with FastAPI (backend) and Next.js (frontend).

## Features
- Create, edit, and delete decks
- Add, edit, and delete words in each deck
- Practice flashcards with flip and navigation
- Responsive, modern UI

## Tech Stack
- **Frontend:** Next.js (React, TypeScript, Tailwind CSS)
- **Backend:** FastAPI (Python, SQLAlchemy, SQLite)

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- Python 3.10+

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd ai-flashcards
   ```

2. **Backend setup:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```
   The backend will run at `http://localhost:8000`.

3. **Frontend setup:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
   The frontend will run at `http://localhost:3000`.

## Usage
- Visit `http://localhost:3000` in your browser.

## Development
- Backend code: `backend/`
- Frontend code: `frontend/`
- Database: SQLite file at `backend/database.db`

## To Do

- Add words functionality (basic add, quick add, bulk add)
- Auto translation for adding words 
- Add in pronunciation

