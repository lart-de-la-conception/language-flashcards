from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, PlainTextResponse
from cachetools import LRUCache
from google.cloud import translate_v2 as translate
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from models import Base, User, Deck, Word
from schemas import User as UserSchema, UserCreate, Deck as DeckSchema, DeckCreate, WordBase, Word as WordSchema, WordCreate, TranslationRequest, TTSRequest
from dotenv import load_dotenv
import os
import html
import requests
import io

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./database.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

translate_client = translate.Client()


app = FastAPI()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello, World!"}

# --- User CRUD ---
@app.post("/api/users", response_model=UserSchema)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(username=user.username)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/api/users", response_model=list[UserSchema])
def list_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@app.get("/api/users/{user_id}", response_model=UserSchema)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.delete("/api/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": f"User {user_id} deleted"}

# --- Deck CRUD ---
@app.post("/api/decks", response_model=DeckSchema)
def create_deck(deck: DeckCreate, db: Session = Depends(get_db)):
    # Backend validation: target_language must be provided and not empty
    if not deck.target_language or not deck.target_language.strip():
        raise HTTPException(status_code=422, detail="target_language is required when creating a deck.")
    db_deck = Deck(name=deck.name, target_language=deck.target_language, owner_id=1)  # For now, assign to user 1
    db.add(db_deck)
    db.commit()
    db.refresh(db_deck)
    return db_deck

@app.get("/api/decks", response_model=list[DeckSchema])
def list_decks(db: Session = Depends(get_db)):
    return db.query(Deck).all()

@app.get("/api/decks/{deck_id}", response_model=DeckSchema)
def get_deck(deck_id: int, db: Session = Depends(get_db)):
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    return deck

@app.delete("/api/decks/{deck_id}")
def delete_deck(deck_id: int, db: Session = Depends(get_db)):
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    db.delete(deck)
    db.commit()
    return {"message": f"Deck {deck_id} deleted"}

# --- Word CRUD ---
@app.post("/api/words", response_model=WordSchema)
def create_word(word: WordCreate, db: Session = Depends(get_db)):
    # Fetch the deck to assign the word to
    deck = db.query(Deck).filter(Deck.id == word.deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    db_word = Word(text=word.text, meaning=word.meaning, translation=word.translation, owner_id=deck.owner_id)
    db.add(db_word)
    db.commit()
    db.refresh(db_word)
    # Associate the word with the deck
    deck.words.append(db_word)
    db.commit()
    db.refresh(db_word)
    return db_word

@app.get("/api/words", response_model=list[WordSchema])
def list_words(db: Session = Depends(get_db)):
    return db.query(Word).all()

@app.get("/api/words/{word_id}", response_model=WordSchema)
def get_word(word_id: int, db: Session = Depends(get_db)):
    word = db.query(Word).filter(Word.id == word_id).first()
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")
    return word

@app.delete("/api/words/{word_id}")
def delete_word(word_id: int, db: Session = Depends(get_db)):
    word = db.query(Word).filter(Word.id == word_id).first()
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")
    db.delete(word)
    db.commit()
    return {"message": f"Word {word_id} deleted"}

@app.put("/api/words/{word_id}", response_model=WordSchema)
def update_word(word_id: int, word: WordBase, db: Session = Depends(get_db)):
    db_word = db.query(Word).filter(Word.id == word_id).first()
    if not db_word:
        raise HTTPException(status_code=404, detail="Word not found")
    db_word.text = word.text
    db_word.meaning = word.meaning
    db_word.translation = word.translation
    db.commit()
    db.refresh(db_word)
    return db_word

@app.post("/api/words/translate")
def translate(request: TranslationRequest, db: Session = Depends(get_db)):
    # Always need a target language (deck's target language)
    target_language = request.target_language or "en"
    translation = translate_client.translate(request.text, target_language=target_language)
    detected_language = translation["detectedSourceLanguage"]

    if detected_language == target_language:
        # User typed in the target language, so translate to English
        english_translation = translate_client.translate(request.text, target_language="en")
        return {
            "text": html.unescape(request.text),  # foreign word (decoded)
            "translation": html.unescape(english_translation["translatedText"]),  # English (decoded)
            "detected_language": detected_language,
            "target_language": target_language,
            "deck_id": request.deck_id
        }
    else:
        # User typed in English (or another language), translate to target language
        return {
            "text": html.unescape(translation["translatedText"]),  # foreign word (decoded)
            "translation": html.unescape(request.text),            # English (decoded)
            "detected_language": detected_language,
            "target_language": target_language,
            "deck_id": request.deck_id
        }

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
_AUDIO_CACHE = LRUCache(maxsize=512)

@app.post("/api/pronounce")
def pronounce(req: TTSRequest, db: Session = Depends(get_db)):
    if not ELEVENLABS_API_KEY:
        raise HTTPException(status_code=500, detail="ElevenLabs API key not configured")
    try:
        voice_id = req.voice_id or "JBFqnCBsd6RMkjVDRZzb"
        model_id = req.model_id or "eleven_multilingual_v2"

        # Cache key
        cache_key = req.cache_key or f"{req.text}|{voice_id}|{model_id}"
        if cache_key in _AUDIO_CACHE:
            return StreamingResponse(io.BytesIO(_AUDIO_CACHE[cache_key]), media_type="audio/mpeg")

        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        headers = {
            "xi-api-key": ELEVENLABS_API_KEY, # api key needs to be hardcoded in for this to work, otherwise 401 error, working on FIX currently
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        }
        payload = {
            "text": req.text,
            "model_id": model_id,
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.5},
        }
        r = requests.post(url, headers=headers, json=payload)
        if r.status_code != 200:
            return PlainTextResponse(r.text, status_code=r.status_code)
        _AUDIO_CACHE[cache_key] = r.content
        return StreamingResponse(io.BytesIO(r.content), media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

