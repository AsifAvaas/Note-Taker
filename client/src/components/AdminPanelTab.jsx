import React, { useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";
import Pagination from "./Pagination";

export default function AdminPanelTab() {
  // Users state
  const [users, setUsers] = useState([]);
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // User form state (create or edit)
  const [editingUserId, setEditingUserId] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("User");
  const [interests, setInterests] = useState("");
  const [formMsg, setFormMsg] = useState("");
  const [formErr, setFormErr] = useState("");

  // All notes state
  const [allNotes, setAllNotes] = useState([]);
  const [notePage, setNotePage] = useState(1);
  const [noteTotalPages, setNoteTotalPages] = useState(1);
  const [totalAllNotes, setTotalAllNotes] = useState(0);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [rbacTestMsg, setRbacTestMsg] = useState("");

  // Fetch Users
  const fetchUsers = async (p = 1) => {
    setLoadingUsers(true);
    try {
      const res = await axiosClient.get(`/users?page=${p}&limit=5`);
      setUsers(res.data.users || []);
      setUserPage(res.data.pagination.page);
      setUserTotalPages(res.data.pagination.totalPages);
      setTotalUsers(res.data.pagination.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch All Notes (Admin only)
  const fetchAllNotes = async (p = 1) => {
    setLoadingNotes(true);
    try {
      const res = await axiosClient.get(`/notes/admin/all?page=${p}&limit=5`);
      setAllNotes(res.data.notes || []);
      setNotePage(res.data.pagination.page);
      setNoteTotalPages(res.data.pagination.totalPages);
      setTotalAllNotes(res.data.pagination.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingNotes(false);
    }
  };

  useEffect(() => {
    fetchUsers(userPage);
  }, [userPage]);

  useEffect(() => {
    fetchAllNotes(notePage);
  }, [notePage]);

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setFormMsg("");
    setFormErr("");

    const payload = {
      name,
      email,
      role,
      interests: interests
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean),
    };
    if (password) payload.password = password;

    try {
      if (editingUserId) {
        await axiosClient.put(`/users/${editingUserId}`, payload);
        setFormMsg("User updated successfully!");
      } else {
        await axiosClient.post("/users", payload);
        setFormMsg("User created successfully!");
      }
      setName("");
      setEmail("");
      setPassword("");
      setRole("User");
      setInterests("");
      setEditingUserId(null);
      fetchUsers(editingUserId ? userPage : 1);
    } catch (err) {
      setFormErr(err.response?.data?.message || "Operation failed");
    }
  };

  const handleEditClick = (u) => {
    setEditingUserId(u._id);
    setName(u.name);
    setEmail(u.email);
    setPassword("");
    setRole(u.role);
    setInterests(u.interests?.join(", ") || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelUserEdit = () => {
    setEditingUserId(null);
    setName("");
    setEmail("");
    setPassword("");
    setRole("User");
    setInterests("");
  };

  const handleDeleteUser = async (u) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${u.name}? This will CASCADE DELETE all of their notes and posts!`,
      )
    ) {
      return;
    }
    try {
      const res = await axiosClient.delete(`/users/${u._id}`);
      alert(
        `User deleted!\nCascade details:\n- Notes deleted: ${res.data.notesDeleted}\n- Posts deleted: ${res.data.postsDeleted}`,
      );
      fetchUsers(userPage);
      fetchAllNotes(notePage);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user");
    }
  };

  // RBAC Demonstration: Admin attempts to edit/delete other user's note
  const handleTestRbacDelete = async (note) => {
    setRbacTestMsg("");
    try {
      await axiosClient.delete(`/notes/${note._id}`);
      setRbacTestMsg(`Deleted own note (${note.title}) successfully.`);
      fetchAllNotes(notePage);
    } catch (err) {
      if (err.response?.status === 404) {
        setRbacTestMsg(
          `RBAC Verified! Delete rejected with 404: "Note not found or unauthorized to delete". Admins cannot delete other users' notes.`,
        );
      } else {
        setRbacTestMsg(`Error: ${err.response?.data?.message}`);
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Informational banner */}
      <div className="bg-amber-500/10 border border-amber-500/25 rounded-3xl p-6 text-xs text-amber-950 shadow-2xs">
        <div className="font-bold text-sm mb-1.5 flex items-center gap-2">
          <span>👑</span>
          <span>Admin Control Center (RBAC & Cascade Deletion Engine)</span>
        </div>
        <p className="leading-relaxed text-amber-900/90">
          As an <strong>Admin</strong>, you have full privileges to list,
          create, edit, and cascade-delete users, as well as inspect all notes
          across the entire database. Note that the strict RBAC security model
          prevents even Admins from editing or deleting notes created by other
          users.
        </p>
      </div>

      {/* Sub-section A: Manage All Users */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Manage Users CRUD
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Admin can set roles and trigger cascade deletions via{" "}
              <code className="bg-slate-100 text-indigo-700 px-2 py-0.5 rounded-lg font-mono">
                DELETE /api/v1/users/:id
              </code>
              .
            </p>
          </div>
          <span className="text-xs bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1 rounded-full font-medium">
            Total Users: {totalUsers}
          </span>
        </div>

        {formMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200 font-medium">
            {formMsg}
          </div>
        )}
        {formErr && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 font-medium">
            {formErr}
          </div>
        )}

        {/* User Form */}
        <form
          onSubmit={handleSaveUser}
          className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 text-xs space-y-4"
        >
          <div className="font-bold text-slate-800 text-sm">
            {editingUserId
              ? "Edit User Details"
              : "Add New User (Admin Create)"}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">
                Password {editingUserId && "(Leave blank to keep)"}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password123!"
                required={!editingUserId}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
              >
                <option value="User">User</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1.5">
              Interests (comma-separated, e.g. "chess, coding, reading")
            </label>
            <input
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="e.g. coding, chess, design"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition cursor-pointer shadow-xs active:scale-98"
            >
              {editingUserId ? "Save Changes" : "Create User"}
            </button>
            {editingUserId && (
              <button
                type="button"
                onClick={handleCancelUserEdit}
                className="px-5 py-2.5 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 rounded-xl font-medium transition cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Users Table */}
        {loadingUsers ? (
          <div className="py-10 text-center text-xs text-slate-500">
            Loading users...
          </div>
        ) : (
          <div className="border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="px-4 py-3.5">Name</th>
                    <th className="px-4 py-3.5">Email</th>
                    <th className="px-4 py-3.5">Role</th>
                    <th className="px-4 py-3.5">Interests</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        {u.name}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{u.email}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
                            u.role === "Admin"
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {u.interests?.length ? (
                          <div className="flex flex-wrap gap-1">
                            {u.interests.map((int, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-slate-100 rounded-md text-[11px] text-slate-700"
                              >
                                {int}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleEditClick(u)}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        >
                          Cascade Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50/60 border-t border-slate-200/80">
              <Pagination
                page={userPage}
                totalPages={userTotalPages}
                onPageChange={(p) => setUserPage(p)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Sub-section B: All Users' Notes */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              All Users' Notes (Inspection View)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Admin endpoint{" "}
              <code className="bg-slate-100 text-indigo-700 px-2 py-0.5 rounded-lg font-mono">
                GET /api/v1/notes/admin/all
              </code>
              .
            </p>
          </div>
          <span className="text-xs bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1 rounded-full font-medium">
            Total Notes: {totalAllNotes}
          </span>
        </div>

        {rbacTestMsg && (
          <div className="p-4 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs rounded-2xl leading-relaxed font-medium">
            {rbacTestMsg}
          </div>
        )}

        {loadingNotes ? (
          <div className="py-10 text-center text-xs text-slate-500">
            Loading all notes...
          </div>
        ) : (
          <div className="space-y-4">
            {allNotes.map((note) => (
              <div
                key={note._id}
                className="p-5 border border-slate-200/80 rounded-2xl bg-white hover:border-slate-300 transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {note.title}
                      </h4>
                      <div className="text-xs text-slate-500 mt-1">
                        Author:{" "}
                        <strong className="text-slate-800">
                          {note.author?.name}
                        </strong>{" "}
                        ({note.author?.email})
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-slate-400 shrink-0">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-2.5 text-xs sm:text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-[10px] font-mono text-slate-400">
                    Note ID: {note._id}
                  </span>
                  <button
                    onClick={() => handleTestRbacDelete(note)}
                    className="px-3 py-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl transition cursor-pointer active:scale-98"
                    title="Will succeed only if you own this note; will return 404 if owned by someone else"
                  >
                    Test Delete Note (Enforces Author Ownership)
                  </button>
                </div>
              </div>
            ))}

            <Pagination
              page={notePage}
              totalPages={noteTotalPages}
              onPageChange={(p) => setNotePage(p)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
