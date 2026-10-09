'use client';

import { useState } from 'react';
import {
  HelpCircle, Plus, Trash2, ArrowUp, ArrowDown, Pin, PinOff,
  Edit2, Save, RefreshCw, Check, Sparkles
} from 'lucide-react';

const CATEGORIES = [
  { key: 'technical', label: 'Technical' },
  { key: 'behavioural', label: 'Behavioural' },
  { key: 'system-design', label: 'System Design' },
  { key: 'company-fit', label: 'Company Fit' }
];

export default function QuestionBankEditor({ questions, requirements, onUpdateQuestions, onRegenerateCategory }) {
  const [activeCategory, setActiveCategory] = useState('technical');
  const [editingId, setEditingId] = useState(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [editDifficulty, setEditDifficulty] = useState(2);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const categoryQuestions = questions.filter(q => q.category === activeCategory);

  const handleUpdateQuestions = (newQuestions) => {
    const pinned = newQuestions.filter(q => q.status === 'pinned');
    const unpinned = newQuestions.filter(q => q.status !== 'pinned');
    onUpdateQuestions([...pinned, ...unpinned]);
  };

  const startEditing = (q) => {
    setEditingId(q.id);
    setEditPrompt(q.prompt);
    setEditAnswer(q.answer_outline || '');
    setEditDifficulty(q.difficulty || 2);
  };

  const saveEditing = (qId) => {
    const updated = questions.map(q => {
      if (q.id === qId) {
        return {
          ...q,
          prompt: editPrompt,
          answer_outline: editAnswer,
          difficulty: Number(editDifficulty),
          status: q.status === 'pinned' ? 'pinned' : 'edited',
          is_edited: true
        };
      }
      return q;
    });
    handleUpdateQuestions(updated);
    setEditingId(null);
  };

  const togglePin = (qId) => {
    const updated = questions.map(q => {
      if (q.id === qId) {
        return {
          ...q,
          status: q.status === 'pinned' ? (q.is_edited ? 'edited' : 'generated') : 'pinned'
        };
      }
      return q;
    });
    handleUpdateQuestions(updated);
  };

  const moveQuestion = (qId, direction) => {
    const catIndex = categoryQuestions.findIndex(q => q.id === qId);
    if (catIndex === -1) return;
    
    const targetCatIndex = direction === 'up' ? catIndex - 1 : catIndex + 1;
    if (targetCatIndex < 0 || targetCatIndex >= categoryQuestions.length) return;

    const currentQ = categoryQuestions[catIndex];
    const targetQ = categoryQuestions[targetCatIndex];

    if (currentQ.status !== 'pinned' && targetQ.status === 'pinned') return;
    if (currentQ.status === 'pinned' && targetQ.status !== 'pinned') return;

    const globalIndex1 = questions.findIndex(q => q.id === qId);
    const globalIndex2 = questions.findIndex(q => q.id === targetQ.id);

    const newArr = [...questions];
    const temp = newArr[globalIndex1];
    newArr[globalIndex1] = newArr[globalIndex2];
    newArr[globalIndex2] = temp;

    handleUpdateQuestions(newArr);
  };

  const changeCategory = (qId, newCat) => {
    const updated = questions.map(q => {
      if (q.id === qId) {
        return { ...q, category: newCat, status: q.status === 'pinned' ? 'pinned' : 'edited' };
      }
      return q;
    });
    handleUpdateQuestions(updated);
  };

  const deleteQuestion = (qId) => {
    const updated = questions.filter(q => q.id !== qId);
    handleUpdateQuestions(updated);
  };

  const addQuestion = () => {
    const newId = `q_custom_${Date.now()}`;
    const newQ = {
      id: newId,
      requirement_ids: requirements.length > 0 ? [requirements[0].id] : [],
      category: activeCategory,
      prompt: 'New custom interview question prompt...',
      answer_outline: 'Outline key points to look for in candidate response.',
      difficulty: 2,
      status: 'edited'
    };
    handleUpdateQuestions([...questions, newQ]);
    startEditing(newQ);
  };

  const handleRegenerateCategory = async () => {
    setIsRegenerating(true);
    await onRegenerateCategory(activeCategory);
    setIsRegenerating(false);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 text-white shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-950/80 text-indigo-400 border border-indigo-800/60">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Interview Question Bank</h2>
            <p className="text-xs text-slate-400">Total {questions.length} questions mapped to role requirements</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={addQuestion}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Question
          </button>

          <button
            onClick={handleRegenerateCategory}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            Regenerate {activeCategory}
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800/80 pb-3">
        {CATEGORIES.map(cat => {
          const count = questions.filter(q => q.category === cat.key).length;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeCategory === cat.key
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>{cat.label}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-900/60 text-[10px]">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Questions list */}
      <div className="space-y-4">
        {categoryQuestions.length === 0 ? (
          <div className="text-center py-10 bg-slate-950/40 rounded-xl border border-slate-800/60">
            <HelpCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-400">No questions in this category yet.</p>
            <button
              onClick={addQuestion}
              className="mt-3 text-xs text-indigo-400 hover:underline font-semibold"
            >
              + Add a question
            </button>
          </div>
        ) : (
          categoryQuestions.map((q, idx) => {
            const isEditing = editingId === q.id;

            return (
              <div
                key={q.id}
                className={`p-4 rounded-xl border transition-all space-y-3 ${
                  q.status === 'pinned'
                    ? 'bg-slate-950/90 border-amber-800/60 shadow-md'
                    : q.status === 'edited'
                    ? 'bg-slate-950/90 border-indigo-800/50'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Header bar */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
                      {q.id}
                    </span>

                    {/* Status Badges */}
                    <div className="flex items-center gap-1.5">
                      {q.status === 'pinned' && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 bg-amber-950 text-amber-300 border border-amber-800">
                          <Pin className="w-2.5 h-2.5" />
                          pinned
                        </span>
                      )}
                      
                      {(q.status === 'edited' || q.is_edited) && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 bg-indigo-950 text-indigo-300 border border-indigo-800">
                          edited
                        </span>
                      )}

                      {q.status === 'generated' && !q.is_edited && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 bg-slate-800 text-slate-400">
                          generated
                        </span>
                      )}
                    </div>

                    {/* Difficulty Badge */}
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                      Diff: {q.difficulty || 2}/3
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Move up / down */}
                    <button
                      onClick={() => q.status !== 'pinned' && moveQuestion(q.id, 'up')}
                      disabled={q.status === 'pinned'}
                      className={`p-1 rounded ${q.status === 'pinned' ? 'text-slate-700 cursor-not-allowed' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
                      title={q.status === 'pinned' ? "Cannot move pinned question" : "Move Up"}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => q.status !== 'pinned' && moveQuestion(q.id, 'down')}
                      disabled={q.status === 'pinned'}
                      className={`p-1 rounded ${q.status === 'pinned' ? 'text-slate-700 cursor-not-allowed' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
                      title={q.status === 'pinned' ? "Cannot move pinned question" : "Move Down"}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Pin button */}
                    <button
                      onClick={() => togglePin(q.id)}
                      className={`p-1.5 rounded transition-colors ${
                        q.status === 'pinned'
                          ? 'text-amber-400 bg-amber-950/60 border border-amber-800'
                          : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'
                      }`}
                      title={q.status === 'pinned' ? 'Unpin' : 'Pin (protect from regeneration)'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit button */}
                    {!isEditing ? (
                      <button
                        onClick={() => startEditing(q)}
                        className="p-1.5 rounded text-slate-400 hover:text-indigo-300 hover:bg-slate-800"
                        title="Edit question"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => saveEditing(q.id)}
                        className="p-1.5 rounded text-emerald-400 hover:bg-emerald-950/60"
                        title="Save changes"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={() => deleteQuestion(q.id)}
                      className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                      title="Delete question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Question Content */}
                {isEditing ? (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Question Prompt</label>
                      <textarea
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        rows={2}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Answer Outline</label>
                      <textarea
                        value={editAnswer}
                        onChange={(e) => setEditAnswer(e.target.value)}
                        rows={3}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-400">Difficulty:</span>
                        <select
                          value={editDifficulty}
                          onChange={(e) => setEditDifficulty(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                        >
                          <option value={1}>1 - Easy</option>
                          <option value={2}>2 - Medium</option>
                          <option value={3}>3 - Hard</option>
                        </select>
                      </div>

                      <button
                        onClick={() => saveEditing(q.id)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold"
                      >
                        Done Editing
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-100 leading-snug">{q.prompt}</p>

                    {q.answer_outline && (
                      <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs text-slate-300 space-y-1">
                        <span className="font-bold text-indigo-400 block uppercase tracking-wider text-[10px]">
                          Key Answer Outline:
                        </span>
                        <p className="leading-relaxed">{q.answer_outline}</p>
                      </div>
                    )}

                    {/* Requirement Mappings */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-500 font-semibold">Covers Requirements:</span>
                      {(q.requirement_ids || []).map((rid) => (
                        <span key={rid} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/80 border border-indigo-800/60 text-indigo-300">
                          {rid}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
