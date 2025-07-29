from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from models import Base, User, Deck, Word, deck_word_association
from schemas import User as UserSchema, UserCreate, Deck as DeckSchema, DeckCreate, WordBase, Word as WordSchema, WordCreate
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./database.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

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
    db_deck = Deck(name=deck.name, owner_id=1)  # For now, assign to user 1
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

