'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BookOpen, Terminal, Users, Zap, Sparkles, ArrowLeft, Code2, 
  Layers, Cpu, MessageSquare, Video, Shield, CheckCircle2, 
  Palette, Globe, Mic, Volume2, FileCode, ArrowRight, Share2
} from 'lucide-react';

export default function DocumentationPage() {
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState('quickstart');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setIsDark(savedTheme === 'dark');
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = !isDark ? 'dark' : 'light';
    setIsDark(!isDark);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const colors = {
    bg: isDark ? '#080c14' : '#f8fafc',
    cardBg: isDark ? 'rgba(17, 24, 39, 0.7)' : 'rgba(255, 255, 255, 0.85)',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    textPrimary: isDark ? '#f8fafc' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#475569',
    textMuted: isDark ? '#64748b' : '#94a3b8',
    navBg: isDark ? 'rgba(8, 12, 20, 0.85)' : 'rgba(248, 250, 252, 0.85)',
    accent: '#6366f1',
    sidebarBg: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(241, 245, 249, 0.7)',
  };

  if (!mounted) {
    return <div style={{ minHeight: '100vh', background: '#080c14' }} />;
  }

  const DOC_SECTIONS = [
    { id: 'quickstart', name: 'Quick Start & Setup', icon: Zap, color: '#f59e0b' },
    { id: 'editor', name: 'Instant CRDT Code Editor', icon: Code2, color: '#3b82f6' },
    { id: 'whiteboard', name: 'Architecture Whiteboard', icon: Palette, color: '#8b5cf6' },
    { id: 'webrtc', name: 'WebRTC Voice Channels', icon: Mic, color: '#10b981' },
    { id: 'templates', name: 'Starter Templates', icon: Globe, color: '#06b6d4' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bg,
      color: colors.textPrimary,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      position: 'relative',
      overflowX: 'hidden',
    }}>
      {/* Background Glows */}
      <div style={{
        position: 'absolute', top: '-10%', left: '30%', width: '500px', height: '500px',
        background: isDark ? 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none', zIndex: 1
      }} />

      {/* Top Navigation */}
      <nav style={{
        padding: '1rem 3rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${colors.cardBorder}`,
        background: colors.navBg,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <Link href="/" style={{
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          textDecoration: 'none', color: colors.textPrimary, fontWeight: 700, fontSize: '0.95rem',
          padding: '0.5rem 1rem', borderRadius: '10px',
          background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          border: `1px solid ${colors.cardBorder}`,
          transition: 'all 0.2s ease',
        }} className="back-btn">
          <ArrowLeft size={16} color={colors.accent} />
          <span>Back to Workspace Launchpad</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.35rem 0.75rem', borderRadius: '20px',
            background: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em'
          }}>
            <BookOpen size={13} />
            <span>Platform Documentation</span>
          </div>

          <button
            onClick={toggleTheme}
            style={{
              padding: '0.5rem 0.8rem', borderRadius: '10px', border: `1px solid ${colors.cardBorder}`,
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              color: colors.textPrimary, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600
            }}
          >
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem 5rem', position: 'relative', zIndex: 10 }}>
        
        {/* Header */}
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: 'clamp(2.4rem, 4vw, 3.4rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '0.8rem' }}>
            DevCollab Documentation
          </h1>
          <p style={{ fontSize: '1.1rem', color: colors.textSecondary, maxWidth: '600px', margin: '0 auto' }}>
            Everything you need to know about setting up real-time collaboration sessions, configuring WebRTC voice channels, and mastering the CRDT editor.
          </p>
        </div>

        {/* Content Layout Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2.5rem', alignItems: 'start' }} className="docs-grid">
          
          {/* Sidebar Navigation */}
          <aside style={{
            background: colors.sidebarBg,
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: '16px',
            padding: '1.2rem',
            position: 'sticky', top: '90px',
            backdropFilter: 'blur(16px)'
          }}>
            <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.8rem', paddingLeft: '0.5rem' }}>
              Guide Topics
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {DOC_SECTIONS.map((sec) => {
                const Icon = sec.icon;
                const isSel = activeTab === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveTab(sec.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.7rem',
                      padding: '0.75rem 1rem', borderRadius: '12px',
                      background: isSel ? (isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.12)') : 'transparent',
                      border: `1px solid ${isSel ? 'rgba(99, 102, 241, 0.4)' : 'transparent'}`,
                      color: isSel ? '#818cf8' : colors.textSecondary,
                      fontWeight: isSel ? 700 : 500, fontSize: '0.9rem',
                      textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s ease',
                    }}
                    className="sidebar-item"
                  >
                    <Icon size={18} color={isSel ? '#818cf8' : sec.color} />
                    <span>{sec.name}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Main Doc Content Area */}
          <div style={{
            background: colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: '20px',
            padding: '2.5rem',
            backdropFilter: 'blur(20px)',
            minHeight: '540px'
          }}>
            
            {/* QUICK START TAB */}
            {activeTab === 'quickstart' && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '1.5rem', borderBottom: `1px solid ${colors.cardBorder}`, paddingBottom: '1rem' }}>
                  <div style={{ padding: '0.6rem', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '12px', color: '#f59e0b', display: 'flex' }}>
                    <Zap size={24} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Quick Start & Setup</h2>
                    <span style={{ fontSize: '0.9rem', color: colors.textMuted }}>Launch your first real-time engineering session in seconds</span>
                  </div>
                </div>

                <p style={{ fontSize: '1rem', lineHeight: 1.7, color: colors.textSecondary, marginBottom: '1.8rem' }}>
                  DevCollab is engineered for zero configuration. You don&apos;t need to install local daemons, configure SSH tunnels, or set up Docker containers to start collaborative programming.
                </p>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.8rem', color: colors.textPrimary }}>1. Creating a New Workspace</h3>
                <ol style={{ paddingLeft: '1.5rem', lineHeight: 1.8, color: colors.textSecondary, fontSize: '0.95rem', marginBottom: '2rem' }}>
                  <li>On the home landing page, select the <strong>&quot;+ New Workspace&quot;</strong> tab in the command card.</li>
                  <li>Enter your display name (e.g. <em>Alex, Kabeer, Sarah</em>). This name will appear on your real-time collaborator cursor.</li>
                  <li>Select your starter template: <strong>Web HTML/CSS/JS</strong>, <strong>Python Data/ML</strong>, <strong>React 18</strong>, or <strong>System Architecture Whiteboard</strong>.</li>
                  <li>Click <strong>&quot;Launch Realtime Workspace&quot;</strong>. You will be instantly routed into a secure 7-character session room.</li>
                </ol>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.8rem', color: colors.textPrimary }}>2. Inviting Teammates</h3>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: colors.textSecondary, marginBottom: '1rem' }}>
                  Once inside your workspace, look at the top navigation header. You will see your unique <strong>Room ID</strong> (e.g., <code style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', padding: '0.2rem 0.5rem', borderRadius: '6px', color: '#38bdf8' }}>7X9K2mP</code>).
                </p>
                <div style={{ background: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '12px', padding: '1.2rem', color: colors.textPrimary, fontSize: '0.9rem', lineHeight: 1.6 }}>
                  <strong>💡 Pro-Tip:</strong> Click the <strong>&quot;Copy Invite Link&quot;</strong> button in the top right of the workspace. Anyone who clicks your link will bypass manual room entry and join directly with full read/write collaboration privileges!
                </div>
              </div>
            )}

            {/* CRDT EDITOR TAB */}
            {activeTab === 'editor' && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '1.5rem', borderBottom: `1px solid ${colors.cardBorder}`, paddingBottom: '1rem' }}>
                  <div style={{ padding: '0.6rem', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '12px', color: '#3b82f6', display: 'flex' }}>
                    <Code2 size={24} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Instant CRDT Code Editor</h2>
                    <span style={{ fontSize: '0.9rem', color: colors.textMuted }}>Multi-cursor synchronization without merge conflicts</span>
                  </div>
                </div>

                <p style={{ fontSize: '1rem', lineHeight: 1.7, color: colors.textSecondary, marginBottom: '1.5rem' }}>
                  At the core of DevCollab is a Conflict-Free Replicated Data Type (CRDT) synchronization engine. Unlike traditional operational transformation (OT) systems that require centralized server locks, CRDTs allow all connected peers to edit simultaneously with zero latency.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '2rem' }}>
                  <div style={{ padding: '1.2rem', background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)', borderRadius: '14px', border: `1px solid ${colors.cardBorder}` }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.5rem', marginTop: 0 }}>👥 Multi-Cursor Tracking</h4>
                    <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: 0, lineHeight: 1.6 }}>
                      See exact line and column positions of your teammates in real-time. Each collaborator is assigned a unique color tag and floating name label.
                    </p>
                  </div>
                  <div style={{ padding: '1.2rem', background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)', borderRadius: '14px', border: `1px solid ${colors.cardBorder}` }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#10b981', marginBottom: '0.5rem', marginTop: 0 }}>⚡ Instant Sandbox Execution</h4>
                    <p style={{ fontSize: '0.85rem', color: colors.textSecondary, margin: 0, lineHeight: 1.6 }}>
                      Execute JavaScript, test React components, or run algorithmic Python code directly within the built-in browser console and DOM output viewer.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* WHITEBOARD TAB */}
            {activeTab === 'whiteboard' && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '1.5rem', borderBottom: `1px solid ${colors.cardBorder}`, paddingBottom: '1rem' }}>
                  <div style={{ padding: '0.6rem', background: 'rgba(139, 92, 246, 0.15)', borderRadius: '12px', color: '#8b5cf6', display: 'flex' }}>
                    <Palette size={24} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Architecture Whiteboard</h2>
                    <span style={{ fontSize: '0.9rem', color: colors.textMuted }}>Collaborative system design and diagramming</span>
                  </div>
                </div>

                <p style={{ fontSize: '1rem', lineHeight: 1.7, color: colors.textSecondary, marginBottom: '1.5rem' }}>
                  When building distributed systems, visualizing microservices, databases, and API gateways is essential. Our built-in architecture whiteboard lets your team draw, connect, and annotate system topologies in real time.
                </p>

                <ul style={{ paddingLeft: '1.5rem', lineHeight: 1.8, color: colors.textSecondary, fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                  <li><strong>Infinite Canvas:</strong> Pan and zoom across an unbounded 2D engineering workspace.</li>
                  <li><strong>Standard System Nodes:</strong> Drag and drop pre-styled components (Load Balancers, Redis Caches, PostgreSQL databases, Docker containers, and AWS Lambda functions).</li>
                  <li><strong>Vector Connector Lines:</strong> Draw directed arrows and data flow paths between architectural components.</li>
                </ul>
              </div>
            )}

            {/* WEBRTC AUDIO TAB */}
            {activeTab === 'webrtc' && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '1.5rem', borderBottom: `1px solid ${colors.cardBorder}`, paddingBottom: '1rem' }}>
                  <div style={{ padding: '0.6rem', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '12px', color: '#10b981', display: 'flex' }}>
                    <Mic size={24} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>WebRTC Voice Channels</h2>
                    <span style={{ fontSize: '0.9rem', color: colors.textMuted }}>High-fidelity spatial audio without third-party apps</span>
                  </div>
                </div>

                <p style={{ fontSize: '1rem', lineHeight: 1.7, color: colors.textSecondary, marginBottom: '1.5rem' }}>
                  No need to switch to Zoom, Discord, or Google Meet during a pair programming session. DevCollab includes integrated peer-to-peer WebRTC voice communication directly inside the IDE room.
                </p>

                <div style={{ background: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#10b981', marginTop: 0, marginBottom: '0.6rem' }}>🎙️ One-Click Audio Toggle</h4>
                  <p style={{ fontSize: '0.9rem', color: colors.textSecondary, margin: 0, lineHeight: 1.6 }}>
                    In the workspace toolbar, simply click the <strong>Microphone icon</strong> to unmute or mute your audio stream. Voice packets are routed peer-to-peer using Secure Real-time Transport Protocol (SRTP) with automatic echo cancellation and background noise suppression.
                  </p>
                </div>
              </div>
            )}

            {/* TEMPLATES TAB */}
            {activeTab === 'templates' && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '1.5rem', borderBottom: `1px solid ${colors.cardBorder}`, paddingBottom: '1rem' }}>
                  <div style={{ padding: '0.6rem', background: 'rgba(6, 182, 212, 0.15)', borderRadius: '12px', color: '#06b6d4', display: 'flex' }}>
                    <Globe size={24} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Starter Templates</h2>
                    <span style={{ fontSize: '0.9rem', color: colors.textMuted }}>Tailored environments for every engineering task</span>
                  </div>
                </div>

                <p style={{ fontSize: '1rem', lineHeight: 1.7, color: colors.textSecondary, marginBottom: '1.5rem' }}>
                  Choose from four optimized presets when initializing your collaboration session:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ padding: '1.2rem', background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)', borderRadius: '12px', border: `1px solid ${colors.cardBorder}` }}>
                    <strong style={{ color: '#3b82f6', fontSize: '1rem', display: 'block', marginBottom: '0.3rem' }}>🌐 Web HTML/CSS/JS</strong>
                    <span style={{ fontSize: '0.9rem', color: colors.textSecondary }}>Features a live DOM split-screen rendering pane. As you type CSS or HTML tags, the preview window updates instantly for all connected teammates.</span>
                  </div>
                  <div style={{ padding: '1.2rem', background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)', borderRadius: '12px', border: `1px solid ${colors.cardBorder}` }}>
                    <strong style={{ color: '#10b981', fontSize: '1rem', display: 'block', marginBottom: '0.3rem' }}>🐍 Python Data / ML</strong>
                    <span style={{ fontSize: '0.9rem', color: colors.textSecondary }}>Configured for algorithmic problem solving, data processing scripts, and technical coding interviews with stdout/stderr console streaming.</span>
                  </div>
                  <div style={{ padding: '1.2rem', background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)', borderRadius: '12px', border: `1px solid ${colors.cardBorder}` }}>
                    <strong style={{ color: '#06b6d4', fontSize: '1rem', display: 'block', marginBottom: '0.3rem' }}>⚛️ React 18 Component</strong>
                    <span style={{ fontSize: '0.9rem', color: colors.textSecondary }}>Pre-configured JSX compiler environment with state hooks, styled elements, and interactive component playground.</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer Note */}
        <div style={{ marginTop: '4rem', textAlign: 'center', padding: '2rem', borderTop: `1px solid ${colors.cardBorder}`, color: colors.textMuted, fontSize: '0.85rem' }}>
          <p style={{ margin: '0 0 0.5rem' }}>
            © {new Date().getFullYear()} <strong>DevCollab</strong>. Advanced Realtime IDE Documentation.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.8rem' }}>
            <Link href="/" style={{ color: colors.accent, textDecoration: 'none', fontWeight: 600 }}>Return to Launchpad →</Link>
            <Link href="/privacy" style={{ color: colors.textSecondary, textDecoration: 'none' }}>Privacy Policy</Link>
            <Link href="/terms" style={{ color: colors.textSecondary, textDecoration: 'none' }}>Terms of Service</Link>
          </div>
        </div>

      </main>

      <style jsx global>{`
        .back-btn:hover {
          background: rgba(99, 102, 241, 0.15) !important;
          border-color: #6366f1 !important;
          transform: translateX(-3px);
        }
        .sidebar-item:hover {
          background: rgba(99, 102, 241, 0.1) !important;
        }
        @media (max-width: 768px) {
          .docs-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
