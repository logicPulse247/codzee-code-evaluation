'use client';

import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { RefreshCw } from 'lucide-react';

export function RegenerationModal({
  isOpen,
  onClose,
  categoryName,
  onConfirm,
  isRegenerating
}) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={isRegenerating ? undefined : onClose}
      title={`Regenerate ${categoryName || 'Category'} Questions`}
      subtitle="Refreshes questions using LLM synthesis while preserving custom content."
      maxWidth="max-w-md"
    >
      <div className="space-y-4 py-2 font-mono text-xs">
        <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-slate-700 leading-relaxed space-y-1">
          <p className="font-bold text-blue-700">Edit Preservation Policy:</p>
          <p>
            Any questions you have edited or pinned in this category will remain untouched. Only unpinned generated questions will be regenerated.
          </p>
        </div>

        <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isRegenerating}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={onConfirm} loading={isRegenerating}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerate Questions</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
