'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';

export function QuestionEditorDrawer({
  isOpen,
  onClose,
  question,
  requirements = [],
  onSave
}) {
  const [prompt, setPrompt] = useState('');
  const [outline, setOutline] = useState('');
  const [category, setCategory] = useState('technical');
  const [difficulty, setDifficulty] = useState(3);
  const [selectedReqIds, setSelectedReqIds] = useState([]);

  useEffect(() => {
    if (question) {
      setPrompt(question.prompt || '');
      const outlineStr = Array.isArray(question.answer_outline)
        ? question.answer_outline.join('\n')
        : typeof question.answer_outline === 'string'
        ? question.answer_outline
        : '';
      setOutline(outlineStr);
      setCategory(question.category || 'technical');
      setDifficulty(question.difficulty || 3);
      setSelectedReqIds(question.requirement_ids || []);
    }
  }, [question]);

  if (!isOpen || !question) return null;

  const handleSave = () => {
    const updatedQuestion = {
      ...question,
      prompt,
      answer_outline: outline.split('\n').map(s => s.trim()).filter(Boolean),
      category,
      difficulty: Number(difficulty),
      requirement_ids: selectedReqIds,
      status: question.status === 'pinned' ? 'pinned' : 'edited',
      is_edited: true
    };
    onSave(updatedQuestion);
    onClose();
  };

  const toggleReq = (reqId) => {
    if (selectedReqIds.includes(reqId)) {
      setSelectedReqIds(selectedReqIds.filter(id => id !== reqId));
    } else {
      setSelectedReqIds([...selectedReqIds, reqId]);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Question Material"
      subtitle="Modify prompt, outline points, and difficulty rating."
      maxWidth="max-w-xl"
    >
      <div className="space-y-4 py-2 font-sans">
        <Textarea
          label="Question Prompt"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <Textarea
          label="Answer Outline (One point per line)"
          rows={5}
          value={outline}
          onChange={(e) => setOutline(e.target.value)}
          placeholder="• Key point 1&#10;• Key point 2"
        />

        <div className="grid grid-cols-2 gap-4 font-mono text-xs">
          <div className="space-y-1.5">
            <label className="block font-semibold uppercase tracking-wider text-slate-500">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-blue-600 rounded-lg text-slate-900"
            >
              <option value="technical">Technical</option>
              <option value="behavioural">Behavioural</option>
              <option value="system-design">System Design</option>
              <option value="company-fit">Company Fit</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold uppercase tracking-wider text-slate-500">
              Difficulty (1 to 5)
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-blue-600 rounded-lg text-slate-900"
            >
              <option value={1}>1 - Beginner</option>
              <option value={2}>2 - Easy</option>
              <option value={3}>3 - Intermediate</option>
              <option value={4}>4 - Advanced</option>
              <option value={5}>5 - Expert</option>
            </select>
          </div>
        </div>

        {requirements.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-200 font-mono text-xs">
            <label className="block font-semibold uppercase tracking-wider text-slate-500">
              Mapped Job Requirements
            </label>
            <div className="max-h-36 overflow-y-auto space-y-1.5 border border-slate-200 rounded-lg p-2 bg-slate-50">
              {requirements.map((r) => {
                const checked = selectedReqIds.includes(r.id);
                return (
                  <label key={r.id} className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleReq(r.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                    />
                    <span className="truncate">{r.text}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
