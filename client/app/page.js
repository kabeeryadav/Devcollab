'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Code2, Terminal, Users, Zap, Sparkles, Play, ArrowRight, Share2, 
  Layers, Cpu, MessageSquare, Video, Shield, GitBranch, CheckCircle2, 
  Radio, Sun, Moon, Plus, Compass, Layout, Monitor, Mic, Volume2,
  FileCode, Palette, Activity, Globe, Send, CornerDownLeft
} from 'lucide-react';

// Starter template choices for creating a session
const STARTER_TEMPLATES = [
  { id: 'web', name: 'Web HTML/CSS/JS', icon: Globe, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', desc: 'Live web preview & real-time DOM' },
  { id: 'python', name: 'Python Data / ML', icon: Terminal, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', desc: 'Fast algorithmic sandbox & console' },
  { id: 'react', name: 'React 18 Component', icon: Code2, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)', border: 'rgba(6, 182, 212, 0.3)', desc: 'Modern JSX & state collaboration' },
  { id: 'whiteboard', name: 'System Architecture', icon: Palette, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.3)', desc: 'Interactive infinite whiteboard' },
];

// Feature showcase cards
const FEATURES = [
  {
    icon: Zap,
    title: 'Zero-Latency CRDT Sync',
    desc: 'Decentralized peer-to-peer conflict-free synchronization. Your edits stream instantly with sub-20ms latency across the globe.',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)'
  },
  {
    icon: Palette,
    title: 'Integrated Whiteboard',
    desc: 'Switch seamlessly from coding to system architecture. Draw flowcharts, wireframes, and sticky notes on an infinite shared canvas.',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)'
  },
  {
    icon: Mic,
    title: 'Spatial Audio & Video Rooms',
    desc: 'Talk to your teammates without leaving your editor. Built-in WebRTC voice channels and screen sharing with crystal clear quality.',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #059669)'
  },
  {
    icon: Cpu,
    title: 'Multi-Language Execution',
    desc: 'Compile and run Python, JavaScript, TypeScript, Go, and Rust directly in the secure cloud browser sandbox with instant stdout.',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)'
  }
];

// Interactive mockup code lines
const CODE_SNIPPETS = {
  code: [
    { num: 1, text: '// Real-time Collaborative Engine v2.0', color: '#64748b', italic: true },
    { num: 2, text: 'import { Workspace, CRDT, VoiceChannel } from "@devcollab/core";', color: '#818cf8' },
    { num: 3, text: '', color: '' },
    { num: 4, text: 'const room = new Workspace({ id: "collab-room-alpha" });', color: '#e2e8f0' },
    { num: 5, text: 'room.connect({ user: "Kabeer", role: "host" });', color: '#38bdf8', cursor: { user: 'Kabeer 👑', color: '#38bdf8' } },
    { num: 6, text: '', color: '' },
    { num: 7, text: '// Sync editor state across connected peers', color: '#64748b', italic: true },
    { num: 8, text: 'room.on("delta", (change) => {', color: '#f472b6', cursor: { user: 'Sarah 🎨', color: '#f472b6' } },
    { num: 9, text: '  CRDT.applyPatch(editor.getModel(), change);', color: '#a78bfa' },
    { num: 10, text: '  console.log("Sync applied in", change.latency, "ms");', color: '#34d399' },
    { num: 11, text: '});', color: '#f472b6' },
    { num: 12, text: '', color: '' },
    { num: 13, text: 'VoiceChannel.join({ spatialAudio: true, echoCancellation: true });', color: '#fbbf24', cursor: { user: 'Alex ⚡', color: '#fbbf24' } },
  ],
  logs: [
    { time: '20:21:04.12', type: 'INFO', msg: 'CRDT WebSocket mesh connected to 3 regional edge nodes.', color: '#38bdf8' },
    { time: '20:21:04.18', type: 'SUCCESS', msg: 'Peer "Sarah 🎨" joined from peer-id: wss://eu-west-1.node', color: '#34d399' },
    { time: '20:21:05.02', type: 'SUCCESS', msg: 'Peer "Alex ⚡" joined audio channel (WebRTC Opus 48kHz)', color: '#a78bfa' },
    { time: '20:21:06.45', type: 'SYNC', msg: 'Delta applied (offset +142 chars). Latency: 11.4ms', color: '#fbbf24' },
    { time: '20:21:08.90', type: 'EXEC', msg: 'Sandbox compiled container in 132ms. Exit code 0.', color: '#f472b6' },
  ]
};

export default function HomeDashboard() {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);
  const [activeFormTab, setActiveFormTab] = useState('create'); // 'create' or 'join'
  const [selectedTemplate, setSelectedTemplate] = useState('web');
  const [mockupTab, setMockupTab] = useState('code'); // 'code', 'whiteboard', 'preview', 'logs'
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  
  // Animation states for code typing
  const [visibleCodeLines, setVisibleCodeLines] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    // Check initial theme from localStorage or default to dark for maximum immersion
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

  // Code typing animation effect
  useEffect(() => {
    if (mockupTab !== 'code') return;
    if (visibleCodeLines < CODE_SNIPPETS.code.length) {
      const timer = setTimeout(() => setVisibleCodeLines(v => v + 1), 350);
      return () => clearTimeout(timer);
    }
  }, [visibleCodeLines, mockupTab]);

  useEffect(() => {
    if (mockupTab !== 'code' || visibleCodeLines === 0 || visibleCodeLines > CODE_SNIPPETS.code.length) return;
    const line = CODE_SNIPPETS.code[visibleCodeLines - 1];
    setCharCount(0);
    if (!line.text) return;
    let i = 0;
    const timer = setInterval(() => {
      i += 2;
      setCharCount(i);
      if (i >= line.text.length) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, [visibleCodeLines, mockupTab]);

  const navigateToWorkspace = (url) => {
    try {
      router.push(url);
    } catch (e) {
      window.location.href = url;
    }
    setTimeout(() => {
      if (window.location.pathname === '/') {
        window.location.href = url;
      }
    }, 150);
  };

  const handleCreate = (e) => {
    if (e) e.preventDefault();
    if (!username.trim()) return;
    const id = Math.random().toString(36).substring(2, 9);
    navigateToWorkspace(`/workspace/${id}?username=${encodeURIComponent(username)}&host=true&template=${selectedTemplate}`);
  };

  const handleJoin = (e) => {
    if (e) e.preventDefault();
    if (!username.trim() || !roomId.trim()) return;
    navigateToWorkspace(`/workspace/${roomId}?username=${encodeURIComponent(username)}`);
  };

  const handleQuickDemo = (e) => {
    if (e) e.preventDefault();
    const randomId = 'demo-' + Math.random().toString(36).substring(2, 7);
    const demoUser = username.trim() ? username : 'Demo Developer';
    navigateToWorkspace(`/workspace/${randomId}?username=${encodeURIComponent(demoUser)}&host=true&template=web`);
  };

  if (!mounted) {
    return <div style={{ minHeight: '100vh', background: '#0b0f19' }} />;
  }

  // Theme variable colors
  // Theme variable colors - Immersive Cyberpunk & Neon Matrix Palette
  const colors = {
    bg: isDark ? '#02040a' : '#f8fafc',
    cardBg: isDark ? 'rgba(13, 18, 36, 0.75)' : 'rgba(255, 255, 255, 0.85)',
    cardBorder: isDark ? 'rgba(0, 240, 255, 0.22)' : 'rgba(0, 0, 0, 0.08)',
    textPrimary: isDark ? '#ffffff' : '#0f172a',
    textSecondary: isDark ? '#a5b4fc' : '#64748b',
    textMuted: isDark ? '#64748b' : '#94a3b8',
    inputBg: isDark ? 'rgba(6, 10, 22, 0.9)' : '#ffffff',
    inputBorder: isDark ? 'rgba(0, 240, 255, 0.3)' : '#cbd5e1',
    glowPrimary: isDark ? 'rgba(0, 240, 255, 0.4)' : 'rgba(59, 130, 246, 0.15)',
    navBg: isDark ? 'rgba(2, 4, 10, 0.85)' : 'rgba(255, 255, 255, 0.85)',
  };

  return (
    <div className="home-container" style={{
      minHeight: '100vh',
      background: colors.bg,
      color: colors.textPrimary,
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      position: 'relative',
      overflowX: 'hidden',
      transition: 'background-color 0.4s ease, color 0.4s ease',
    }}>
      {/* ── AMBIENT CYBERPUNK MATRIX & PARTICLE BACKGROUND ── */}
      <div className="ambient-background" style={{
        background: isDark ? 'radial-gradient(circle at 50% 30%, #081028 0%, #02040a 85%)' : 'none'
      }}>
        <div className="plasma-beam beam-1" style={{ opacity: isDark ? 0.18 : 0.05 }} />
        <div className="plasma-beam beam-2" style={{ opacity: isDark ? 0.18 : 0.05 }} />
        <div className="plasma-beam beam-3" style={{ opacity: isDark ? 0.18 : 0.05 }} />
        <div className="glow-sphere sphere-1" style={{ opacity: isDark ? 0.3 : 0.12 }} />
        <div className="glow-sphere sphere-2" style={{ opacity: isDark ? 0.3 : 0.12 }} />
        <div className="glow-sphere sphere-3" style={{ opacity: isDark ? 0.3 : 0.12 }} />
        <div className="cyber-grid" style={{
          backgroundImage: `linear-gradient(to right, ${isDark ? 'rgba(0, 240, 255, 0.08)' : 'rgba(0,0,0,0.05)'} 1px, transparent 1px), linear-gradient(to bottom, ${isDark ? 'rgba(0, 240, 255, 0.08)' : 'rgba(0,0,0,0.05)'} 1px, transparent 1px)`
        }} />
        <div className="scanline" style={{ opacity: isDark ? 0.7 : 0.2 }} />
        {/* Floating animated neon particles */}
        <div className="particles-container">
          {[...Array(20)].map((_, i) => {
            const color = i % 3 === 0 ? '#ff007f' : (i % 2 === 0 ? '#8a2be2' : '#00f0ff');
            return (
              <div
                key={i}
                className="cyber-particle"
                style={{
                  left: `${Math.floor((i * 17) % 95)}%`,
                  bottom: '-10%',
                  animationDuration: `${7 + (i % 6)}s`,
                  animationDelay: `${-(i * 1.1)}s`,
                  background: color,
                  boxShadow: `0 0 10px ${color}`,
                  transform: `scale(${0.7 + ((i % 5) * 0.3)})`,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* ── TOP NAV BAR ── */}
      <nav style={{
        padding: '0.85rem 3rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${colors.cardBorder}`,
        background: colors.navBg,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div style={{
            width: '38px', height: '38px',
            background: 'linear-gradient(135deg, #6366f1, #3b82f6, #06b6d4)',
            borderRadius: '11px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
            position: 'relative', overflow: 'hidden'
          }}>
            <Code2 size={20} strokeWidth={2.5} />
            <div className="shimmer-effect" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', background: 'linear-gradient(to right, #6366f1, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>DevCollab</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}>2.0 LIVE</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: colors.textMuted, display: 'block', marginTop: '-2px' }}>Realtime Developer Workspace</span>
          </div>
        </div>

        {/* Right Nav Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            style={{
              width: '40px', height: '40px',
              borderRadius: '10px',
              border: `1px solid ${colors.cardBorder}`,
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              color: colors.textPrimary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s ease'
            }}
            className="hover-scale"
          >
            {isDark ? <Sun size={18} color="#fbbf24" /> : <Moon size={18} color="#6366f1" />}
          </button>

          {/* Quick Launch Button */}
          <button
            onClick={handleQuickDemo}
            style={{
              padding: '0.6rem 1.25rem',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              border: 'none', borderRadius: '10px',
              color: '#fff', fontWeight: 600, fontSize: '0.85rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
              transition: 'all 0.2s ease',
            }}
            className="hover-lift"
          >
            <Sparkles size={15} />
            <span>Instant Sandbox</span>
          </button>
        </div>
      </nav>

      {/* ── MAIN HERO SECTION ── */}
      <div style={{
        maxWidth: '1380px',
        margin: '0 auto',
        padding: '2.2rem 3rem 3rem',
        display: 'grid',
        gridTemplateColumns: '1.05fr 1.35fr',
        gap: '3.5rem',
        alignItems: 'center',
        position: 'relative',
        zIndex: 10,
      }}>

        {/* ── LEFT: HERO COPY & INTERACTIVE LAUNCHPAD ── */}
        <div className="hero-left" style={{ animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          
          {/* Glowing Pill Tag */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.4rem 1rem', borderRadius: '30px',
            background: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            marginBottom: '1rem',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.15)'
          }}>
            <Sparkles size={14} color="#818cf8" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#818cf8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Collaborative IDE & Audio Channels
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.4rem, 3.8vw, 3.5rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: '-0.04em',
            marginBottom: '1rem',
            color: colors.textPrimary,
          }}>
            Code together.<br />
            Build faster.<br />
            <span className="text-gradient">In real time.</span>
          </h1>

          <p style={{
            fontSize: '1.05rem',
            lineHeight: 1.6,
            color: colors.textSecondary,
            marginBottom: '1.5rem',
            maxWidth: '520px',
          }}>
            A frictionless shared workspace for engineering teams. Instant CRDT code editor, interactive system architecture whiteboard, WebRTC voice channels, and cloud compiler. Zero config.
          </p>

          {/* ── THE COMMAND CARD (FORM) ── */}
          <div style={{
            background: colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: '20px',
            padding: '1.35rem 1.5rem',
            boxShadow: isDark ? '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 102, 241, 0.08)' : '0 20px 50px rgba(0, 0, 0, 0.07)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            maxWidth: '480px',
          }}>
            {/* Form Mode Switch Tabs */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              background: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)',
              padding: '0.3rem', borderRadius: '12px',
              marginBottom: '1rem',
              border: `1px solid ${colors.cardBorder}`
            }}>
              <button
                type="button"
                onClick={() => setActiveFormTab('create')}
                style={{
                  padding: '0.65rem 1rem', borderRadius: '9px',
                  border: 'none',
                  background: activeFormTab === 'create' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'transparent',
                  color: activeFormTab === 'create' ? '#ffffff' : colors.textSecondary,
                  fontWeight: activeFormTab === 'create' ? 700 : 500,
                  fontSize: '0.85rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  boxShadow: activeFormTab === 'create' ? '0 4px 12px rgba(59, 130, 246, 0.35)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <Plus size={16} />
                <span>New Workspace</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('join')}
                style={{
                  padding: '0.65rem 1rem', borderRadius: '9px',
                  border: 'none',
                  background: activeFormTab === 'join' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
                  color: activeFormTab === 'join' ? '#ffffff' : colors.textSecondary,
                  fontWeight: activeFormTab === 'join' ? 700 : 500,
                  fontSize: '0.85rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  boxShadow: activeFormTab === 'join' ? '0 4px 12px rgba(99, 102, 241, 0.35)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <Share2 size={16} />
                <span>Join Room ID</span>
              </button>
            </div>

            {/* CREATE SESSION FORM */}
            {activeFormTab === 'create' ? (
              <form onSubmit={handleCreate}>
                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
                    Your Display Name
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Users size={18} style={{ position: 'absolute', left: '1rem', color: focusedInput === 'name' ? '#6366f1' : colors.textMuted, transition: 'color 0.2s' }} />
                    <input
                      type="text"
                      placeholder="e.g. Kabeer, Sarah, Alex..."
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      onFocus={() => setFocusedInput('name')}
                      onBlur={() => setFocusedInput(null)}
                      style={{
                        width: '100%', padding: '0.75rem 1rem 0.75rem 2.8rem',
                        background: colors.inputBg,
                        border: `1.5px solid ${focusedInput === 'name' ? '#6366f1' : colors.inputBorder}`,
                        borderRadius: '12px', color: colors.textPrimary,
                        fontSize: '0.95rem', outline: 'none',
                        transition: 'all 0.2s ease',
                        boxShadow: focusedInput === 'name' ? '0 0 0 4px rgba(99, 102, 241, 0.15)' : 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Template Selector Grid */}
                <div style={{ marginBottom: '1.1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>
                    Choose Starter Template
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {STARTER_TEMPLATES.map((t) => {
                      const Icon = t.icon;
                      const isSelected = selectedTemplate === t.id;
                      return (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTemplate(t.id)}
                          style={{
                            padding: '0.6rem 0.7rem',
                            borderRadius: '12px',
                            background: isSelected ? t.bg : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
                            border: `1.5px solid ${isSelected ? t.color : colors.cardBorder}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex', flexDirection: 'column', gap: '0.3rem',
                            position: 'relative',
                            boxShadow: isSelected ? `0 4px 14px ${t.color}22` : 'none'
                          }}
                          className="hover-border"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Icon size={16} color={t.color} />
                              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isSelected ? colors.textPrimary : colors.textSecondary }}>{t.name}</span>
                            </div>
                            {isSelected && <CheckCircle2 size={14} color={t.color} />}
                          </div>
                          <span style={{ fontSize: '0.68rem', color: colors.textMuted, lineHeight: 1.3 }}>{t.desc}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%', padding: '0.85rem',
                    background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
                    border: 'none', borderRadius: '12px',
                    color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                    boxShadow: '0 8px 25px rgba(99, 102, 241, 0.4)',
                    transition: 'all 0.2s ease',
                  }}
                  className="hover-lift-btn"
                >
                  <span>Launch Realtime Workspace</span>
                  <ArrowRight size={18} />
                </button>
              </form>
            ) : (
              /* JOIN ROOM FORM */
              <form onSubmit={handleJoin}>
                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
                    Your Display Name
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Users size={18} style={{ position: 'absolute', left: '1rem', color: focusedInput === 'join-name' ? '#6366f1' : colors.textMuted }} />
                    <input
                      type="text"
                      placeholder="e.g. Kabeer, Sarah..."
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      onFocus={() => setFocusedInput('join-name')}
                      onBlur={() => setFocusedInput(null)}
                      style={{
                        width: '100%', padding: '0.75rem 1rem 0.75rem 2.8rem',
                        background: colors.inputBg,
                        border: `1.5px solid ${focusedInput === 'join-name' ? '#6366f1' : colors.inputBorder}`,
                        borderRadius: '12px', color: colors.textPrimary,
                        fontSize: '0.95rem', outline: 'none',
                        transition: 'all 0.2s ease',
                        boxShadow: focusedInput === 'join-name' ? '0 0 0 4px rgba(99, 102, 241, 0.15)' : 'none',
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
                    Room Invitation ID
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <FileCode size={18} style={{ position: 'absolute', left: '1rem', color: focusedInput === 'room-id' ? '#6366f1' : colors.textMuted }} />
                    <input
                      type="text"
                      placeholder="Paste 7-character room code..."
                      value={roomId}
                      onChange={e => setRoomId(e.target.value)}
                      onFocus={() => setFocusedInput('room-id')}
                      onBlur={() => setFocusedInput(null)}
                      style={{
                        width: '100%', padding: '0.75rem 1rem 0.75rem 2.8rem',
                        background: colors.inputBg,
                        border: `1.5px solid ${focusedInput === 'room-id' ? '#6366f1' : colors.inputBorder}`,
                        borderRadius: '12px', color: colors.textPrimary,
                        fontFamily: '"Fira Code", monospace',
                        fontSize: '0.95rem', outline: 'none',
                        transition: 'all 0.2s ease',
                        boxShadow: focusedInput === 'room-id' ? '0 0 0 4px rgba(99, 102, 241, 0.15)' : 'none',
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%', padding: '0.85rem',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none', borderRadius: '12px',
                    color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                    boxShadow: '0 8px 25px rgba(16, 185, 129, 0.35)',
                    transition: 'all 0.2s ease',
                  }}
                  className="hover-lift-btn"
                >
                  <span>Join Collaboration Room</span>
                  <Send size={16} />
                </button>
              </form>
            )}

            {/* Quick action footer inside card */}
            <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: `1px dashed ${colors.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: colors.textMuted }}>
              <span>Want to test without typing?</span>
              <button
                type="button"
                onClick={handleQuickDemo}
                style={{
                  background: 'transparent', border: 'none',
                  color: '#38bdf8', fontWeight: 600, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                  textDecoration: 'underline'
                }}
              >
                <span>Try Demo Room</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: THE INTERACTIVE IDE MOCKUP ── */}
        <div className="hero-right" style={{ animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both' }}>
          
          <div style={{
            background: isDark ? '#0d1220' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: isDark ? '0 30px 80px rgba(0,0,0,0.6), 0 0 50px rgba(99, 102, 241, 0.1)' : '0 25px 70px rgba(0,0,0,0.1)',
            position: 'relative',
          }}>
            
            {/* ── WINDOW TITLE BAR ── */}
            <div style={{
              background: isDark ? '#111827' : '#f8fafc',
              borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'}`,
              padding: '0.75rem 1.25rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              {/* Traffic Lights */}
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56', boxShadow: '0 0 8px rgba(255, 95, 86, 0.4)' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e', boxShadow: '0 0 8px rgba(255, 189, 46, 0.4)' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f', boxShadow: '0 0 8px rgba(39, 201, 63, 0.4)' }} />
                <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', color: colors.textMuted, fontFamily: 'monospace' }}>devcollab.app/room/alpha</span>
              </div>

              {/* Active Collaborator Avatars */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {[
                    { name: 'Kabeer', bg: '#38bdf8', initials: 'K', role: 'Host' },
                    { name: 'Sarah', bg: '#f472b6', initials: 'S', role: 'Editor' },
                    { name: 'Alex', bg: '#fbbf24', initials: 'A', role: 'Voice' },
                  ].map((user, idx) => (
                    <div
                      key={user.name}
                      title={`${user.name} (${user.role})`}
                      style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: user.bg, color: '#000',
                        fontWeight: 800, fontSize: '0.72rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `2px solid ${isDark ? '#111827' : '#fff'}`,
                        marginLeft: idx > 0 ? '-8px' : 0,
                        cursor: 'pointer', position: 'relative'
                      }}
                    >
                      {user.initials}
                      {idx === 2 && <span style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', border: '1.5px solid #000' }} />}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.6rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '0.7rem', fontWeight: 700 }}>
                  <Radio size={12} className="animate-pulse" />
                  <span>3 ACTIVE</span>
                </div>
              </div>
            </div>

            {/* ── WORKSPACE TAB SWITCHER ── */}
            <div style={{
              background: isDark ? 'rgba(17, 24, 39, 0.6)' : '#f1f5f9',
              borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
              display: 'flex', padding: '0 0.75rem', gap: '0.2rem'
            }}>
              {[
                { id: 'code', label: 'app.jsx', icon: Code2, badge: 'Live CRDT' },
                { id: 'whiteboard', label: 'Architecture', icon: Palette, badge: 'Canvas' },
                { id: 'preview', label: 'Live Preview', icon: Play, badge: 'Hot Reload' },
                { id: 'logs', label: 'Console Output', icon: Terminal, badge: '0 errors' },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = mockupTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setMockupTab(tab.id);
                      if (tab.id === 'code') setVisibleCodeLines(1);
                    }}
                    style={{
                      padding: '0.7rem 1.1rem',
                      background: isActive ? (isDark ? '#0d1220' : '#fff') : 'transparent',
                      border: 'none',
                      borderBottom: isActive ? '2px solid #6366f1' : '2px solid transparent',
                      color: isActive ? (isDark ? '#fff' : '#0f172a') : colors.textMuted,
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '0.45rem',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Icon size={15} color={isActive ? '#6366f1' : colors.textMuted} />
                    <span>{tab.label}</span>
                    <span style={{ fontSize: '0.62rem', padding: '0.1rem 0.4rem', borderRadius: '10px', background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'rgba(128,128,128,0.1)', color: isActive ? '#818cf8' : colors.textMuted }}>
                      {tab.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ── WORKSPACE CONTENT AREA ── */}
            <div style={{ minHeight: '340px', position: 'relative', background: isDark ? '#070a12' : '#ffffff' }}>
              
              {/* 1. CODE EDITOR TAB */}
              {mockupTab === 'code' && (
                <div style={{ display: 'flex', minHeight: '340px', padding: '1rem 0' }}>
                  {/* Gutter / Line numbers */}
                  <div style={{ padding: '0 1rem', color: colors.textMuted, fontFamily: '"Fira Code", monospace', fontSize: '0.8rem', lineHeight: '1.8', textAlign: 'right', userSelect: 'none', borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}` }}>
                    {CODE_SNIPPETS.code.map((item, idx) => (
                      <div key={idx} style={{ opacity: idx < visibleCodeLines ? 1 : 0.2 }}>{item.num}</div>
                    ))}
                  </div>
                  {/* Animated Code lines */}
                  <div style={{ padding: '0 1.25rem', fontFamily: '"Fira Code", monospace', fontSize: '0.82rem', lineHeight: '1.8', flex: 1, position: 'relative' }}>
                    {CODE_SNIPPETS.code.slice(0, visibleCodeLines).map((line, i) => {
                      const isCurrentLine = i === visibleCodeLines - 1;
                      const displayText = isCurrentLine ? line.text.slice(0, charCount) : line.text;
                      return (
                        <div key={i} style={{ position: 'relative', minHeight: '1.8em' }}>
                          {/* Collaborator floating cursor */}
                          {line.cursor && !isCurrentLine && (
                            <div style={{ position: 'absolute', right: '10%', top: 0, display: 'inline-flex', alignItems: 'center', gap: '4px', background: `${line.cursor.color}22`, padding: '1px 6px', borderRadius: '4px', border: `1px solid ${line.cursor.color}` }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: line.cursor.color }} />
                              <span style={{ fontSize: '0.65rem', color: line.cursor.color, fontWeight: 700 }}>{line.cursor.user}</span>
                            </div>
                          )}
                          <span style={{ color: line.color || colors.textPrimary, fontStyle: line.italic ? 'italic' : 'normal' }}>
                            {displayText || '\u00A0'}
                          </span>
                          {isCurrentLine && (
                            <span style={{ display: 'inline-block', width: '2px', height: '15px', background: '#38bdf8', marginLeft: '2px', verticalAlign: 'middle', animation: 'blink 1s infinite' }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. WHITEBOARD TAB */}
              {mockupTab === 'whiteboard' && (
                <div style={{ padding: '2rem', height: '340px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: isDark ? 'radial-gradient(circle at center, rgba(139, 92, 246, 0.1) 0%, transparent 70%)' : '#fafafa', position: 'relative', overflow: 'hidden' }}>
                  {/* Canvas Grid Background */}
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(${colors.textMuted} 1px, transparent 1px)`, backgroundSize: '24px 24px', opacity: 0.2 }} />
                  
                  {/* Simulated Architecture Nodes */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', position: 'relative', zIndex: 5 }}>
                    <div className="wb-node" style={{ padding: '1rem 1.5rem', background: isDark ? '#1e293b' : '#fff', border: '2px solid #38bdf8', borderRadius: '12px', boxShadow: '0 10px 25px rgba(56, 189, 248, 0.2)', textAlign: 'center' }}>
                      <Globe size={24} color="#38bdf8" style={{ margin: '0 auto 0.5rem' }} />
                      <strong style={{ fontSize: '0.85rem', display: 'block' }}>React Next.js Client</strong>
                      <span style={{ fontSize: '0.7rem', color: colors.textMuted }}>CRDT Yjs Provider</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#818cf8', fontWeight: 700, fontSize: '0.75rem' }}>
                      <span>WebSocket (WSS)</span>
                      <div style={{ width: '60px', height: '2px', background: 'linear-gradient(to right, #38bdf8, #8b5cf6)', margin: '4px 0' }} />
                      <span>&lt; 15ms</span>
                    </div>

                    <div className="wb-node" style={{ padding: '1rem 1.5rem', background: isDark ? '#1e293b' : '#fff', border: '2px solid #8b5cf6', borderRadius: '12px', boxShadow: '0 10px 25px rgba(139, 92, 246, 0.2)', textAlign: 'center' }}>
                      <Cpu size={24} color="#8b5cf6" style={{ margin: '0 auto 0.5rem' }} />
                      <strong style={{ fontSize: '0.85rem', display: 'block' }}>Edge Sync Engine</strong>
                      <span style={{ fontSize: '0.7rem', color: colors.textMuted }}>Redis Pub/Sub Mesh</span>
                    </div>
                  </div>

                  {/* Floating Sticky Note */}
                  <div style={{ position: 'absolute', bottom: '1.5rem', right: '2rem', padding: '0.8rem 1rem', background: '#fef08a', color: '#854d0e', borderRadius: '8px', transform: 'rotate(-3deg)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontWeight: 600, fontSize: '0.78rem', maxWidth: '180px', zIndex: 10 }}>
                    📌 Sarah: Let&apos;s use Docker containers for the python compiler execution!
                  </div>
                </div>
              )}

              {/* 3. LIVE PREVIEW TAB */}
              {mockupTab === 'preview' && (
                <div style={{ padding: '1.5rem', height: '340px', background: isDark ? '#090d16' : '#f8fafc', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: isDark ? '#111827' : '#fff', borderRadius: '8px', border: `1px solid ${colors.cardBorder}`, fontSize: '0.75rem', color: colors.textMuted }}>
                    <Globe size={14} color="#10b981" />
                    <span style={{ flex: 1, fontFamily: 'monospace' }}>https://preview.devcollab.app/sandbox-alpha</span>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>● HOSTED ONLINE</span>
                  </div>
                  <div style={{ flex: 1, background: isDark ? '#131b2e' : '#fff', borderRadius: '12px', border: `1px solid ${colors.cardBorder}`, padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: '1rem', boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)' }}>
                      <Sparkles size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Hello, Collaborative World!</h3>
                    <p style={{ fontSize: '0.85rem', color: colors.textSecondary, maxWidth: '320px', marginBottom: '1.25rem' }}>
                      This live DOM preview updates in real time as your teammates edit HTML & CSS in the editor tab.
                    </p>
                    <button style={{ padding: '0.5rem 1.2rem', background: '#38bdf8', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                      Interactive Button
                    </button>
                  </div>
                </div>
              )}

              {/* 4. LOGS / CONSOLE TAB */}
              {mockupTab === 'logs' && (
                <div style={{ padding: '1rem 1.25rem', height: '340px', fontFamily: '"Fira Code", monospace', fontSize: '0.78rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ color: colors.textMuted, fontSize: '0.72rem', borderBottom: `1px dashed ${colors.cardBorder}`, paddingBottom: '0.4rem', marginBottom: '0.2rem' }}>
                    ⚡ devcollab-compiler-node-1 ready. Listening for websocket CRDT sync...
                  </div>
                  {CODE_SNIPPETS.logs.map((log, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.75rem', lineHeight: 1.5 }}>
                      <span style={{ color: colors.textMuted }}>[{log.time}]</span>
                      <span style={{ fontWeight: 700, color: log.type === 'SUCCESS' ? '#34d399' : (log.type === 'SYNC' ? '#fbbf24' : '#38bdf8'), minWidth: '65px' }}>{log.type}</span>
                      <span style={{ color: colors.textPrimary, flex: 1 }}>{log.msg}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', marginTop: '0.5rem' }}>
                    <span>&gt;</span>
                    <span className="animate-pulse">_</span>
                  </div>
                </div>
              )}

              {/* ── FLOATING LIVE OVERLAY WIDGETS ── */}
              {/* Audio Call Badge */}
              <div style={{
                position: 'absolute', bottom: '1.25rem', right: '1.25rem',
                background: isDark ? 'rgba(17, 24, 39, 0.85)' : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                borderRadius: '30px', padding: '0.45rem 0.9rem',
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                zIndex: 20
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '14px' }}>
                  <span className="wave-bar" style={{ width: '3px', background: '#10b981', borderRadius: '2px', animation: 'wave 0.8s infinite ease-in-out' }} />
                  <span className="wave-bar" style={{ width: '3px', background: '#10b981', borderRadius: '2px', animation: 'wave 0.8s infinite ease-in-out 0.2s' }} />
                  <span className="wave-bar" style={{ width: '3px', background: '#10b981', borderRadius: '2px', animation: 'wave 0.8s infinite ease-in-out 0.4s' }} />
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10b981' }}>Alex is speaking...</span>
                <Volume2 size={14} color="#10b981" />
              </div>
            </div>

            {/* ── STATUS FOOTER BAR ── */}
            <div style={{
              background: isDark ? '#090d16' : '#f1f5f9',
              borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
              padding: '0.5rem 1.25rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontSize: '0.72rem', color: colors.textMuted
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#10b981', fontWeight: 600 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                  CRDT WebSocket: Connected
                </span>
                <span>Branch: <strong>main*</strong></span>
                <span>Encoding: <strong>UTF-8</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span>Latency: <strong style={{ color: '#38bdf8' }}>11.4ms</strong></span>
                <span>Spaces: <strong>2</strong></span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ── FEATURE SHOWCASE & STATS SECTION ── */}
      <div style={{
        maxWidth: '1380px',
        margin: '0 auto',
        padding: '3rem 3rem 6rem',
        position: 'relative',
        zIndex: 10,
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.5rem' }}>
            Why Engineering Teams Choose DevCollab
          </span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: colors.textPrimary }}>
            Everything you need to engineer without friction.
          </h2>
        </div>

        {/* 4 Grid Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
          {FEATURES.map((feat, idx) => {
            const Icon = feat.icon;
            const isHover = hoveredFeature === idx;
            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredFeature(idx)}
                onMouseLeave={() => setHoveredFeature(null)}
                style={{
                  background: colors.cardBg,
                  border: `1px solid ${isHover ? feat.color : colors.cardBorder}`,
                  borderRadius: '18px',
                  padding: '2rem 1.75rem',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  transform: isHover ? 'translateY(-6px)' : 'none',
                  boxShadow: isHover ? `0 20px 40px rgba(0,0,0,0.3), 0 0 30px ${feat.color}22` : '0 10px 25px rgba(0,0,0,0.05)',
                  backdropFilter: 'blur(16px)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Accent top glow */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: feat.gradient, opacity: isHover ? 1 : 0.6, transition: 'opacity 0.3s' }} />

                <div style={{
                  width: '46px', height: '46px', borderRadius: '12px',
                  background: `${feat.color}18`,
                  border: `1px solid ${feat.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1.25rem', color: feat.color,
                  transition: 'transform 0.3s',
                  transform: isHover ? 'scale(1.1) rotate(5deg)' : 'none'
                }}>
                  <Icon size={22} />
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.75rem', color: colors.textPrimary }}>
                  {feat.title}
                </h3>

                <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: colors.textSecondary }}>
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── REALTIME STATS BANNER ── */}
        <div style={{
          background: isDark ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))' : 'linear-gradient(135deg, #ffffff, #f1f5f9)',
          border: `1px solid ${colors.cardBorder}`,
          borderRadius: '24px',
          padding: '2.5rem 3rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '2rem',
          boxShadow: isDark ? '0 20px 50px rgba(0,0,0,0.5)' : '0 15px 35px rgba(0,0,0,0.05)',
          backdropFilter: 'blur(20px)',
          textAlign: 'center'
        }}>
          {[
            { val: '<15ms', label: 'Global Sync Latency', icon: Activity, col: '#38bdf8' },
            { val: '15+', label: 'Supported Languages', icon: Code2, col: '#818cf8' },
            { val: '100%', label: 'Conflict-Free CRDTs', icon: Shield, col: '#34d399' },
            { val: '0s', label: 'Setup & Build Time', icon: Zap, col: '#fbbf24' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', borderRight: i < 3 ? `1px solid ${colors.cardBorder}` : 'none' }}>
                <Icon size={20} color={stat.col} style={{ marginBottom: '0.2rem' }} />
                <span style={{ fontSize: '2.2rem', fontWeight: 900, color: stat.col, letterSpacing: '-0.03em', lineHeight: 1 }}>{stat.val}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: colors.textSecondary }}>{stat.label}</span>
              </div>
            );
          })}
        </div>

      </div>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: `1px solid ${colors.cardBorder}`,
        padding: '2.5rem 3rem',
        background: isDark ? '#05070e' : '#f1f5f9',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '0.85rem', color: colors.textMuted
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: '24px', height: '24px', background: 'linear-gradient(135deg, #6366f1, #3b82f6)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Code2 size={14} />
          </div>
          <span style={{ fontWeight: 700, color: colors.textPrimary }}>DevCollab</span>
          <span>© {new Date().getFullYear()} Advanced Realtime IDE. All rights reserved.</span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', fontWeight: 500 }}>
          <Link href="/privacy" style={{ color: colors.textMuted, textDecoration: 'none', transition: 'color 0.2s' }}>Privacy</Link>
          <Link href="/terms" style={{ color: colors.textMuted, textDecoration: 'none', transition: 'color 0.2s' }}>Terms</Link>
          <Link href="/docs" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>Documentation →</Link>
        </div>
      </footer>

      {/* ── GLOBAL STYLE DEFINITIONS & ANIMATIONS ── */}
      <style jsx global>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes wave {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .text-gradient {
          background: linear-gradient(135deg, #6366f1 0%, #38bdf8 50%, #34d399 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
        }
        .ambient-background {
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          pointer-events: none;
          z-index: 1;
          overflow: hidden;
        }
        .plasma-beam {
          position: absolute;
          width: 200vw;
          height: 140px;
          filter: blur(60px);
          transform: rotate(-25deg);
          animation: pulseGlow 8s infinite alternate ease-in-out;
        }
        .beam-1 { top: 10%; left: -50%; background: linear-gradient(90deg, transparent, #00f0ff, #8a2be2, transparent); }
        .beam-2 { top: 50%; left: -30%; background: linear-gradient(90deg, transparent, #ff007f, #00f0ff, transparent); animation-delay: -3s; }
        .beam-3 { bottom: 10%; left: -40%; background: linear-gradient(90deg, transparent, #7b2cbf, #4361ee, transparent); animation-delay: -5s; }
        @keyframes pulseGlow {
          0% { transform: rotate(-25deg) translateY(-30px); opacity: 0.12; }
          100% { transform: rotate(-23deg) translateY(30px); opacity: 0.28; }
        }
        .glow-sphere {
          position: absolute;
          border-radius: 50%;
          filter: blur(130px);
          transition: all 1s ease;
        }
        .sphere-1 { top: -10%; left: 15%; width: 550px; height: 550px; background: #00f0ff; }
        .sphere-2 { top: 40%; right: -5%; width: 650px; height: 650px; background: #8a2be2; }
        .sphere-3 { bottom: -10%; left: 30%; width: 500px; height: 500px; background: #ff007f; }
        .cyber-grid {
          position: absolute;
          inset: 0;
          background-size: 36px 36px;
          mask-image: radial-gradient(ellipse at 50% 50%, black 25%, transparent 85%);
          -webkit-mask-image: radial-gradient(ellipse at 50% 50%, black 25%, transparent 85%);
          animation: gridMove 20s linear infinite;
        }
        @keyframes gridMove {
          0% { transform: translateY(0); }
          100% { transform: translateY(36px); }
        }
        .scanline {
          position: absolute;
          top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(to right, transparent, rgba(0, 240, 255, 0.6), transparent);
          animation: scan 5s linear infinite;
        }
        @keyframes scan {
          0% { top: -5%; }
          100% { top: 105%; }
        }
        .particles-container {
          position: absolute; inset: 0; overflow: hidden; pointer-events: none;
        }
        .cyber-particle {
          position: absolute;
          width: 3px; height: 3px;
          border-radius: 50%;
          animation: floatUp 12s linear infinite;
          opacity: 0;
        }
        @keyframes floatUp {
          0% { transform: translateY(0) scale(0.8); opacity: 0; }
          20% { opacity: 0.85; }
          80% { opacity: 0.85; }
          100% { transform: translateY(-105vh) scale(1.3); opacity: 0; }
        }
        .hover-scale:hover {
          transform: scale(1.08);
          border-color: #6366f1 !important;
        }
        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5) !important;
        }
        .hover-lift-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }
        .hover-border:hover {
          border-color: #6366f1 !important;
          transform: translateY(-2px);
        }
        .shimmer-effect {
          position: absolute;
          top: 0; left: -100%;
          width: 50%; height: 100%;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent);
          transform: skewX(-20deg);
          animation: shimmer 4s infinite;
        }
        @keyframes shimmer {
          0% { left: -100%; }
          20% { left: 200%; }
          100% { left: 200%; }
        }
        @media (max-width: 1024px) {
          div[style*="grid-template-columns: 1.05fr 1.35fr"] {
            grid-template-columns: 1fr !important;
            gap: 3.5rem !important;
          }
          div[style*="grid-template-columns: repeat(4, 1fr)"] {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 2rem !important;
          }
        }
        @media (max-width: 640px) {
          nav { padding: 1rem 1.5rem !important; }
          div[style*="padding: 5rem 3rem 4rem"] { padding: 3rem 1.5rem 2rem !important; }
          div[style*="padding: 3rem 3rem 6rem"] { padding: 2rem 1.5rem 4rem !important; }
          footer { padding: 2rem 1.5rem !important; flex-direction: column; gap: 1rem; text-align: center; }
          div[style*="grid-template-columns: repeat(2, 1fr)"] { grid-template-columns: 1fr !important; }
          .hero-left h1 { font-size: 2.2rem !important; }
        }
      `}</style>
    </div>
  );
}
