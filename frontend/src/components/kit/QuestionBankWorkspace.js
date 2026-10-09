'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { QuestionItem } from './QuestionItem';
import { QuestionEditorDrawer } from './QuestionEditorDrawer';
import { RegenerationModal } from './RegenerationModal';
import { Plus, RefreshCw, HelpCircle } from 'lucide-react';

const CATEGORIES = [
  { key: 'technical', label: 'Technical' },
  { key: 'behavioural', label: 'Behavioural' },
  { key: 'system-design', label: 'System Design' },
  { key: 'company-fit', label: 'Company Fit' }
];

export function QuestionBankWorkspace({
  questions = [],
  requirements = [],
  onUpdateQuestions,
  onRegenerateCategory
}) {
  const [activeCategory, setActiveCategory] = useState('technical');
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const categoryQuestions = questions.filter(q => (q.category || 'technical') === activeCategory);

  const handlePinToggle = (questionId) => {
    const updated = questions.map(q => {
      if (q.id === questionId) {
        if (q.status === 'pinned') {
          // Restore the appropriate status when unpinning
          return {
            ...q,
            status: q.is_edited ? 'edited' : 'generated'
          };
        }
        return { ...q, status: 'pinned' };
      }
      return q;
    });
    onUpdateQuestions(updated);
  };

  const handleDeleteQuestion = (questionId) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    const updated = questions.filter(q => q.id !== questionId);
    onUpdateQuestions(updated);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const catQs = [...categoryQuestions];
    const item = catQs[index];
    const prevItem = catQs[index - 1];

    const itemGlobalIdx = questions.findIndex(q => q.id === item.id);
    const prevGlobalIdx = questions.findIndex(q => q.id === prevItem.id);

    const updated = [...questions];
    updated[itemGlobalIdx] = prevItem;
    updated[prevGlobalIdx] = item;

    onUpdateQuestions(updated);
  };

  const handleMoveDown = (index) => {
    if (index === categoryQuestions.length - 1) return;
    const catQs = [...categoryQuestions];
    const item = catQs[index];
    const nextItem = catQs[index + 1];

    const itemGlobalIdx = questions.findIndex(q => q.id === item.id);
    const nextGlobalIdx = questions.findIndex(q => q.id === nextItem.id);

    const updated = [...questions];
    updated[itemGlobalIdx] = nextItem;
    updated[nextGlobalIdx] = item;

    onUpdateQuestions(updated);
  };

  const handleSaveQuestion = (updatedQuestion) => {
    // Ensure the edited flag is always set so regeneration skips this question
    const withEditFlag = {
      ...updatedQuestion,
      is_edited: true,
      status: updatedQuestion.status === 'pinned' ? 'pinned' : 'edited'
    };
    const existingIdx = questions.findIndex(q => q.id === withEditFlag.id);
    let updated;
    if (existingIdx !== -1) {
      updated = [...questions];
      updated[existingIdx] = withEditFlag;
    } else {
      updated = [...questions, withEditFlag];
    }
    onUpdateQuestions(updated);
  };

  const handleAddQuestion = () => {
    const newQuestion = {
      id: `custom-q-${Date.now()}`,
      prompt: 'New custom question prompt...',
      answer_outline: ['Key point 1', 'Key point 2'],
      category: activeCategory,
      difficulty: 3,
      requirement_ids: requirements.length > 0 ? [requirements[0].id] : [],
      status: 'edited',
      is_edited: true
    };
    setEditingQuestion(newQuestion);
  };

  const handleRegenerateConfirm = async () => {
    setIsRegenerating(true);
    try {
      await onRegenerateCategory(activeCategory);
    } finally {
      setIsRegenerating(false);
      setShowRegenModal(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-900">
      {/* Workspace Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-base font-bold font-serif text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>Interview Question Bank ({questions.length})</span>
          </h3>
          <p className="text-xs font-mono text-slate-500 mt-0.5">
            Structured questions categorized by topic and mapped to requirements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowRegenModal(true)}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerate Category</span>
          </Button>

          <Button variant="primary" size="sm" onClick={handleAddQuestion}>
            <Plus className="w-3.5 h-3.5" />
            <span>Add Question</span>
          </Button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 font-mono text-xs overflow-x-auto">
        {CATEGORIES.map((cat) => {
          const count = questions.filter(q => (q.category || 'technical') === cat.key).length;
          const isActive = activeCategory === cat.key;

          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-2 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Question List */}
      <div className="space-y-4">
        {categoryQuestions.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-slate-500 border border-slate-200 rounded-xl space-y-3 bg-white">
            <p>No questions in the {activeCategory} category yet.</p>
            <Button variant="outline" size="sm" onClick={handleAddQuestion}>
              <Plus className="w-3.5 h-3.5" />
              <span>Add Question</span>
            </Button>
          </div>
        ) : (
          categoryQuestions.map((q, idx) => (
            <QuestionItem
              key={q.id || idx}
              question={q}
              index={idx}
              total={categoryQuestions.length}
              requirements={requirements}
              onEdit={(question) => setEditingQuestion(question)}
              onPinToggle={handlePinToggle}
              onDelete={handleDeleteQuestion}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
          ))
        )}
      </div>

      {/* Edit Drawer */}
      <QuestionEditorDrawer
        isOpen={Boolean(editingQuestion)}
        onClose={() => setEditingQuestion(null)}
        question={editingQuestion}
        requirements={requirements}
        onSave={handleSaveQuestion}
      />

      {/* Regeneration Modal */}
      <RegenerationModal
        isOpen={showRegenModal}
        onClose={() => setShowRegenModal(false)}
        categoryName={CATEGORIES.find(c => c.key === activeCategory)?.label}
        onConfirm={handleRegenerateConfirm}
        isRegenerating={isRegenerating}
      />
    </div>
  );
}
