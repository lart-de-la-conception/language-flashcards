from sqlalchemy import Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

# Association table for many-to-many relationship between Deck and Word
"""
Association table to link Decks and Words in a many-to-many relationship.
Each row represents a Word belonging to a Deck.
"""
deck_word_association = Table(
    'deck_word_association', Base.metadata,
    Column('deck_id', Integer, ForeignKey('decks.id'), primary_key=True),
    Column('word_id', Integer, ForeignKey('words.id'), primary_key=True)
)

class User(Base):
    """
    User model representing an application user.
    Each user can have multiple decks and words.
    """
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)

    decks = relationship('Deck', back_populates='owner', cascade="all, delete-orphan")
    words = relationship('Word', back_populates='owner', cascade="all, delete-orphan")

class Deck(Base):
    """
    Deck model representing a collection of words (flashcards) owned by a user.
    Decks can contain multiple words, and words can belong to multiple decks.
    """
    __tablename__ = 'decks'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    owner_id = Column(Integer, ForeignKey('users.id'))

    owner = relationship('User', back_populates='decks')
    words = relationship('Word', secondary=deck_word_association, back_populates='decks')

class Word(Base):
    """
    Word model representing a vocabulary word with its meaning and translation.
    Words belong to a user and can be part of multiple decks.
    """
    __tablename__ = 'words'
    id = Column(Integer, primary_key=True, index=True)
    text = Column(String, index=True, nullable=False)
    meaning = Column(String, nullable=False)
    translation = Column(String, nullable=False)
    owner_id = Column(Integer, ForeignKey('users.id'))

    owner = relationship('User', back_populates='words')
    decks = relationship('Deck', secondary=deck_word_association, back_populates='words')

    @property
    def deck_ids(self):
        return [deck.id for deck in self.decks]
