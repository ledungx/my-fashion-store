'use client';
import { useState } from 'react';

export default function PinterestManager({ account, boards, categories, stats, recentPins }) {
  const [mappings, setMappings] = useState(
    boards.reduce((acc, b) => ({ ...acc, [b.id]: b.categoryId || '' }), {})
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const [localBoards, setLocalBoards] = useState(boards);
  const [localStats, setLocalStats] = useState(stats);
  const [localPins, setLocalPins] = useState(recentPins);

  // Layout state
  const [activeTab, setActiveTab] = useState('pins'); // 'pins' or 'boards'
  const [boardPage, setBoardPage] = useState(1);
  const [pinPage, setPinPage] = useState(1);
  const [pinStatusFilter, setPinStatusFilter] = useState('');
  const boardsPerPage = 10;

  // Settings state
  const [pinsPerBatch, setPinsPerBatch] = useState(account?.pinsPerBatch || 1);
  const [intervalMinutes, setIntervalMinutes] = useState(account?.intervalMinutes || 180);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Modals state
  const [boardModal, setBoardModal] = useState({ isOpen: false, isEdit: false, id: null, name: '', description: '' });
  const [pinModal, setPinModal] = useState({ isOpen: false, id: null, title: '', description: '', destinationUrl: '', status: '', scheduledAt: '', boardId: '' });
  
  const showToast = (text, isError = false) => {
    setMessage(`${isError ? '❌' : '✅'} ${text}`);
  };

  // ── Fetch boards from Pinterest ──
  const handleRefreshBoards = async () => {
    setIsRefreshing(true);
    setMessage('');
    try {
      const res = await fetch('/api/pinterest/boards');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setLocalBoards(data.boards);
      setMappings(data.boards.reduce((acc, b) => ({ ...acc, [b.id]: b.categoryId || '' }), {}));
      showToast('Boards refreshed from Pinterest');
    } catch (err) {
      showToast(err.message, true);
    }
    setIsRefreshing(false);
  };

  // ── Save mappings ──
  const handleSaveMappings = async () => {
    setIsSaving(true);
    setMessage('');
    try {
      const payload = Object.entries(mappings).map(([boardId, categoryId]) => ({
        boardId,
        categoryId: categoryId || null,
      }));
      const res = await fetch('/api/pinterest/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mappings: payload }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      showToast('Mappings saved successfully');
    } catch (err) {
      showToast(err.message, true);
    }
    setIsSaving(false);
  };

  // ── Board CRUD ──
  const handleSaveBoard = async () => {
    const isEdit = boardModal.isEdit;
    const url = isEdit ? `/api/pinterest/boards/manage/${boardModal.id}` : `/api/pinterest/boards/manage`;
    const method = isEdit ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: boardModal.name, description: boardModal.description }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      showToast(`Board ${isEdit ? 'updated' : 'created'} successfully`);
      setBoardModal({ isOpen: false });
      handleRefreshBoards(); // Reload boards to reflect changes
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleDeleteBoard = async (id) => {
    if (!confirm('Are you sure you want to delete this board? It will be removed from Pinterest permanently.')) return;
    try {
      const res = await fetch(`/api/pinterest/boards/manage/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      showToast('Board deleted successfully');
      handleRefreshBoards();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  // ── Settings ──
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    setMessage('');
    try {
      const res = await fetch('/api/pinterest/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinsPerBatch, intervalMinutes }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      showToast('Queue settings saved successfully');
    } catch (err) {
      showToast(err.message, true);
    }
    setIsSavingSettings(false);
  };

  // ── Sync & Pin Processing ──
  const handleSync = async () => {
    setIsSyncing(true);
    setMessage('');
    try {
      const res = await fetch('/api/pinterest/sync', { method: 'POST' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      showToast(data.message);
      refreshStats();
    } catch (err) {
      showToast(err.message, true);
    }
    setIsSyncing(false);
  };

  const handleProcessNow = async () => {
    setIsProcessing(true);
    setMessage('');
    try {
      const res = await fetch('/api/pinterest/sync', { method: 'PUT' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      showToast(`Processed ${data.processed} pins: ${data.pinned} pinned, ${data.failed} failed`);
      refreshStats();
    } catch (err) {
      showToast(err.message, true);
    }
    setIsProcessing(false);
  };

  const refreshStats = async (page = pinPage, status = pinStatusFilter) => {
    const statsRes = await fetch(`/api/pinterest/sync?page=${page}&status=${status}`);
    const statsData = await statsRes.json();
    setLocalStats({ total: statsData.globalTotal || statsData.total, pending: statsData.pending, pinned: statsData.pinned, failed: statsData.failed, totalPages: statsData.totalPages || 1 });
    setLocalPins(statsData.recentPins || []);
    setPinPage(page);
    setPinStatusFilter(status);
  };

  // ── Pin CRUD ──
  const handleSavePin = async () => {
    try {
      const res = await fetch(`/api/pinterest/pins/${pinModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: pinModal.title, 
          description: pinModal.description, 
          destinationUrl: pinModal.destinationUrl,
          scheduledAt: pinModal.scheduledAt,
          boardId: pinModal.boardId 
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      showToast('Pin updated successfully');
      setPinModal({ isOpen: false });
      refreshStats();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleDeletePin = async (id) => {
    if (!confirm('Are you sure you want to delete this pin from Pinterest?')) return;
    try {
      const res = await fetch(`/api/pinterest/pins/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      showToast('Pin deleted successfully');
      refreshStats();
    } catch (err) {
      showToast(err.message, true);
    }
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

      {/* ── Section 1: Account Status ── */}
      <div style={cardStyle}>
        <h2 style={sectionTitle}>Pinterest Account</h2>
        {account ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#E60023', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '20px' }}>
              P
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '16px', color: '#111' }}>@{account.username}</div>
              <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>
                {new Date(account.tokenExpiry) > new Date() 
                  ? <span style={{ color: '#2e7d32' }}>🟢 Connected — Token valid until {new Date(account.tokenExpiry).toLocaleDateString()}</span>
                  : <span style={{ color: '#e65100' }}>🟠 Token expired — will auto-refresh on next action</span>
                }
              </div>
            </div>
            <a href="/api/pinterest/auth" style={{ marginLeft: 'auto', padding: '10px 20px', border: '1px solid #E60023', color: '#E60023', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '700' }}>
              Reconnect
            </a>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#888', marginBottom: '20px', fontSize: '15px' }}>No Pinterest account connected yet.</p>
            <a href="/api/pinterest/auth" style={{ padding: '14px 32px', background: '#E60023', color: '#fff', textDecoration: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', display: 'inline-block' }}>
              🔗 Connect Pinterest Account
            </a>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      {account && (
        <div style={{ display: 'flex', gap: '20px', borderBottom: '2px solid #eee', marginBottom: '10px' }}>
          <button 
            onClick={() => setActiveTab('pins')} 
            style={{ ...tabBtnStyle, borderBottom: activeTab === 'pins' ? '2px solid #111' : '2px solid transparent', color: activeTab === 'pins' ? '#111' : '#888' }}
          >
            Pin Management
          </button>
          <button 
            onClick={() => setActiveTab('boards')} 
            style={{ ...tabBtnStyle, borderBottom: activeTab === 'boards' ? '2px solid #111' : '2px solid transparent', color: activeTab === 'boards' ? '#111' : '#888' }}
          >
            Board Management
          </button>
        </div>
      )}

      {/* ── Section 2: Board Management ── */}
      {account && activeTab === 'boards' && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ ...sectionTitle, margin: 0 }}>Board Management</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setBoardModal({ isOpen: true, isEdit: false, id: null, name: '', description: '' })} style={secondaryBtnStyle}>
                ✨ Create Board
              </button>
              <button onClick={handleRefreshBoards} disabled={isRefreshing} style={secondaryBtnStyle}>
                {isRefreshing ? '⏳ Refreshing...' : '🔄 Refresh Boards'}
              </button>
              <button onClick={handleSaveMappings} disabled={isSaving} style={primaryBtnStyle}>
                {isSaving ? '⏳ Saving...' : '💾 Save Mappings'}
              </button>
            </div>
          </div>

          {localBoards.length === 0 ? (
            <p style={{ color: '#aaa', textAlign: 'center', padding: '30px' }}>
              No boards found. Click "Refresh Boards" to fetch from Pinterest.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f0f0f0', textAlign: 'left' }}>
                  <th style={thStyle}>Board</th>
                  <th style={{ ...thStyle, width: '250px' }}>Assign Category</th>
                  <th style={{ ...thStyle, width: '120px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {localBoards.slice((boardPage - 1) * boardsPerPage, boardPage * boardsPerPage).map(board => (
                  <tr key={board.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {board.imageUrl ? (
                          <img src={board.imageUrl} alt="" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>📌</div>
                        )}
                        <div>
                          <div style={{ fontWeight: '600', color: '#111' }}>{board.name}</div>
                          {board.description && <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>{board.description.substring(0, 60)}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <select
                        value={mappings[board.id] || ''}
                        onChange={(e) => setMappings(prev => ({ ...prev, [board.id]: e.target.value }))}
                        style={selectStyle}
                      >
                        <option value="">— Not mapped —</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <button onClick={() => setBoardModal({ isOpen: true, isEdit: true, id: board.boardId, name: board.name, description: board.description || '' })} style={iconBtnStyle} title="Edit Board">✎</button>
                      <button onClick={() => handleDeleteBoard(board.boardId)} style={{...iconBtnStyle, color: '#ef4444', marginLeft: '5px'}} title="Delete Board">🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {/* Boards Pagination */}
          {localBoards.length > boardsPerPage && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
              <button disabled={boardPage === 1} onClick={() => setBoardPage(1)} style={secondaryBtnStyle}>&laquo; First</button>
              <button disabled={boardPage === 1} onClick={() => setBoardPage(p => p - 1)} style={secondaryBtnStyle}>&lsaquo; Prev</button>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#555', margin: '0 8px' }}>
                Page {boardPage} of {Math.ceil(localBoards.length / boardsPerPage)}
              </span>
              <button disabled={boardPage === Math.ceil(localBoards.length / boardsPerPage)} onClick={() => setBoardPage(p => p + 1)} style={secondaryBtnStyle}>Next &rsaquo;</button>
              <button disabled={boardPage === Math.ceil(localBoards.length / boardsPerPage)} onClick={() => setBoardPage(Math.ceil(localBoards.length / boardsPerPage))} style={secondaryBtnStyle}>Last &raquo;</button>
            </div>
          )}
        </div>
      )}

      {/* ── Section 3: Pin Management ── */}
      {account && activeTab === 'pins' && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ ...sectionTitle, margin: 0 }}>Pin Management</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleSync} disabled={isSyncing} style={secondaryBtnStyle}>
                {isSyncing ? '⏳ Queuing...' : '📋 Queue All Pins'}
              </button>
              <button onClick={handleProcessNow} disabled={isProcessing} style={{ ...primaryBtnStyle, background: '#E60023' }}>
                {isProcessing ? '⏳ Pinning...' : '🚀 Process Due Pins'}
              </button>
            </div>
          </div>

          {/* Settings Box */}
          <div style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: '12px', padding: '20px', marginBottom: '24px', display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Pins per Batch (Cron job)</label>
              <input 
                type="number" 
                min="1" 
                value={pinsPerBatch} 
                onChange={(e) => setPinsPerBatch(e.target.value)} 
                style={inputStyle} 
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Interval Between Pins (Minutes)</label>
              <input 
                type="number" 
                min="0" 
                value={intervalMinutes} 
                onChange={(e) => setIntervalMinutes(e.target.value)} 
                style={inputStyle} 
              />
            </div>
            <div>
              <button onClick={handleSaveSettings} disabled={isSavingSettings} style={secondaryBtnStyle}>
                {isSavingSettings ? '⏳ Saving...' : '💾 Save Settings'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
              <StatCard label="Total Queued" value={localStats.total} color="#111" />
              <StatCard label="Pending" value={localStats.pending} color="#f59e0b" />
              <StatCard label="Pinned" value={localStats.pinned} color="#10b981" />
              <StatCard label="Failed" value={localStats.failed} color="#ef4444" />
            </div>
            
            <div style={{ marginLeft: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#555' }}>Filter:</span>
              <select 
                value={pinStatusFilter} 
                onChange={(e) => refreshStats(1, e.target.value)} 
                style={{ ...selectStyle, width: '140px', background: '#fff' }}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PINNED">Pinned</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </div>

          {localPins.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                  <th style={thStyle}>Image</th>
                  <th style={thStyle}>Details</th>
                  <th style={{ ...thStyle, width: '140px' }}>Board</th>
                  <th style={{ ...thStyle, width: '120px' }}>Status</th>
                  <th style={{ ...thStyle, width: '130px' }}>Scheduled</th>
                  <th style={{ ...thStyle, width: '100px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {localPins.map(pin => (
                  <tr key={pin.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ ...tdStyle, width: '60px' }}>
                      <img src={pin.imageUrl} alt="" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                    </td>
                    <td style={{...tdStyle, maxWidth: '300px'}}>
                      <div style={{ fontWeight: '500', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {pin.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {pin.destinationUrl}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, fontSize: '13px', color: '#555' }}>
                      {pin.board?.name || '—'}
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                        background: pin.status === 'PINNED' ? '#e8f5e9' : pin.status === 'FAILED' ? '#fce4ec' : '#fff3e0',
                        color: pin.status === 'PINNED' ? '#2e7d32' : pin.status === 'FAILED' ? '#c62828' : '#e65100',
                      }}>
                        {pin.status === 'PINNED' ? '✅ Pinned' : pin.status === 'FAILED' ? '❌ Failed' : '⏳ Pending'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontSize: '12px', color: '#888' }}>
                      {pin.scheduledAt ? new Date(pin.scheduledAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <>
                        <button onClick={() => {
                          // Format date for datetime-local input
                          const scheduledVal = pin.scheduledAt ? new Date(pin.scheduledAt).toISOString().slice(0, 16) : '';
                          setPinModal({ isOpen: true, id: pin.id, title: pin.title, description: pin.description, destinationUrl: pin.destinationUrl, status: pin.status, scheduledAt: scheduledVal, boardId: pin.boardId || '' });
                        }} style={iconBtnStyle} title="Edit Pin">✎</button>
                        <button onClick={() => handleDeletePin(pin.id)} style={{...iconBtnStyle, color: '#ef4444', marginLeft: '5px'}} title="Delete Pin">🗑</button>
                      </>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {/* Pins Pagination */}
          {localStats.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
              <button disabled={pinPage <= 1} onClick={() => refreshStats(1)} style={secondaryBtnStyle}>&laquo; First</button>
              <button disabled={pinPage <= 1} onClick={() => refreshStats(pinPage - 1)} style={secondaryBtnStyle}>&lsaquo; Prev</button>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#555', margin: '0 8px' }}>
                Page {pinPage} of {localStats.totalPages}
              </span>
              <button disabled={pinPage >= localStats.totalPages} onClick={() => refreshStats(pinPage + 1)} style={secondaryBtnStyle}>Next &rsaquo;</button>
              <button disabled={pinPage >= localStats.totalPages} onClick={() => refreshStats(localStats.totalPages)} style={secondaryBtnStyle}>Last &raquo;</button>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {boardModal.isOpen && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3>{boardModal.isEdit ? 'Edit Board' : 'Create New Board'}</h3>
            <div style={formGroup}>
              <label>Board Name</label>
              <input type="text" value={boardModal.name} onChange={e => setBoardModal({...boardModal, name: e.target.value})} style={inputStyle} placeholder="e.g. Summer Collection" />
            </div>
            <div style={formGroup}>
              <label>Description</label>
              <textarea value={boardModal.description} onChange={e => setBoardModal({...boardModal, description: e.target.value})} style={{...inputStyle, minHeight: '80px'}} placeholder="Optional description..." />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button onClick={() => setBoardModal({ isOpen: false })} style={secondaryBtnStyle}>Cancel</button>
              <button onClick={handleSaveBoard} style={primaryBtnStyle}>Save Board</button>
            </div>
          </div>
        </div>
      )}

      {pinModal.isOpen && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3>Edit Pin on Pinterest</h3>
            <div style={formGroup}>
              <label>Title</label>
              <input type="text" value={pinModal.title} onChange={e => setPinModal({...pinModal, title: e.target.value})} style={inputStyle} />
            </div>
            <div style={formGroup}>
              <label>Description</label>
              <textarea value={pinModal.description} onChange={e => setPinModal({...pinModal, description: e.target.value})} style={{...inputStyle, minHeight: '80px'}} />
            </div>
            <div style={formGroup}>
              <label>Link (URL)</label>
              <input type="text" value={pinModal.destinationUrl} onChange={e => setPinModal({...pinModal, destinationUrl: e.target.value})} style={inputStyle} />
            </div>
            <div style={formGroup}>
              <label>Board</label>
              <select value={pinModal.boardId} onChange={e => setPinModal({...pinModal, boardId: e.target.value})} style={inputStyle}>
                <option value="">— Select a board —</option>
                {localBoards.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            {pinModal.status !== 'PINNED' && (
              <div style={formGroup}>
                <label>Scheduled Post Time</label>
                <input 
                  type="datetime-local" 
                  value={pinModal.scheduledAt} 
                  onChange={e => setPinModal({...pinModal, scheduledAt: e.target.value})} 
                  style={inputStyle} 
                />
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button onClick={() => setPinModal({ isOpen: false })} style={secondaryBtnStyle}>Cancel</button>
              <button onClick={handleSavePin} style={primaryBtnStyle}>Update Pin</button>
            </div>
          </div>
        </div>
      )}

      {/* Message Toast */}
      {message && (
        <div style={{
          position: 'fixed', bottom: '30px', right: '30px', padding: '16px 24px',
          background: message.startsWith('✅') ? '#111' : '#c62828',
          color: '#fff', borderRadius: '12px', fontSize: '14px', fontWeight: '600',
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)', zIndex: 1000,
          animation: 'fadeIn 0.3s ease',
        }}>
          {message}
          <button onClick={() => setMessage('')} style={{ marginLeft: '16px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: '700' }}>✕</button>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ flex: 1, background: '#fafafa', borderRadius: '12px', padding: '20px', textAlign: 'center', border: '1px solid #f0f0f0' }}>
      <div style={{ fontSize: '28px', fontWeight: '800', color }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>{label}</div>
    </div>
  );
}

// styles
const cardStyle = { background: '#fff', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' };
const sectionTitle = { fontSize: '18px', fontWeight: '700', color: '#111', marginBottom: '20px' };
const thStyle = { padding: '12px 16px', fontSize: '11px', fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left' };
const tdStyle = { padding: '12px 16px', verticalAlign: 'middle' };
const selectStyle = { width: '100%', padding: '8px 12px', border: '1.5px solid #e8e8e8', borderRadius: '6px', fontSize: '13px', background: '#fafafa', color: '#333', outline: 'none' };
const primaryBtnStyle = { padding: '10px 20px', background: '#111', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', letterSpacing: '0.03em' };
const secondaryBtnStyle = { padding: '10px 20px', background: '#fff', color: '#333', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' };
const iconBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '4px' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 };
const modalContent = { background: '#fff', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' };
const formGroup = { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' };
const inputStyle = { padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', outline: 'none', fontFamily: 'inherit' };
const tabBtnStyle = { background: 'none', border: 'none', padding: '12px 16px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', outline: 'none' };
