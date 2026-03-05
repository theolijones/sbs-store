'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

const REGISTRY_URL = process.env.NEXT_PUBLIC_REGISTRY_URL ||
  'https://raw.githubusercontent.com/theolijones/sbs-store/main/store/registry.json';

export default function StorePage() {
  const { data: session } = useSession();
  const [allApps, setAllApps] = useState([]);
  const [sources, setSources] = useState({});
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegistry().then(() => setLoading(false)).catch(() => setLoading(false));
  }, []);

  async function fetchRegistry() {
    const res = await fetch(REGISTRY_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const primary = await res.json();
    setSources(primary.sources || {});
    setAllApps(primary.apps || []);
  }

  const filtered = allApps.filter(app => {
    if (typeFilter !== 'all' && app.type !== typeFilter) return false;
    if (sourceFilter !== 'all' && app.sourceId !== sourceFilter) return false;
    if (search) {
      const haystack = `${app.name} ${app.description} ${(app.tags || []).join(' ')}`.toLowerCase();
      if (!haystack.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const types = ['all', 'electron', 'node-service', 'web', 'python-app'];
  const typeLabels = { all: 'All', electron: 'Electron', 'node-service': 'Service', web: 'Web', 'python-app': 'Python' };

  function handleInstall(app) {
    if (app.install.method === 'hosted') {
      window.open(app.install.url, '_blank');
      return;
    }
    setModal(app);
  }

  function buildDownloadUrl(app) {
    const source = sources[app.sourceId];
    if (!source || app.install.method !== 'github-release') return null;
    const tag = `${app.id}-v${app.version}`;
    const asset = app.install.releaseAsset.replace('{version}', app.version);
    return `https://github.com/${source.org}/${source.repo}/releases/download/${tag}/${asset}`;
  }

  return (
    <>
      <header>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div className="left">
            <h1>Sportsbet Studio App Store</h1>
            <p>Discover, install, and manage studio apps across all sources.</p>
          </div>
          <div className="right">
            <span className="user-info">
              {session?.user?.name}
              <span className="user-role">{session?.user?.role}</span>
            </span>
            {session?.user?.role === 'admin' && (
              <a href="/admin" className="header-btn">Admin</a>
            )}
            <button className="header-btn" onClick={() => signOut()}>Sign out</button>
          </div>
        </div>
      </header>

      <main className="container">
        <div className="toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="Search apps by name or tag..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="filter-group">
            {types.map(t => (
              <button
                key={t}
                className={`filter-btn ${typeFilter === t ? 'active' : ''}`}
                onClick={() => setTypeFilter(t)}
              >
                {typeLabels[t]}
              </button>
            ))}
          </div>
          <select
            className="source-filter"
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
          >
            <option value="all">All Sources</option>
            {Object.entries(sources).map(([id, s]) => (
              <option key={id} value={id}>{s.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="empty">Loading registry...</div>
        ) : (
          <div className="grid">
            {filtered.length === 0 ? (
              <div className="empty">No apps match your filters.</div>
            ) : (
              filtered.map(app => {
                const source = sources[app.sourceId];
                const sourceLabel = source ? source.label : app.sourceId;
                return (
                  <div className="card" key={app.id}>
                    <div className="card-header">
                      <span className="card-title">{app.name}</span>
                      <div className="badges">
                        <span className="badge badge-version">v{app.version}</span>
                        <span className={`badge badge-${app.type}`}>{app.type}</span>
                        <span className="badge badge-source">{sourceLabel}</span>
                      </div>
                    </div>
                    <div className="card-desc">{app.description}</div>
                    <div className="card-tags">
                      {(app.tags || []).map(t => <span className="tag" key={t}>{t}</span>)}
                    </div>
                    <div className="card-footer">
                      <span className="card-date">Updated {app.updated}</span>
                      {session?.user?.role !== 'viewer' && (
                        <button className="install-btn" onClick={() => handleInstall(app)}>Install</button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      {modal && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal">
            <h3>Install {modal.name}</h3>
            <div className="modal-cmd">
              <span>sbs install {modal.id}</span>
              <button className="copy-btn" onClick={() => navigator.clipboard.writeText(`sbs install ${modal.id}`)}>
                Copy
              </button>
            </div>
            {buildDownloadUrl(modal) && (
              <p><a className="modal-link" href={buildDownloadUrl(modal)} target="_blank" rel="noreferrer">
                Direct download: {modal.install.releaseAsset?.replace('{version}', modal.version)}
              </a></p>
            )}
            <button className="modal-close" onClick={() => setModal(null)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
