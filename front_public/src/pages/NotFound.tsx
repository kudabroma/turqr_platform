const platformLogo = "/platform/Turlogo.png";

export default function NotFound() {

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <nav style={{ padding: '18px 32px', borderBottom: '1px solid #f0f0f0' }}>
        <div className="flex items-center gap-2">
            <img
              src={platformLogo}
              alt="TurQR"
              className="w-auto h-10 object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          </div>
      </nav>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem', textAlign: 'center' }}>

        {/* Plate illustration */}
        <div style={{ position: 'relative', width: 160, height: 160, marginBottom: '2.5rem' }}>
          <div style={{ width: 140, height: 140, background: '#FFF4F0', borderRadius: '50%', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
          <div style={{ width: 100, height: 100, border: '3px solid #f0ede8', borderRadius: '50%', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 26, fontWeight: 700, color: '#E8521A', letterSpacing: -1 }}>404</span>
          </div>
          {/* Fork */}
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} width="14" height="80" viewBox="0 0 14 80" fill="none">
            <rect x="4" y="0" width="2" height="30" rx="1" fill="#e0dbd4"/>
            <rect x="1" y="0" width="2" height="18" rx="1" fill="#e0dbd4"/>
            <rect x="7" y="0" width="2" height="18" rx="1" fill="#e0dbd4"/>
            <rect x="1" y="18" width="8" height="2" rx="1" fill="#e0dbd4"/>
            <rect x="4" y="30" width="2" height="50" rx="1" fill="#e0dbd4"/>
          </svg>
          {/* Knife */}
          <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} width="10" height="80" viewBox="0 0 10 80" fill="none">
            <path d="M5 0 C5 0 10 8 10 20 L5 24 L5 80" stroke="#e0dbd4" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <rect x="4" y="24" width="2" height="56" rx="1" fill="#e0dbd4"/>
          </svg>
        </div>

        {/* Badge */}
        <div style={{ display: 'inline-block', background: '#FFF4F0', color: '#E8521A', fontSize: 12, fontWeight: 500, padding: '4px 14px', borderRadius: 20, border: '1px solid #ffd5c5', marginBottom: '1.2rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          Page not found
        </div>

        <h1 style={{ fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 700, color: '#1a1a1a', marginBottom: '1rem', lineHeight: 1.25 }}>
          This menu has left the table
        </h1>

        <p style={{ fontSize: 15, color: '#888', lineHeight: 1.7, maxWidth: 400, margin: '0 auto 2.5rem' }}>
          The page you're looking for doesn't exist or may have been moved.
          Try scanning the QR code again.
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <p style={{ fontSize: 13, color: '#bbb' }}>
            Please scan the QR code again to access the menu.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ padding: '20px 32px', borderTop: '1px solid #f5f5f5', textAlign: 'center', fontSize: 12, color: '#ccc' }}>
        Powered by <span style={{ color: '#E8521A' }}>turQR</span> · Digital menus for Turkish restaurants
      </footer>
    </div>
  )
}