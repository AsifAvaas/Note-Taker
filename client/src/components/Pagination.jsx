import React from 'react';

export default function Pagination({ page, totalPages, onPageChange }) {
  return (
    <div className="flex items-center justify-between border-t border-slate-200/80 pt-4 mt-6 text-xs sm:text-sm text-slate-600">
      <span>
        Page <strong className="font-semibold text-slate-900">{page}</strong> of{' '}
        <strong className="font-semibold text-slate-900">{totalPages || 1}</strong>
      </span>
      <div className="space-x-2.5">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-4 py-2 border border-slate-300 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-medium disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer disabled:cursor-not-allowed shadow-2xs active:scale-98"
        >
          Previous
        </button>
        <button
          disabled={page >= (totalPages || 1)}
          onClick={() => onPageChange(page + 1)}
          className="px-4 py-2 border border-slate-300 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-medium disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer disabled:cursor-not-allowed shadow-2xs active:scale-98"
        >
          Next
        </button>
      </div>
    </div>
  );
}
