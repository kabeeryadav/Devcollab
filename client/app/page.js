'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomeDashboard() {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [focused, setFocused] = useState(null);
  const [hoverBtn, setHoverBtn] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [loadingStep, setLoadingStep] = useState(null);
  const [logs, setLogs] = useState([]);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  // Typing animation state
  const CODE_LINES = [
    { code: '<!DOCTYPE html>', color: '#94a3b8' },
    { code: '<html lang="en">', color: '#c2410c' },
    { code: '<head>', color: '#c2410c' },
    { code: '  <title>Real-Time App</title>', color: '#0369a1', cursor: { user: 'Kabeer', color: '#7e85edff' } },
    { code: '  <style>', color: '#c2410c' },
    { code: '    h1 { color: #4f46e5; }', color: '#15803d' },
    { code: '  </style>', color: '#c2410c' },
    { code: '</head>', color: '#c2410c' },
    { code: '<body>', color: '#c2410c', cursor: { user: 'Kalyan', color: '#ec007aff' } },
    { code: '  <h1>Hello, Collaborative World!</h1>', color: '#4f46e5' },
    { code: '</body>', color: '#c2410c' },
    { code: '</html>', color: '#c2410c' }
  ];

  const [visibleLines, setVisibleLines] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [cursorBlink, setCursorBlink] = useState(true);

  useEffect(() => {
    // Reveal one line every 600ms
    if (visibleLines < CODE_LINES.length) {
      const t = setTimeout(() => setVisibleLines(v => v + 1), 520);
      return () => clearTimeout(t);
    }
  }, [visibleLines]);

  useEffect(() => {
    // Type out current line character by character
    if (visibleLines === 0 || visibleLines > CODE_LINES.length) return;
    const line = CODE_LINES[visibleLines - 1];
    setCharCount(0);
    if (!line.code) return;
    let i = 0;
    const t = setInterval(() => {
      i++;
      setCharCount(i);
      if (i >= line.code.length) clearInterval(t);
    }, 28);
    return () => clearInterval(t);
  }, [visibleLines]);

  useEffect(() => {
    const t = setInterval(() => setCursorBlink(b => !b), 500);
    return () => clearInterval(t);
  }, []);

  const handleCreate = () => {
    if (!username.trim()) return;
    const id = Math.random().toString(36).substring(2, 9);
    router.push(`/workspace/${id}?username=${encodeURIComponent(username)}`);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!username.trim() || !roomId.trim()) return;
    router.push(`/workspace/${roomId}?username=${encodeURIComponent(username)}`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fafafa',
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      display: 'flex',
      flexDirection: 'column',
    }}>


      {/* Top nav bar */}
      <nav style={{
        padding: '1rem 2.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #f0f0f0',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '32px', height: '32px',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.85rem', fontWeight: 700, color: '#fff',
          }}>{'<>'}</div>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', letterSpacing: '-0.01em' }}>DevCollab</span>
        </div>
        {/* logo only, no nav links */}
      </nav>

      {/* Main split layout */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        padding: '4rem 2.5rem',
        gap: '5rem',
        alignItems: 'center',
      }}>

        {/* ── LEFT: Hero + Form ── */}
        <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(16px)', transition: 'all 0.5s ease' }}>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: '#ede9fe', borderRadius: '20px', padding: '0.3rem 0.9rem',
            marginBottom: '1.5rem',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7c3aed', display: 'inline-block' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6d28d9', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Developer Collaboration App</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800,
            color: '#0f172a', letterSpacing: '-0.035em',
            lineHeight: 1.15, marginBottom: '1.25rem',
          }}>
            Build together,<br />
            <span style={{ color: '#4f46e5' }}>in real time.</span>
          </h1>

          <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.8, marginBottom: '2.5rem', maxWidth: '400px' }}>
            A shared workspace for developers — live code editor, compiler, whiteboard, and voice calls. No setup. Just a room ID.
          </p>

          {/* Input + Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxWidth: '380px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', fontWeight: 600, color: '#374151', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Your Name</label>
              <input
                type="text"
                placeholder="e.g. Kabeer"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused(null)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                style={{
                  width: '100%', padding: '0.75rem 1rem',
                  background: '#fff',
                  border: `1.5px solid ${focused === 'name' ? '#4f46e5' : '#e2e8f0'}`,
                  borderRadius: '10px', color: '#0f172a',
                  fontSize: '0.9rem', outline: 'none',
                  boxSizing: 'border-box', transition: 'border-color 0.2s',
                  fontFamily: 'inherit',
                  boxShadow: focused === 'name' ? '0 0 0 3px rgba(79,70,229,0.1)' : 'none',
                }}
              />
            </div>

            <button
              onClick={handleCreate}
              onMouseEnter={() => setHoverBtn('create')}
              onMouseLeave={() => setHoverBtn(null)}
              style={{
                padding: '0.8rem 1.5rem',
                background: hoverBtn === 'create' ? '#4338ca' : '#4f46e5',
                border: 'none', borderRadius: '10px',
                color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                cursor: 'pointer', letterSpacing: '0.01em',
                boxShadow: hoverBtn === 'create'
                  ? '0 8px 24px rgba(79,70,229,0.4)'
                  : '0 4px 14px rgba(79,70,229,0.25)',
                transform: hoverBtn === 'create' ? 'translateY(-1px)' : 'none',
                transition: 'all 0.2s ease', fontFamily: 'inherit',
              }}
            >
              + Create New Session
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 500, letterSpacing: '0.06em' }}>OR JOIN WITH ROOM ID</span>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            </div>

            <form onSubmit={handleJoin} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Paste Room ID"
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
                onFocus={() => setFocused('room')}
                onBlur={() => setFocused(null)}
                style={{
                  flex: 1, padding: '0.75rem 1rem',
                  background: '#fff',
                  border: `1.5px solid ${focused === 'room' ? '#4f46e5' : '#e2e8f0'}`,
                  borderRadius: '10px', color: '#0f172a',
                  fontSize: '0.82rem', outline: 'none',
                  boxSizing: 'border-box', transition: 'border-color 0.2s',
                  fontFamily: '"Fira Code", monospace',
                  boxShadow: focused === 'room' ? '0 0 0 3px rgba(79,70,229,0.1)' : 'none',
                }}
              />
              <button
                type="submit"
                onMouseEnter={() => setHoverBtn('join')}
                onMouseLeave={() => setHoverBtn(null)}
                style={{
                  padding: '0.75rem 1.1rem',
                  background: hoverBtn === 'join' ? '#f5f3ff' : '#fff',
                  border: `1.5px solid ${hoverBtn === 'join' ? '#4f46e5' : '#e2e8f0'}`,
                  borderRadius: '10px', color: '#4f46e5',
                  fontWeight: 700, fontSize: '0.82rem',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease', fontFamily: 'inherit',
                }}
              >
                Join →
              </button>
            </form>
          </div>
        </div>

        {/* ── RIGHT: Product Illustration ── */}
        <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(20px)', transition: 'all 0.6s ease 0.15s' }}>
          {/* Workspace mockup */}
          <div style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
          }}>
            {/* Window chrome */}
            <div style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9', padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fca5a5' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fde68a' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#86efac' }} />
              </div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <div style={{ background: '#f1f5f9', borderRadius: '6px', padding: '0.2rem 1rem', fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'monospace' }}>devcollab.app/workspace/x4k9z2</div>
              </div>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {['K', 'K'].map((l, i) => (
                  <div key={i} style={{ width: '22px', height: '22px', borderRadius: '50%', background: ['#818cf8', '#f472b6'][i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, color: '#fff', border: '2px solid #fff', marginLeft: i > 0 ? '-6px' : 0 }}>{l}</div>
                ))}
              </div>
            </div>

            {/* Editor tabs */}
            <div style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9', padding: '0 1rem', display: 'flex', gap: '0' }}>
              {['index.html', 'styles.css', 'app.js'].map((tab, i) => (
                <div key={tab} style={{ padding: '0.5rem 1rem', fontSize: '0.72rem', color: i === 0 ? '#4f46e5' : '#94a3b8', fontFamily: 'monospace', borderBottom: i === 0 ? '2px solid #4f46e5' : '2px solid transparent', cursor: 'pointer', fontWeight: i === 0 ? 600 : 400 }}>{tab}</div>
              ))}
            </div>

            {/* Code area */}
            <div style={{ display: 'flex', background: '#fff', minHeight: '200px' }}>
              {/* Line numbers */}
              <div style={{ background: '#f8fafc', padding: '1rem 0.6rem', color: '#cbd5e1', fontSize: '0.7rem', fontFamily: 'monospace', lineHeight: '1.7', textAlign: 'right', userSelect: 'none', borderRight: '1px solid #f1f5f9', minWidth: '32px' }}>
                {CODE_LINES.slice(0, visibleLines).map((_, i) => (
                  <div key={i} style={{ color: i + 1 === visibleLines ? '#94a3b8' : '#e2e8f0' }}>{i + 1}</div>
                ))}
              </div>
              {/* Animated Code lines */}
              <div style={{ padding: '1rem', fontFamily: '"Fira Code", monospace', fontSize: '0.75rem', lineHeight: '1.7', flex: 1, position: 'relative', minHeight: '200px' }}>
                {CODE_LINES.slice(0, visibleLines).map((line, i) => {
                  const isCurrentLine = i === visibleLines - 1;
                  const displayText = isCurrentLine ? line.code.slice(0, charCount) : line.code;
                  const showCursor = isCurrentLine && cursorBlink;
                  return (
                    <div key={i} style={{
                      position: 'relative',
                      background: line.cursor ? `${line.cursor.color}11` : 'transparent',
                      borderRadius: '3px',
                      opacity: isCurrentLine ? 1 : 0.92,
                      transition: 'opacity 0.2s',
                    }}>
                      {/* Collaborator cursor bar */}
                      {line.cursor && !isCurrentLine && (
                        <>
                          <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px', background: line.cursor.color, borderRadius: '1px' }} />
                          <span style={{ position: 'absolute', top: '-1px', left: '3px', background: line.cursor.color, color: '#fff', fontSize: '0.55rem', padding: '0 4px', borderRadius: '3px', fontFamily: 'sans-serif', fontWeight: 600, lineHeight: '14px' }}>
                            {line.cursor.user}
                          </span>
                        </>
                      )}
                      <span style={{ color: line.color || '#cdd9e5', fontStyle: line.italic ? 'italic' : 'normal' }}>
                        {displayText || '\u00A0'}
                      </span>
                      {/* Typing cursor on active line */}
                      {showCursor && (
                        <span style={{ display: 'inline-block', width: '2px', height: '13px', background: '#4f46e5', marginLeft: '1px', verticalAlign: 'middle', borderRadius: '1px' }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status bar */}
            <div style={{ background: '#4f46e5', padding: '0.3rem 1rem', display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '1.2rem' }}>
                <span style={{ fontSize: '0.65rem', color: '#c7d2fe' }}>● Live · 2 members</span>
                <span style={{ fontSize: '0.65rem', color: '#c7d2fe' }}>Python 3.11</span>
              </div>
              <span style={{ fontSize: '0.65rem', color: '#c7d2fe' }}>UTF-8 · LF</span>
            </div>
          </div>

          {/* Feature stat row below mockup */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
            {[
              { value: '12+', label: 'Languages', color: '#4f46e5' },
              { value: '<50ms', label: 'Sync Latency', color: '#10b981' },
              { value: '∞', label: 'Collaborators', color: '#f59e0b' },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '10px', padding: '0.75rem 1rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.15rem', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fafafa; }
        input::placeholder { color: #94a3b8; }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
