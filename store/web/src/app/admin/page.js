'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.role === 'admin') fetchUsers();
  }, [session]);

  async function fetchUsers() {
    const res = await fetch('/api/users');
    if (res.ok) setUsers(await res.json());
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError('');

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setFormError(data.error || 'Failed to create user');
      return;
    }

    setForm({ name: '', email: '', password: '', role: 'staff' });
    setShowForm(false);
    fetchUsers();
  }

  async function handleRoleChange(id, role) {
    await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    fetchUsers();
  }

  async function handleToggleActive(id, currentlyActive) {
    await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !currentlyActive }),
    });
    fetchUsers();
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    fetchUsers();
  }

  if (status === 'loading') return null;
  if (session?.user?.role !== 'admin') return null;

  return (
    <>
      <header>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div className="left">
            <h1>Admin — User Management</h1>
            <p>Create, edit, and manage user accounts.</p>
          </div>
          <div className="right">
            <a href="/" className="header-btn">Back to Store</a>
            <button className="header-btn" onClick={() => signOut()}>Sign out</button>
          </div>
        </div>
      </header>

      <main className="container admin-page">
        <div className="admin-toolbar">
          <h2>{users.length} user{users.length !== 1 ? 's' : ''}</h2>
          <button className="install-btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Create user'}
          </button>
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom: 20 }}>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                    minLength={4}
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    className="role-select"
                    style={{ width: '100%', padding: '10px 14px' }}
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                  >
                    <option value="staff">Staff</option>
                    <option value="viewer">Viewer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              {formError && <div className="form-error" style={{ marginTop: 8 }}>{formError}</div>}
              <button type="submit" className="install-btn" style={{ marginTop: 12 }}>Create user</button>
            </form>
          </div>
        )}

        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <select
                    className="role-select"
                    value={user.role}
                    onChange={e => handleRoleChange(user.id, e.target.value)}
                    disabled={user.id === session.user.id}
                  >
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </td>
                <td>
                  <span className={user.active ? 'status-active' : 'status-inactive'}>
                    {user.active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  {user.id !== session.user.id && (
                    <>
                      <button
                        className="action-btn"
                        onClick={() => handleToggleActive(user.id, user.active)}
                      >
                        {user.active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        className="action-btn danger"
                        onClick={() => handleDelete(user.id, user.name)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </>
  );
}
