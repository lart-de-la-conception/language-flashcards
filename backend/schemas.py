from pydantic import BaseModel
from typing import List, Optional

class WordBase(BaseModel):
    text: str
    meaning: Optional[str] = None
    translation: str

class WordCreate(WordBase):
    deck_id: int

class Word(WordBase):
    id: int

class DeckBase(BaseModel):
    name: str

class DeckCreate(DeckBase):
    pass

class Deck(DeckBase):
    id: int
    words: Optional[List[Word]] = []
    owner_id: int

    model_config = dict(from_attributes=True)

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    decks: Optional[List[Deck]] = []
    words: Optional[List[Word]] = []

    model_config = dict(from_attributes=True)
