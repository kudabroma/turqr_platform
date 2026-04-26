import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div style={{ fontFamily: 'Manrope, sans-serif', background: '#f7f7f5', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap');`}</style>

      {/* Nav */}
      <nav style={{ background: '#fff', padding: '14px 28px', borderBottom: '1px solid #ebebeb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="flex items-center gap-2 min-w-0">
            <img
              src="/platform/Turlogo.png"
              alt="TurQR"
              className="h-8 w-auto object-contain shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#aaa' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#e0e0e0' }} />
          Admin Panel
        </div>
      </nav>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem' }}>
        <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: 16, padding: '3rem 2.5rem', maxWidth: 480, width: '100%', textAlign: 'center' }}>

          {/* Icon */}
          <div style={{ width: 64, height: 64, background: '#FFF4F0', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#E8521A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Badge */}
          <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#E8521A', background: '#FFF4F0', border: '1px solid #ffd5c5', padding: '3px 12px', borderRadius: 20, marginBottom: '1.2rem' }}>
            Error 404
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', marginBottom: '0.75rem', lineHeight: 1.3, letterSpacing: -0.3 }}>
            Page not found
          </h1>

          <p style={{ fontSize: 14, color: '#888', lineHeight: 1.7, marginBottom: '2rem' }}>
            The page you're looking for doesn't exist<br />
            or you don't have access to it.
          </p>

          <div style={{ height: 1, background: '#f0f0f0', marginBottom: '1.5rem' }} />

          {/* Info box */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#fafafa', border: '1px solid #ebebeb', borderRadius: 10, padding: '12px 16px', marginBottom: '1.5rem', textAlign: 'left' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10" stroke="#E8521A" strokeWidth="1.8"/>
              <path d="M12 8v4M12 16h.01" stroke="#E8521A" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
              If you followed a link from the system,{' '}
              <strong style={{ color: '#333', fontWeight: 600 }}>please contact support.</strong>{' '}
              The page may have been removed or you may not have the required permissions.
            </p>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
            <button
              onClick={() => navigate('/')}
              style={{ fontFamily: 'Manrope, sans-serif', fontSize: 14, fontWeight: 600, padding: '12px 24px', background: '#E8521A', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', width: '100%' }}
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => navigate(-1)}
              style={{ fontFamily: 'Manrope, sans-serif', fontSize: 14, fontWeight: 500, padding: '12px 24px', background: 'transparent', color: '#666', border: '1px solid #e0e0e0', borderRadius: 10, cursor: 'pointer', width: '100%' }}
            >
              Go back
            </button>
          </div>

          <a href="mailto:support@turqr.com" style={{ display: 'block', marginTop: '1.5rem', fontSize: 12, color: '#bbb', textDecoration: 'none' }}>
            Need help? <span style={{ color: '#E8521A' }}>support@turqr.com</span>
          </a>

        </div>
      </div>
    </div>
  )
}