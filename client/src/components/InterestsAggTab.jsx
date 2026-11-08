import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import Pagination from './Pagination';
import { useAuth } from '../context/AuthContext';

export default function InterestsAggTab() {
  const { user } = useAuth();
  const [interestGroups, setInterestGroups] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalGroups, setTotalGroups] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchInterests = async (pageNum = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosClient.get(`/users/aggregations/interests?page=${pageNum}&limit=6`);
      setInterestGroups(res.data.interests || []);
      setPage(res.data.pagination.page);
      setTotalPages(res.data.pagination.totalPages);
      setTotalGroups(res.data.pagination.total);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to load aggregation. Note: this endpoint requires Admin role.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterests(page);
  }, [page]);

  return (
    <div className="space-y-7">
      {/* Header & Pipeline explanation */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Scenario 1: Users Grouped by Interests
        </h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          MongoDB Aggregation Pipeline: <code className="bg-slate-100 text-indigo-700 px-2 py-0.5 rounded-lg font-mono">$match</code> (filters with <code className="bg-slate-100 text-emerald-700 px-2 py-0.5 rounded-lg font-mono">{`{ interests: { $gt: '' } }`}</code> to trigger <code className="text-amber-700 font-semibold">IXSCAN</code> on <code className="bg-slate-100 px-2 py-0.5 rounded-lg font-mono">{`{ interests: 1 }`}</code>) → <code className="bg-slate-100 text-indigo-700 px-2 py-0.5 rounded-lg font-mono">$unwind</code> → <code className="bg-slate-100 text-indigo-700 px-2 py-0.5 rounded-lg font-mono">$group</code> → <code className="bg-slate-100 text-indigo-700 px-2 py-0.5 rounded-lg font-mono">$facet</code> (single-call pagination).
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-600 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">Endpoint:</span>{' '}
            <code className="text-indigo-600 font-mono bg-white px-2 py-0.5 rounded-md border border-slate-200">
              GET /api/v1/users/aggregations/interests
            </code>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">Access:</span>{' '}
            <span className="font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              Authenticated (User & Admin)
            </span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="font-semibold text-slate-700">Total Distinct Interests:</span>{' '}
            <strong className="text-slate-900 px-2 py-0.5 rounded-md bg-white border border-slate-200">
              {totalGroups}
            </strong>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500">
          Executing aggregation pipeline on MongoDB Atlas...
        </div>
      ) : interestGroups.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
          No interest groups returned.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {interestGroups.map((group) => (
              <div
                key={group._id}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs hover:border-indigo-300/80 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-sm font-bold text-slate-900 capitalize tracking-tight">
                      {group._id}
                    </span>
                    <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                      {group.count} {group.count === 1 ? 'user' : 'users'}
                    </span>
                  </div>
                  <div className="mt-3.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                      Users with this interest
                    </span>
                    <ul className="space-y-2">
                      {group.users?.map((u) => (
                        <li
                          key={u._id}
                          className="text-xs text-slate-700 flex items-center justify-between bg-slate-50/80 hover:bg-slate-100/80 px-3 py-2 rounded-xl transition"
                        >
                          <span className="font-medium text-slate-900">{u.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {u._id.slice(-6)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
