export default function TopBar() {
  return (
    <div style={{ backgroundColor: '#222', color: '#fff', fontSize: '11px', padding: '8px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '500', letterSpacing: '0.05em' }}>
      <div style={{ display: 'flex', gap: '20px' }}>
         <span style={{ cursor: 'pointer' }}>English ▾</span>
         <span style={{ cursor: 'pointer' }}>US Dollar ▾</span>
      </div>
      <div style={{ display: 'flex', gap: '8px', cursor: 'pointer' }}>
         <span>Login / Register</span>
      </div>
    </div>
  );
}
