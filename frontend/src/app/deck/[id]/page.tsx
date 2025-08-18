'use client';
import axios from "axios";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { HiSpeakerWave, HiPencil, HiArrowsRightLeft, HiArrowsUpDown } from "react-icons/hi2";

function Flashcard({ card, onPrev, onNext }: {
  card: { text: string; translation: string; meaning: string };
  onPrev: () => void;
  onNext: () => void;
}) {
  const [flipped, setFlipped] = React.useState(false);

  const flip = () => setFlipped(f => !f);

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = document.activeElement?.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || (document.activeElement as HTMLElement)?.isContentEditable;
      if (isInput) return;
      if (e.key === 'ArrowLeft') {
        setFlipped(false);
        onPrev();
      } else if (e.key === 'ArrowRight') {
        setFlipped(false);
        onNext();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        flip();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPrev, onNext]);

  React.useEffect(() => { setFlipped(false); }, [card]);

  return (
    <div className="flex flex-col items-center mb-12">
      <div className="w-80 h-48 [perspective:1000px]">
        <div
          className={`relative w-full h-full duration-500 [transform-style:preserve-3d] ${flipped ? '[transform:rotateX(180deg)]' : ''}`}
          onClick={flip}
          title="Click to flip"
          tabIndex={0}
          role="button"
          aria-pressed={flipped}
          style={{ cursor: 'pointer' }}
        >
          {/* Front */}
          <div className="absolute w-full h-full flex items-center justify-center text-2xl font-light text-gray-900 bg-white border border-[var(--border)] rounded-2xl shadow-sm select-none [backface-visibility:hidden]">
            {card.text}
          </div>
          {/* Back */}
          <div className="absolute w-full h-full flex items-center justify-center text-2xl font-light text-gray-900 bg-white border border-[var(--border)] rounded-2xl shadow-sm select-none [transform:rotateX(180deg)] [backface-visibility:hidden]">
            {card.translation}
          </div>
        </div>
      </div>
      <div className="flex gap-4 mt-4">
        <button
          className="bg-white border border-[var(--border)] px-4 py-1 rounded-xl font-light hover:bg-gray-50 transition-colors text-gray-900"
          onClick={() => { setFlipped(false); onPrev(); }}
        >
          Previous
        </button>
        <button
          className="bg-white border border-[var(--border)] px-4 py-1 rounded-xl font-light hover:bg-gray-50 transition-colors text-gray-900"
          onClick={() => { setFlipped(false); onNext(); }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

interface EditWordModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  form: { text: string; meaning: string; translation: string };
  setForm: React.Dispatch<React.SetStateAction<{ text: string; meaning: string; translation: string }>>;
}

function EditWordModal({ open, onClose, onSave, form, setForm }: EditWordModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
        <h2 className="text-xl font-semibold mb-6 text-gray-900">Edit Word</h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            onSave();
          }}
        >
          <div className="mb-4">
            <label className="block text-gray-700 mb-1" htmlFor="edit-text">Word</label>
            <input
              id="edit-text"
              name="text"
              value={form.text}
              onChange={e => setForm((f: typeof form) => ({ ...f, text: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--border)]"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-1" htmlFor="edit-translation">Translation</label>
            <input
              id="edit-translation"
              name="translation"
              value={form.translation}
              onChange={e => setForm((f: typeof form) => ({ ...f, translation: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--border)]"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-1" htmlFor="edit-meaning">Meaning <span className="text-gray-400">(optional)</span></label>
            <input
              id="edit-meaning"
              name="meaning"
              value={form.meaning}
              onChange={e => setForm((f: typeof form) => ({ ...f, meaning: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--border)]"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const searchParams = useSearchParams();
  const deckNameParam = searchParams.get('name');

  const [deck, setDeck] = useState<{ name: string; words: any[]; target_language?: string; id?: number }>({ name: '', words: [] });
  const [cardIndex, setCardIndex] = useState(0);
  const [editingWordId, setEditingWordId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ text: "", meaning: "", translation: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [newWord, setNewWord] = useState("");

  // State for manual add fields
  const [manualForeign, setManualForeign] = useState("");
  const [manualTranslation, setManualTranslation] = useState("");

  // State for manual add modal
  const [manualModalOpen, setManualModalOpen] = useState(false);

  // State to control manual add input order (true = foreign first, false = translation first)
  const [manualForeignFirst, setManualForeignFirst] = useState(true);

  useEffect(() => {
    axios.get(`http://localhost:8000/api/decks/${id}`)
      .then(res => setDeck(res.data))
      .catch(err => console.error("Failed to fetch deck", err));
  }, [id]);

  const card = deck.words[cardIndex] || { text: '', translation: '', meaning: '' };
  const goPrev = () => setCardIndex(i => (deck.words.length ? (i > 0 ? i - 1 : deck.words.length - 1) : 0));
  const goNext = () => setCardIndex(i => (deck.words.length ? (i < deck.words.length - 1 ? i + 1 : 0) : 0));

  // Start editing
  const handleEditClick = (word: any) => {
    setEditingWordId(word.id);
    setEditForm({
      text: word.text,
      meaning: word.meaning || "",
      translation: word.translation,
    });
    setModalOpen(true);
  };

  // Save the edit
  const handleEditSave = async () => {
    if (editingWordId == null) return;
    try {
      const res = await axios.put(
        `http://localhost:8000/api/words/${editingWordId}`,
        editForm
      );
      setDeck((prev) => ({
        ...prev,
        words: prev.words.map((w) => (w.id === editingWordId ? res.data : w)),
      }));
      setEditingWordId(null);
      setModalOpen(false);
    } catch (err) {
      alert("Failed to update word");
    }
  };

  // Cancel editing
  const handleEditCancel = () => {
    setEditingWordId(null);
    setModalOpen(false);
  };

  const translateWord = async (word: string, target_language: string) => {
    const res = await axios.post("http://localhost:8000/api/words/translate", {
      text: word,
      target_language: target_language,
    });
    console.log(res.data);
  };

  // Auto-translate and add word to deck
  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || !deck.target_language) return;

    // Call backend to translate the word
    const res = await axios.post("http://localhost:8000/api/words/translate", {
      text: newWord,
      target_language: deck.target_language,
      deck_id: deck.id
    });

    const { text, translation, detected_language } = res.data;

    // Ensure the foreign language word always appears first
    let wordData;
    if (detected_language === deck.target_language) {
      // User typed in the target language (foreign word)
      wordData = {
        text,                // foreign word
        translation,         // English (or user's base language)
        meaning: "",
        detected_language
      };
    } else {
      // User typed in English (or another language)
      wordData = {
        text: translation,   // foreign word (translated)
        translation: text,   // English (original input)
        meaning: "",
        detected_language
      };
    }

    // Save the new word to the backend
    const wordRes = await axios.post("http://localhost:8000/api/words", {
      ...wordData,
      deck_id: deck.id
    });

    // Add the saved word (with real ID) to the deck's word list in state
    setDeck(prev => ({
      ...prev,
      words: [
        ...prev.words,
        wordRes.data
      ]
    }));

    setNewWord("");
  };

  // Handler for manual add form
  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForeign.trim() || !manualTranslation.trim() || !deck.id) return;

    // Save the new word to the backend (manual entry)
    const wordRes = await axios.post("http://localhost:8000/api/words", {
      text: manualForeign,
      translation: manualTranslation,
      meaning: "",
      deck_id: deck.id
    });

    // Add the saved word to the deck's word list in state
    setDeck(prev => ({
      ...prev,
      words: [
        ...prev.words,
        wordRes.data
      ]
    }));

    setManualForeign("");
    setManualTranslation("");
  };

  // Delete a word from the deck
  const handleDeleteWord = async (wordId: number) => {
    try {
      await axios.delete(`http://localhost:8000/api/words/${wordId}`);
      setDeck(prev => ({
        ...prev,
        words: prev.words.filter((w: any) => w.id !== wordId)
      }));
    } catch (err) {
      alert("Failed to delete word");
    }
  };

  // Play pronunciation for the foreign word using backend ElevenLabs endpoint
  const playPronunciation = async (text: string) => {
    try {
      const response = await axios.post(
        "http://localhost:8000/api/pronounce",
        { text },
        { responseType: "blob" }
      );
      const audioUrl = URL.createObjectURL(response.data);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (e) {
      alert("Unable to play pronunciation");
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-20 px-6">
      <Link href="/" className="text-gray-400 hover:text-gray-900 text-sm mb-8 inline-block">&larr; Back to Decks</Link>
      <h1 className="text-3xl font-light mb-8 text-gray-900 tracking-tight" style={{letterSpacing: '0.01em'}}>{deckNameParam || deck.name}</h1>
      {/* Flashcard view */}
      {deck.words.length > 0 && <Flashcard card={card} onPrev={goPrev} onNext={goNext} />}
      <EditWordModal
        open={modalOpen}
        onClose={handleEditCancel}
        onSave={handleEditSave}
        form={editForm}
        setForm={setEditForm}
      />
      <div className="mb-10">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-light text-gray-900">Words in this deck</h2>
          <button
            className="px-4 py-2 bg-white border border-[var(--border)] rounded-xl font-light hover:bg-gray-50 transition-colors text-gray-900"
            onClick={() => setManualModalOpen(true)}
          >
            + Manual Add
          </button>
        </div>
        <div className="flex flex-col gap-3 mb-4">
          {deck.words.map((word, idx) => (
            <div
              key={word.id || idx}
              className="flex items-center justify-between bg-gray-50 border border-[var(--border)] rounded-xl px-6 py-4 text-base text-gray-900 font-light hover:bg-gray-100 transition group"
            >
              <div className="flex-1">{word.translation}</div>
              <div className="mx-8 h-6 w-px bg-gray-300" />
              <div className="flex-1">{word.text}</div>
              <div className="flex gap-3 ml-6 opacity-60 group-hover:opacity-100 transition-opacity">
                <button title="Hear" onClick={() => playPronunciation(word.text)}><HiSpeakerWave /></button>
                <button title="Edit" onClick={() => handleEditClick(word)}><HiPencil /></button>
                <button
                  title="Delete"
                  onClick={() => handleDeleteWord(word.id)}
                  className="text-red-400 hover:text-red-600"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
        {/* Add word form with auto-translate (Quick Add) */}
        <form className="flex gap-2 mb-6" onSubmit={handleAddWord}>
          <input
            className="border border-[var(--border)] rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[var(--border)] bg-white text-gray-900 placeholder-gray-400 transition font-light"
            placeholder="Add a single word or phrase in either language..."
            type="text"
            value={newWord}
            onChange={e => setNewWord(e.target.value)}
          />
          <button
            className="bg-white border border-[var(--border)] px-4 py-2 rounded-xl font-light hover:bg-gray-50 transition-colors text-gray-900"
            type="submit"
          >
            Quick Add
          </button>
        </form>

        {/* Manual Add modal */}
        {manualModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-opacity-30">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
              <h2 className="text-xl font-semibold mb-6 text-gray-900">Manual Add</h2>
              {/* Switch icon button to toggle input order, right-aligned */}
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  className="p-2 rounded-lg border border-[var(--border)] bg-white text-gray-900 font-light hover:bg-gray-50 transition-colors flex items-center justify-center"
                  onClick={() => setManualForeignFirst(f => !f)}
                >
                  <HiArrowsUpDown className="w-5 h-5" />
                </button>
              </div>
              <form
                onSubmit={e => {
                  handleManualAdd(e);
                  setManualModalOpen(false);
                }}
              >
                {/* Conditionally render input order based on manualForeignFirst */}
                {manualForeignFirst ? (
                  <>
                    <input
                      className="border border-[var(--border)] rounded-xl px-3 py-2 w-full mb-4"
                      placeholder="Foreign word"
                      type="text"
                      value={manualForeign}
                      onChange={e => setManualForeign(e.target.value)}
                    />
                    <input
                      className="border border-[var(--border)] rounded-xl px-3 py-2 w-full mb-6"
                      placeholder="Translation"
                      type="text"
                      value={manualTranslation}
                      onChange={e => setManualTranslation(e.target.value)}
                    />
                  </>
                ) : (
                  <>
                    <input
                      className="border border-[var(--border)] rounded-xl px-3 py-2 w-full mb-4"
                      placeholder="Translation"
                      type="text"
                      value={manualTranslation}
                      onChange={e => setManualTranslation(e.target.value)}
                    />
                    <input
                      className="border border-[var(--border)] rounded-xl px-3 py-2 w-full mb-6"
                      placeholder="Foreign word"
                      type="text"
                      value={manualForeign}
                      onChange={e => setManualForeign(e.target.value)}
                    />
                  </>
                )}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                    onClick={() => setManualModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white"
                    disabled={!manualForeign.trim() || !manualTranslation.trim()}
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Bulk upload featuer would be better implement when I intergrate OpenAI API*/}
        {/* <div className="mb-2 text-gray-900 font-light">Bulk upload</div>
        <textarea
          className="border border-[var(--border)] rounded-xl px-3 py-2 w-full min-h-[80px] focus:outline-none focus:ring-2 focus:ring-[var(--border)] bg-white text-gray-900 placeholder-gray-400 transition font-light mb-2"
          placeholder="Paste words or phrases here, separated by commas or new lines..."
        />
        <button
          className="bg-white border border-[var(--border)] px-4 py-2 rounded-xl font-light hover:bg-gray-50 transition-colors text-gray-900 mt-2"
        >
          Upload
        </button> */}
      </div>
    </div>
  );
} 