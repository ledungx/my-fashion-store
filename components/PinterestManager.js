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
      setMessage('✅ Boards refreshed from Pinterest');
    } catch (err) {
      setMessage('❌ ' + err.message);
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
      setMessage('✅ Mappings saved successfully');
    } catch (err) {
      setMessage('❌ ' + err.message);
    }
    setIsSaving(false);
  };

  // ── Queue pins (drip-feed) ──
  const handleSync = async () => {
    setIsSyncing(true);
    setMessage('');
    try {
      const res = await fetch('/api/pinterest/sync', { method: 'POST' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessage(`✅ ${data.message}`);
      // Refresh stats
      const statsRes = await fetch('/api/pinterest/sync');
      const statsData = await statsRes.json();
      setLocalStats({ total: statsData.total, pending: statsData.pending, pinned: statsData.pinned, failed: statsData.failed });
      setLocalPins(statsData.recentPins || []);
    } catch (err) {
      setMessage('❌ ' + err.message);
    }
    setIsSyncing(false);
  };

  // ── Process due pins now ──
  const handleProcessNow = async () => {
    setIsProcessing(true);
    setMessage('');
    try {
      const res = await fetch('/api/pinterest/sync', { method: 'PUT' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessage(`✅ Processed ${data.processed} pins: ${data.pinned} pinned, ${data.failed} failed`);
      // Refresh stats
      const statsRes = await fetch('/api/pinterest/sync');
      const statsData = await statsRes.json();
      setLocalStats({ total: statsData.total, pending: statsData.pending, pinned: statsData.pinned, failed: statsData.failed });
      setLocalPins(statsData.recentPins || []);
    } catch (err) {
      setMessage('❌ ' + err.message);
    }
    setIsProcessing(false);
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

      {/* ── Section 2: Board ↔ Category Mapping ── */}
      {account && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ ...sectionTitle, margin: 0 }}>Board → Category Mapping</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
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
                  <th style={{ ...thStyle, width: '100px', textAlign: 'center' }}>Products</th>
                </tr>
              </thead>
              <tbody>
                {localBoards.map(board => {
                  const selectedCat = categories.find(c => c.id === mappings[board.id]);
                  return (
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
                              {cat.name} ({cat._count?.products || 0} products)
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', color: '#888' }}>
                        {selectedCat ? (selectedCat._count?.products || 0) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Section 3: Pin Queue & Controls ── */}
      {account && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ ...sectionTitle, margin: 0 }}>Pin Queue</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleSync} disabled={isSyncing} style={secondaryBtnStyle}>
                {isSyncing ? '⏳ Queuing...' : '📋 Queue All Pins'}
              </button>
              <button onClick={handleProcessNow} disabled={isProcessing} style={{ ...primaryBtnStyle, background: '#E60023' }}>
                {isProcessing ? '⏳ Pinning...' : '🚀 Process Due Pins'}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <StatCard label="Total" value={localStats.total} color="#111" />
            <StatCard label="Pending" value={localStats.pending} color="#f59e0b" />
            <StatCard label="Pinned" value={localStats.pinned} color="#10b981" />
            <StatCard label="Failed" value={localStats.failed} color="#ef4444" />
          </div>

          {/* Progress bar */}
          {localStats.total > 0 && (
            <div style={{ background: '#f0f0f0', borderRadius: '8px', height: '8px', marginBottom: '24px', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                borderRadius: '8px',
                background: 'linear-gradient(90deg, #10b981, #059669)',
                width: `${(localStats.pinned / localStats.total) * 100}%`,
                transition: 'width 0.5s ease',
              }} />
            </div>
          )}

          {/* Recent pins table */}
          {localPins.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                  <th style={thStyle}>Image</th>
                  <th style={thStyle}>Title</th>
                  <th style={{ ...thStyle, width: '120px' }}>Board</th>
                  <th style={{ ...thStyle, width: '90px' }}>Status</th>
                  <th style={{ ...thStyle, width: '130px' }}>Scheduled</th>
                </tr>
              </thead>
              <tbody>
                {localPins.map(pin => (
                  <tr key={pin.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ ...tdStyle, width: '60px' }}>
                      <img src={pin.imageUrl} alt="" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: '500', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                        {pin.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                        {pin.destinationUrl}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, fontSize: '12px', color: '#888' }}>{pin.board?.name || '—'}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
    <div style={{ background: '#fafafa', borderRadius: '12px', padding: '20px', textAlign: 'center', border: '1px solid #f0f0f0' }}>
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
