import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import Pagination from './Pagination';

export default function PostsLookupTab() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Create post state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState('');
  const [createErr, setCreateErr] = useState('');

  // Lookup state
  const [targetUserId, setTargetUserId] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupPage, setLookupPage] = useState(1);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [lookupError, setLookupError] = useState('');

  const fetchPosts = async (pageNum = 1) => {
    setLoadingPosts(true);
    try {
      const res = await axiosClient.get(`/posts?page=${pageNum}&limit=5`);
      setPosts(res.data.posts || []);
      setPage(res.data.pagination.page);
      setTotalPages(res.data.pagination.totalPages);
      setTotalPosts(res.data.pagination.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchPosts(page);
  }, [page]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setCreating(true);
    setCreateMsg('');
    setCreateErr('');
    try {
      await axiosClient.post('/posts', { title, content });
      setCreateMsg('Post created successfully!');
      setTitle('');
      setContent('');
      fetchPosts(1);
    } catch (err) {
      setCreateErr(err.response?.data?.message || 'Failed to create post');
    } finally {
      setCreating(false);
    }
  };

  const handleTriggerLookup = async (userId, pageNum = 1) => {
    if (!userId) return;
    setTargetUserId(userId);
    setLoadingLookup(true);
    setLookupError('');
    try {
      const res = await axiosClient.get(`/users/${userId}/posts?page=${pageNum}&limit=5`);
      setLookupResult(res.data.user);
      setLookupPage(pageNum);
      const el = document.getElementById('lookup-results-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      setLookupError(err.response?.data?.message || 'Failed to perform $lookup query');
      setLookupResult(null);
    } finally {
      setLoadingLookup(false);
    }
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Scenario 2: User Posts via Paginated <code className="text-indigo-600 font-mono">$lookup</code>
        </h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Demonstrates MongoDB inner pipeline <code className="bg-slate-100 text-indigo-700 px-2 py-0.5 rounded-lg font-mono">$lookup</code> matching on <code className="bg-slate-100 text-emerald-700 px-2 py-0.5 rounded-lg font-mono">posts</code> with sorting and pagination backed by index <code className="bg-slate-100 text-emerald-700 px-2 py-0.5 rounded-lg font-mono">{`{ author: 1, _id: -1 }`}</code>, plus strict zero-leak projection.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Left Column: Create Post & Feed */}
        <div className="lg:col-span-7 space-y-7">
          {/* Section A: Create Post */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4">Create a Public Post</h3>
            {createMsg && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200 font-medium">
                {createMsg}
              </div>
            )}
            {createErr && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 font-medium">
                {createErr}
              </div>
            )}
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Post title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
                />
              </div>
              <div>
                <textarea
                  rows="2"
                  placeholder="What would you like to share?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50 shadow-xs active:scale-98"
              >
                {creating ? 'Publishing...' : 'Publish Post'}
              </button>
            </form>
          </div>

          {/* Section B: All Public Posts */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-slate-900">Public Posts Feed</h3>
              <span className="text-xs bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1 rounded-full font-medium">
                Total: {totalPosts} posts
              </span>
            </div>

            {loadingPosts ? (
              <div className="py-12 text-center text-xs text-slate-500">Loading posts...</div>
            ) : posts.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                No posts yet. Publish the first one above!
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div
                    key={post._id}
                    className="p-5 border border-slate-200/80 rounded-2xl bg-white hover:border-slate-300 transition-all shadow-2xs hover:shadow-xs"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <span className="font-semibold text-slate-800">
                        {post.author?.name || 'Unknown Author'}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{post.title}</h4>
                    <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{post.content}</p>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">
                        Author ID: {post.author?._id || post.author}
                      </span>
                      <button
                        onClick={() => handleTriggerLookup(post.author?._id || post.author)}
                        className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-98"
                      >
                        <span>View All Posts by This User ($lookup)</span>
                        <span>→</span>
                      </button>
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

        {/* Right Column: Section C ($lookup Result Inspection Box) */}
        <div id="lookup-results-section" className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs sticky top-24">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                $lookup Aggregation Result
              </h3>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                GET /users/:id/posts
              </span>
            </div>

            {/* Manual User ID input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Enter User ObjectId..."
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
              />
              <button
                onClick={() => handleTriggerLookup(targetUserId, 1)}
                disabled={loadingLookup || !targetUserId.trim()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50 shadow-xs active:scale-98"
              >
                Inspect
              </button>
            </div>

            {lookupError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs mb-3 font-medium">
                {lookupError}
              </div>
            )}

            {loadingLookup ? (
              <div className="py-16 text-center text-xs text-slate-500">
                Running $lookup aggregation pipeline on MongoDB...
              </div>
            ) : !lookupResult ? (
              <div className="py-16 text-center text-xs text-slate-400 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 px-4">
                Click <strong>"View All Posts by This User ($lookup)"</strong> on any post in the feed or enter a User ID above to inspect joined posts.
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* User Info from $match */}
                <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-1">
                  <div className="font-bold text-slate-900 text-sm">
                    {lookupResult.name}
                  </div>
                  <div className="text-slate-600">{lookupResult.email}</div>
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      ID: {lookupResult._id}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] bg-slate-200/80 text-slate-700 rounded-md font-medium">
                      Password Hash: [EXCLUDED by $project]
                    </span>
                  </div>
                </div>

                {/* Joined Posts via $lookup inner pipeline */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                      Joined Posts ({lookupResult.posts?.length || 0})
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Sorted: _id -1 (Compound Index)
                    </span>
                  </div>

                  {lookupResult.posts?.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-xl text-slate-500 text-center">
                      No posts found for this user.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {lookupResult.posts?.map((p) => (
                        <div
                          key={p._id}
                          className="p-3.5 border border-indigo-100 bg-indigo-50/40 rounded-xl"
                        >
                          <div className="font-semibold text-slate-900">{p.title}</div>
                          <p className="text-slate-600 mt-1 leading-relaxed">{p.content}</p>
                          <span className="block mt-2 font-mono text-[9px] text-slate-400">
                            Post ID: {p._id}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inner Pagination trigger */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                    <span className="font-medium">Page {lookupPage}</span>
                    <div className="space-x-1.5">
                      <button
                        disabled={lookupPage <= 1}
                        onClick={() => handleTriggerLookup(targetUserId, lookupPage - 1)}
                        className="px-2.5 py-1 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => handleTriggerLookup(targetUserId, lookupPage + 1)}
                        className="px-2.5 py-1 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 transition cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>

                {/* Raw JSON viewer */}
                <details className="mt-3 text-[10px]">
                  <summary className="cursor-pointer text-slate-500 hover:text-slate-700 font-medium py-1">
                    View Raw Aggregation JSON Output
                  </summary>
                  <pre className="mt-2 p-3 bg-slate-900 text-slate-200 rounded-2xl overflow-x-auto max-h-48 text-[10px] leading-relaxed">
                    {JSON.stringify(lookupResult, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
