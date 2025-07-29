"use client";

import axios from "axios";
import Image from "next/image";
import { useEffect, useState } from "react";

// Add Deck type
interface Word {
  id: number;
  text: string;
  meaning: string;
  translation: string;
}
interface Deck {
  id: number;
  name: string;
  words: Word[];
}

function ConfirmDeleteDialog({ open, onConfirm, onCancel, deckName }: { open: boolean; onConfirm: () => void; onCancel: () => void; deckName: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-transparent" style={{ pointerEvents: "auto" }}>
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full">
        <h2 className="text-lg font-semibold mb-4">Delete Deck</h2>
        <p className="mb-6">Are you sure you want to delete <span className="font-bold">{deckName}</span>? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <button className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700" onClick={onCancel}>Cancel</button>
          <button className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [newDeckName, setNewDeckName] = useState("");
  const [addingToDeck, setAddingToDeck] = useState<number | null>(null);
  const [newWord, setNewWord] = useState("");
  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);

  // Fetch decks from backend on mount
  useEffect(() => {
    axios.get("http://localhost:8000/api/decks")
      .then(res => setDecks(res.data))
      .catch(err => console.error("Failed to fetch decks", err));
  }, []);

  const handleCreateDeck = async () => {
    if (!newDeckName.trim()) return;
    try {
      const res = await axios.post("http://localhost:8000/api/decks", { name: newDeckName });
      setDecks([...decks, res.data]);
      setNewDeckName("");
    } catch (err) {
      console.error("Failed to create deck", err);
    }
  };

  const handleAddWord = (deckId: number) => {
    if (!newWord.trim()) return;
    setDecks(
      decks.map((deck) =>
        deck.id === deckId
          ? { ...deck, words: [...deck.words, { id: 0, text: newWord, meaning: "", translation: "" }] } // Assuming new words are added with default values for now
          : deck
      )
    );
    setNewWord("");
    setAddingToDeck(null);
  };

  const handleDeleteDeck = async (deckId: number) => {
    try {
      await axios.delete(`http://localhost:8000/api/decks/${deckId}`);
      setDecks(decks.filter(d => d.id !== deckId));
      setDeckToDelete(null);
    } catch (err) {
      console.error("Failed to delete deck", err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-20 px-6">
      <h1 className="text-4xl font-light mb-10 text-gray-900 tracking-tight" style={{letterSpacing: '0.01em'}}>Your Flashcard Decks</h1>
      <div className="mb-12 flex gap-3">
        <input
          className="border border-[var(--border)] rounded-xl px-5 py-3 w-full focus:outline-none focus:ring-2 focus:ring-[var(--border)] bg-white text-gray-900 placeholder-gray-400 transition font-light"
          placeholder="Create a new deck..."
          value={newDeckName}
          onChange={(e) => setNewDeckName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreateDeck()}
        />
        <button
          className="bg-white border border-[var(--border)] px-5 py-3 rounded-xl font-light hover:bg-gray-50 transition-colors text-gray-900"
          onClick={handleCreateDeck}
        >
          Create
        </button>
      </div>
      <ul className="space-y-8">
        {decks.map((deck) => (
          <li key={deck.id} className="group bg-white border border-[var(--border)] rounded-2xl p-6 flex flex-col gap-3 relative">
            <button
              className="absolute top-4 right-4 text-gray-300 hover:text-red-400 text-xl font-light opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete deck"
              onClick={() => setDeckToDelete(deck)}
            >
              ×
            </button>
            <div className="flex justify-between items-center">
              <a
                href={`/deck/${deck.id}?name=${encodeURIComponent(deck.name)}`}
                className="font-light text-xl text-gray-900 hover:underline cursor-pointer"
              >
                {deck.name}
              </a>
              <button
                className="text-base font-light underline hover:text-gray-700"
                onClick={() => setAddingToDeck(deck.id)}
              >
                Quick add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {deck.words.map((word, idx) => (
                <span key={word.id} className="bg-gray-50 px-3 py-1 rounded-lg text-base text-gray-700 font-light border border-[var(--border)]">{word.text}</span>
              ))}
            </div>
            {addingToDeck === deck.id && (
              <div className="flex gap-2 mt-2">
                <input
                  className="border border-[var(--border)] rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[var(--border)] bg-white text-gray-900 placeholder-gray-400 transition font-light"
                  placeholder="Add a word or phrase..."
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddWord(deck.id)}
                />
                <button
                  className="bg-white border border-[var(--border)] px-4 py-2 rounded-xl font-light hover:bg-gray-50 transition-colors text-gray-900"
                  onClick={() => handleAddWord(deck.id)}
                >
                  Add
                </button>
                <button
                  className="text-gray-400 hover:text-gray-700 px-2 font-light"
                  onClick={() => setAddingToDeck(null)}
                >
                  Cancel
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <ConfirmDeleteDialog
        open={!!deckToDelete}
        deckName={deckToDelete?.name || ""}
        onCancel={() => setDeckToDelete(null)}
        onConfirm={() => deckToDelete && handleDeleteDeck(deckToDelete.id)}
      />
    </div>
  );
}
