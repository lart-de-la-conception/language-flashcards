# AI Flashcards

A full‑stack flashcard app for learning languages. Frontend: Next.js (TypeScript). Backend: FastAPI (Python, SQLite).

## Features
- Create/delete decks with a target language
- Add words (auto‑translate or manual)
- Inline edit/delete words
- Practice view with flip navigation
- Pronunciation via ElevenLabs (TTS)

## Tech Stack
- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: FastAPI, SQLAlchemy, Pydantic, SQLite
- Translation: Google Cloud Translation
- Text‑to‑Speech: ElevenLabs

## Project Structure
```
ai-flashcards/
  backend/
    main.py        # FastAPI app and endpoints
    models.py      # SQLAlchemy models
    schemas.py     # Pydantic schemas
    requirements.txt
    database.db    # SQLite (dev)
  frontend/
    src/app/       # Next.js app routes/pages
    package.json
```

## Prerequisites
- Node.js 18+
- Python 3.10+
- Google Cloud project (Translation API enabled)
- ElevenLabs API key

## Environment Variables (backend/.env)
Set these in `backend/.env` (do not commit):
```
# Optional; defaults to local SQLite
DATABASE_URL=sqlite:///./database.db

# Google Cloud Translation
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json

# ElevenLabs TTS
ELEVENLABS_API_KEY=sk_...
```
After editing `.env`, restart the backend.

## Install & Run
### Backend
```
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```
Backend runs on `http://localhost:8000`.

### Frontend
```
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:3000`.

## Key Endpoints (Backend)
- Decks
  - `POST /api/decks` → `{ name, target_language }`
  - `GET /api/decks` | `GET /api/decks/{id}` | `DELETE /api/decks/{id}`
- Words
  - `POST /api/words` → `{ text, translation, meaning, deck_id }`
  - `PUT /api/words/{id}` | `GET /api/words` | `GET /api/words/{id}` | `DELETE /api/words/{id}`
- Translation
  - `POST /api/words/translate`
    - Request: `{ text, target_language, deck_id? }`
    - Response: `{ text, translation, detected_language, target_language, deck_id }`
- Pronunciation (TTS)
  - `POST /api/pronounce`
    - Request: `{ text, voice_id?, model_id?, cache_key? }`
    - Response: `audio/mpeg` stream (MP3)

## Translation (Google Cloud)
- Auto‑detects input language; translates into the deck’s target language.
- HTML entities are decoded server‑side before returning.
- Requires `GOOGLE_APPLICATION_CREDENTIALS` pointing to a valid service account JSON and Translation API enabled.

## Pronunciation (ElevenLabs)
- Backend calls ElevenLabs TTS and streams MP3 back to the client.
- Requires `ELEVENLABS_API_KEY` in backend env.
- Defaults: `voice_id="JBFqnCBsd6RMkjVDRZzb"`, `model_id="eleven_multilingual_v2"`.
- Caching: in‑memory LRU cache (max 512 entries) to avoid repeated calls.

### Frontend usage example (axios)
```ts
const playPronunciation = async (text: string) => {
  const res = await axios.post("http://localhost:8000/api/pronounce", { text }, { responseType: "blob" });
  const url = URL.createObjectURL(res.data);
  new Audio(url).play();
};
```

## Common Issues
- 401 from Translation: check `GOOGLE_APPLICATION_CREDENTIALS` path and API enablement.
- 401 from TTS: check `ELEVENLABS_API_KEY` and voice/model availability.
- SQLite schema changes: `Base.metadata.create_all()` won’t alter existing tables. For dev, delete `database.db`. 

