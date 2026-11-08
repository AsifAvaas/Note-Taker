import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import Pagination from './Pagination';

export default function MyNotesTab() {
  const [notes, setNotes] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotes, setTotalNotes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState(null);

  // Senior Architecture Verification states (.explain() & CastError test)
  const [indexProof, setIndexProof] = useState(null);
  const [loadingProof, setLoadingProof] = useState(false);
  const [castTestResult, setCastTestResult] = useState(null);

  const fetchNotes = async (pageNum = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosClient.get(`/notes?page=${pageNum}&limit=5`);
      setNotes(res.data.notes || []);
      setPage(res.data.pagination.page);
      setTotalPages(res.data.pagination.totalPages);
      setTotalNotes(res.data.pagination.total);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes(page);
  }, [page]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setError('');
    setSuccess('');

    try {
      if (editingId) {
        await axiosClient.put(`/notes/${editingId}`, { title, content });
        setSuccess('Note updated successfully!');
      } else {
        await axiosClient.post('/notes', { title, content });
        setSuccess('Note created successfully!');
      }
      setTitle('');
      setContent('');
      setEditingId(null);
      fetchNotes(editingId ? page : 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (note) => {
    setEditingId(note._id);
    setTitle(note.title);
    setContent(note.content);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    setError('');
    setSuccess('');
    try {
      await axiosClient.delete(`/notes/${id}`);
      setSuccess('Note deleted successfully!');
      fetchNotes(page);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete note');
    }
  };

  const handleRunIndexProof = async () => {
    setLoadingProof(true);
    setCastTestResult(null);
    try {
      const res = await axiosClient.get('/notes/verify-indexes');
      setIndexProof(res.data.proof);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to run index verification');
    } finally {
      setLoadingProof(false);
    }
  };

  const handleTestCastError = async () => {
    setIndexProof(null);
    try {
      await axiosClient.get('/notes/invalid-object-id-123');
    } catch (err) {
      setCastTestResult({
        status: err.response?.status,
        errorType: err.response?.data?.errorType,
        message: err.response?.data?.message
      });
    }
  };

  return (
    <div className="space-y-7">
      {/* Informational banner about RBAC, Index & Live Verification Tools */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 text-xs text-slate-600 space-y-4 shadow-xs">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-800">Endpoint:</span>{' '}
            <code className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg text-indigo-700 font-mono">
              GET /api/v1/notes
            </code>
            <span className="ml-2 font-semibold text-slate-800">Index Used:</span>{' '}
            <code className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg text-emerald-700 font-mono">
              {`{ author: 1, _id: -1 }`}
            </code>
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg font-medium">
              .lean() Enabled
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRunIndexProof}
              disabled={loadingProof}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition cursor-pointer shadow-2xs active:scale-98"
            >
              {loadingProof ? 'Running .explain()...' : '⚡ Verify IXSCAN (.explain)'}
            </button>
            <button
              type="button"
              onClick={handleTestCastError}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl transition cursor-pointer shadow-2xs active:scale-98"
            >
              🛡️ Test CastError (400)
            </button>
            <span className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-700">
              Total notes: <strong className="text-slate-900">{totalNotes}</strong>
            </span>
          </div>
        </div>

        {/* Live .explain('executionStats') Output Panel */}
        {indexProof && (
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 font-mono text-[11px] space-y-2 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-emerald-400 font-bold">
                [LIVE MONGODB .explain('executionStats') PROOF]
              </span>
              <button
                onClick={() => setIndexProof(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              <div className="bg-slate-800/80 p-2.5 rounded-xl">
                <span className="text-slate-400 block text-[10px]">Winning Plan Stage</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {indexProof.winningPlanStage}
                </span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl">
                <span className="text-slate-400 block text-[10px]">Index Name</span>
                <span className="text-indigo-300 font-bold text-sm">{indexProof.indexName}</span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl">
                <span className="text-slate-400 block text-[10px]">COLLSCAN Detected</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {indexProof.collscanDetected ? 'YES' : 'NO (0 Full Scans)'}
                </span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl">
                <span className="text-slate-400 block text-[10px]">Total Keys Examined</span>
                <span className="text-white font-semibold">{indexProof.totalKeysExamined}</span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl">
                <span className="text-slate-400 block text-[10px]">Total Docs Examined</span>
                <span className="text-white font-semibold">{indexProof.totalDocsExamined}</span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl">
                <span className="text-slate-400 block text-[10px]">Execution Time</span>
                <span className="text-white font-semibold">{indexProof.executionTimeMillis}ms</span>
              </div>
            </div>
          </div>
        )}

        {/* Live CastError Normalization Output Panel */}
        {castTestResult && (
          <div className="bg-amber-50/90 border border-amber-200 text-amber-950 rounded-2xl p-4 text-xs flex items-center justify-between gap-4">
            <div>
              <span className="font-bold">
                Global Error Middleware Verified (HTTP {castTestResult.status} -{' '}
                {castTestResult.errorType}):
              </span>{' '}
              <code className="bg-white px-2 py-0.5 rounded border border-amber-200 font-mono">
                {castTestResult.message}
              </code>
            </div>
            <button
              onClick={() => setCastTestResult(null)}
              className="text-amber-700 hover:text-amber-950 font-semibold cursor-pointer shrink-0"
            >
              ✕ Dismiss
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-medium">
          {success}
        </div>
      )}

      {/* Note Creation/Edit Form */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900">
            {editingId ? 'Edit Personal Note' : 'Create a New Personal Note'}
          </h3>
          {editingId && (
            <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full font-medium">
              Editing Note
            </span>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Note Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. MongoDB Aggregation Notes"
              required
              className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Note Content</label>
            <textarea
              rows="3"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note content here..."
              required
              className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
            />
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs active:scale-98"
            >
              {editingId ? 'Update Note' : 'Save Note'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Notes List */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-slate-900">Your Notes</h3>
          <span className="text-xs text-slate-500 font-medium">Sorted: newest first (_id: -1)</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading notes from database...</div>
        ) : notes.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
            No notes found. Create your first note using the form above!
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note._id}
                className="p-5 border border-slate-200/80 rounded-2xl hover:border-indigo-300/80 bg-white hover:bg-indigo-50/10 transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="font-semibold text-slate-900 text-sm">{note.title}</h4>
                    <span className="text-[11px] font-medium text-slate-400 shrink-0">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono text-[10px]">ID: {note._id}</span>
                  <div className="space-x-2">
                    <button
                      onClick={() => handleEdit(note)}
                      className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-lg transition cursor-pointer text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(note._id)}
                      className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium rounded-lg transition cursor-pointer text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
