'use client';

import { useState } from 'react';
import { Layers, Plus, Trash2, Edit2, Save, Check, Pin, RefreshCw } from 'lucide-react';

export default function FlashcardsEditor({ flashcards, requirements, onUpdateFlashcards, onRegenerateFlashcards }) {
  const [editingId, setEditingId] = useState(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  const startEditing = (card) => {
    setEditingId(card.id);
    setEditFront(card.front);
    setEditBack(card.back);
  };

  const saveEditing = (cardId) => {
    const updated = flashcards.map(f => {
      if (f.id === cardId) {
        return {
          ...f,
          front: editFront,
          back: editBack,
          status: f.status === 'pinned' ? 'pinned' : 'edited'
        };
      }
      return f;
    });
    onUpdateFlashcards(updated);
    setEditingId(null);
  };

  const togglePin = (cardId) => {
    const updated = flashcards.map(f => {
      if (f.id === cardId) {
        return {
          ...f,
          status: f.status === 'pinned' ? 'generated' : 'pinned'
        };
      }
      return f;
    });
    onUpdateFlashcards(updated);
  };

  const deleteCard = (cardId) => {
    const updated = flashcards.filter(f => f.id !== cardId);
    onUpdateFlashcards(updated);
  };

  const addCard = () => {
    const newId = `f_custom_${Date.now()}`;
    const newCard = {
      id: newId,
      front: 'New Active-Recall Question?',
      back: 'Clear explanation and key concept answer.',
      requirement_ids: requirements.length > 0 ? [requirements[0].id] : [],
      status: 'edited'
    };
    onUpdateFlashcards([...flashcards, newCard]);
    startEditing(newCard);
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    await onRegenerateFlashcards('flashcards');
    setIsRegenerating(false);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 text-white shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-800/60">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Practice Flashcards</h2>
            <p className="text-xs text-slate-400">Total {flashcards.length} cards for active recall training</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={addCard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Card
          </button>

          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            Regenerate Flashcards
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {flashcards.map((card) => {
          const isEditing = editingId === card.id;

          return (
            <div
              key={card.id}
              className={`p-4 rounded-xl border transition-all space-y-3 ${
                card.status === 'pinned'
                  ? 'bg-slate-950/90 border-amber-800/60'
                  : card.status === 'edited'
                  ? 'bg-slate-950/90 border-indigo-800/50'
                  : 'bg-slate-950/60 border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-purple-300">
                    {card.id}
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      card.status === 'pinned'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : card.status === 'edited'
                        ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {card.status}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => togglePin(card.id)}
                    className={`p-1.5 rounded ${
                      card.status === 'pinned' ? 'text-amber-400 bg-amber-950/60' : 'text-slate-400 hover:text-amber-300'
                    }`}
                    title="Pin card"
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>

                  {!isEditing ? (
                    <button
                      onClick={() => startEditing(card)}
                      className="p-1.5 rounded text-slate-400 hover:text-indigo-300"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => saveEditing(card.id)}
                      className="p-1.5 rounded text-emerald-400"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => deleteCard(card.id)}
                    className="p-1.5 rounded text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">Front (Prompt)</label>
                    <textarea
                      value={editFront}
                      onChange={(e) => setEditFront(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">Back (Answer)</label>
                    <textarea
                      value={editBack}
                      onChange={(e) => setEditBack(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => saveEditing(card.id)}
                    className="w-full py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold"
                  >
                    Save Flashcard
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-100">
                    <span className="text-[10px] text-purple-400 block font-mono">Q:</span>
                    {card.front}
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800 text-xs text-slate-300">
                    <span className="text-[10px] text-emerald-400 block font-mono">A:</span>
                    {card.back}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
