from pydantic import BaseModel, Field
from typing import List, Optional

class WordBase(BaseModel):
    text: str
    meaning: Optional[str] = None
    translation: str

class WordCreate(WordBase):
    deck_id: int

class Word(WordBase):
    id: int
    model_config = dict(from_attributes=True)

class DeckBase(BaseModel):
    name: str
    target_language: str  # e.g., 'es', 'fr', etc.

class DeckCreate(DeckBase):
    pass

class Deck(DeckBase):
    id: int
    words: List[Word] = Field(default_factory=list)
    owner_id: int

    model_config = dict(from_attributes=True)

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    pass

class User(BaseModel):
    id: int
    username: str
    decks: List[Deck] = Field(default_factory=list)
    words: List[Word] = Field(default_factory=list)

    model_config = dict(from_attributes=True)

class TranslationRequest(BaseModel):
    text: str
    target_language: str
    deck_id: int | None = None

class TTSRequest(BaseModel):
    text: str
    voice_id: Optional[str] = None
    model_id: Optional[str] = None
    cache_key: Optional[str] = None
    deck_id: Optional[int] = None
