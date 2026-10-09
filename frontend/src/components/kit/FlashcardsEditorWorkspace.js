'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Textarea } from '../ui/Textarea';
import { Modal } from '../ui/Modal';
import { Plus, Trash2, RefreshCw, Pin, Layers } from 'lucide-react';

export function FlashcardsEditorWorkspace({
  flashcards = [],
  requirements = [],
  onUpdateFlashcards,
  onRegenerateFlashcards
}) {
  const [editingCard, setEditingCard] = useState(null);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handlePinToggle = (cardId) => {
    const updated = flashcards.map(c => {
      if (c.id === cardId) {
        return { ...c, status: c.status === 'pinned' ? 'generated' : 'pinned' };
      }
      return c;
    });
    onUpdateFlashcards(updated);
  };

  const handleDelete = (cardId) => {
    if (!confirm('Are you sure you want to delete this flashcard?')) return;
    onUpdateFlashcards(flashcards.filter(c => c.id !== cardId));
  };

  const handleSaveCard = () => {
    if (!editingCard) return;
    const updatedCard = {
      ...editingCard,
      front,
      back,
      status: editingCard.status === 'pinned' ? 'pinned' : 'edited'
    };

    const existingIdx = flashcards.findIndex(c => c.id === editingCard.id);
    let updated;
    if (existingIdx !== -1) {
      updated = [...flashcards];
      updated[existingIdx] = updatedCard;
    } else {
      updated = [...flashcards, updatedCard];
    }
    onUpdateFlashcards(updated);
    setEditingCard(null);
  };

  const handleAddCard = () => {
    const newCard = {
      id: `custom-fc-${Date.now()}`,
      front: 'Question or concept prompt...',
      back: 'Core answer explanation...',
      requirement_ids: [],
      status: 'edited'
    };
    setEditingCard(newCard);
    setFront(newCard.front);
    setBack(newCard.back);
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await onRegenerateFlashcards();
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-base font-bold font-serif text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Active-Recall Flashcards ({flashcards.length})</span>
          </h3>
          <p className="text-xs font-mono text-slate-500 mt-0.5">
            Flashcards mapped to job requirements for active recall practice.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRegenerate} loading={isRegenerating}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerate Flashcards</span>
          </Button>
          <Button variant="primary" size="sm" onClick={handleAddCard}>
            <Plus className="w-3.5 h-3.5" />
            <span>Add Card</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {flashcards.map((card, idx) => (
          <div
            key={card.id || idx}
            className={`p-4 rounded-xl border bg-white space-y-3 flex flex-col justify-between shadow-xs transition-all ${
              card.status === 'pinned'
                ? 'border-amber-300 bg-amber-50/40'
                : 'border-slate-200 hover:border-blue-300'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-xs text-slate-400">Card #{idx + 1}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePinToggle(card.id)}
                    className={`p-1 rounded cursor-pointer ${card.status === 'pinned' ? 'text-amber-700' : 'text-slate-400 hover:text-amber-600'}`}
                    title="Pin Flashcard"
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(card.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                    title="Delete Flashcard"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs font-semibold text-slate-900">{card.front}</p>
              <p className="text-xs text-slate-700 line-clamp-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono">
                {card.back}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              {card.status && (
                <Badge variant={card.status === 'pinned' ? 'pinned' : card.status === 'edited' ? 'edited' : 'generated'} size="sm">
                  {card.status.toUpperCase()}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingCard(card);
                  setFront(card.front);
                  setBack(card.back);
                }}
              >
                Edit Card
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={Boolean(editingCard)}
        onClose={() => setEditingCard(null)}
        title="Edit Flashcard"
        subtitle="Modify prompt and answer explanation"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 py-2">
          <Textarea
            label="Front (Question/Prompt)"
            rows={3}
            value={front}
            onChange={(e) => setFront(e.target.value)}
          />
          <Textarea
            label="Back (Answer / Explanation)"
            rows={5}
            value={back}
            onChange={(e) => setBack(e.target.value)}
          />
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditingCard(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveCard}>
              Save Flashcard
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
