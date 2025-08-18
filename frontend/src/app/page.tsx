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
  target_language: string;
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
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [newWord, setNewWord] = useState("");
  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Fetch decks from backend on mount
  useEffect(() => {
    axios.get("http://localhost:8000/api/decks")
      .then(res => setDecks(res.data))
      .catch(err => console.error("Failed to fetch decks", err));
  }, []);

  const handleCreateDeck = async () => {
    if (!newDeckName.trim() || !selectedLanguage) {
      alert("Please enter a deck title and select a language.");
      return;
    }
    try {
      const res = await axios.post("http://localhost:8000/api/decks", { name: newDeckName, target_language: selectedLanguage });
      setDecks([...decks, res.data]);
      setNewDeckName("");
      setSelectedLanguage("");
    } catch (err) {
      alert("Failed to create deck. Please make sure you selected a language.");
      console.error("Failed to create deck", err);
    }
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
      <div className="flex justify-end mb-6">
        <button
          className="bg-white border border-[var(--border)] px-6 py-3 rounded-xl font-light hover:bg-gray-50 transition-colors text-gray-900"
          onClick={() => setCreateModalOpen(true)}
        >
          + Create Deck
        </button>
      </div>

      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-opacity-30">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
            <h2 className="text-xl font-semibold mb-6 text-gray-900">Create a New Deck</h2>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleCreateDeck();
                setCreateModalOpen(false);
              }}
            >
              <input
                className="border border-[var(--border)] rounded-xl px-5 py-3 w-full mb-4"
                placeholder="Deck title..."
                value={newDeckName}
                onChange={e => setNewDeckName(e.target.value)}
              />
              <select
                className="border border-[var(--border)] rounded-xl px-5 py-3 w-full mb-6"
                value={selectedLanguage}
                onChange={e => setSelectedLanguage(e.target.value)}
              >
                <option value="" disabled>Select language you are learning</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
                <option value="en">English</option>
              </select>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white"
                  disabled={!newDeckName.trim() || !selectedLanguage}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
            </div>
            <div className="flex flex-wrap gap-2">
              {deck.words.map((word, idx) => (
                <span key={word.id} className="bg-gray-50 px-3 py-1 rounded-lg text-base text-gray-700 font-light border border-[var(--border)]">{word.text}</span>
              ))}
            </div>
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
