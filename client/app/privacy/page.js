'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, AlertTriangle, ArrowLeft, Sparkles, Eye, Cpu, Copyright, Ban, CheckCircle2 } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const [isDark, setIsDark] = useState(true);
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
    warningBg: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
    warningBorder: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.25)',
    infoBg: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.08)',
    infoBorder: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.25)',
  };

  if (!mounted) {
    return <div style={{ minHeight: '100vh', background: '#080c14' }} />;
  }

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
        position: 'absolute', top: '-10%', left: '20%', width: '500px', height: '500px',
        background: isDark ? 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none', zIndex: 1
      }} />
      <div style={{
        position: 'absolute', top: '40%', right: '10%', width: '400px', height: '400px',
        background: isDark ? 'radial-gradient(circle, rgba(239, 68, 68, 0.1) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(239, 68, 68, 0.05) 0%, transparent 70%)',
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
            background: colors.warningBg, border: `1px solid ${colors.warningBorder}`,
            fontSize: '0.75rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.04em'
          }}>
            <Ban size={13} />
            <span>Strictly Proprietary & Private</span>
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
      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '3.5rem 2rem 5rem', position: 'relative', zIndex: 10 }}>
        
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.4rem 1rem', borderRadius: '30px',
            background: colors.infoBg, border: `1px solid ${colors.infoBorder}`,
            marginBottom: '1rem'
          }}>
            <ShieldCheck size={16} color="#818cf8" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Data Protection & IP Policy
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '0.8rem' }}>
            Privacy Policy & Commercial Notice
          </h1>
          <p style={{ fontSize: '1.05rem', color: colors.textSecondary, maxWidth: '640px', margin: '0 auto' }}>
            Official security practices, intellectual property notices, and data handling protocols for our real-time collaborative engineering platform.
          </p>
        </div>

        {/* 🚨 CRITICAL PROPRIETARY NOTICE (NOT OPEN SOURCE) */}
        <div style={{
          background: isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.06)',
          border: '2px solid #ef4444',
          borderRadius: '16px',
          padding: '1.8rem',
          marginBottom: '2.5rem',
          boxShadow: '0 10px 30px rgba(239, 68, 68, 0.12)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
            <div style={{ padding: '0.5rem', background: '#ef4444', borderRadius: '10px', color: '#fff', display: 'flex' }}>
              <AlertTriangle size={22} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: isDark ? '#f87171' : '#dc2626', margin: 0 }}>
              IMPORTANT: Strictly Private & Proprietary Software (Not Open Source)
            </h2>
          </div>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: colors.textPrimary, marginBottom: '1rem', fontWeight: 500 }}>
            This software project, currently operating under the temporary code-name <strong>&quot;Devcollab&quot;</strong> (or <strong>&quot;Temp Devcollab&quot;</strong>), is a <strong>strictly private, proprietary commercial software project</strong> and practical market innovation. <strong>THIS IS NOT AN OPEN-SOURCE PROJECT.</strong> It is not licensed under MIT, GNU GPL, Apache, BSD, or any other public open-source license.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.2rem' }}>
            <div style={{ padding: '0.8rem 1rem', background: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.7)', borderRadius: '10px', border: `1px solid ${colors.cardBorder}`, fontSize: '0.85rem' }}>
              <strong style={{ color: '#ef4444', display: 'block', marginBottom: '0.3rem' }}>❌ No Unauthorized Copying</strong>
              Cloning, copying, reproducing, or reverse engineering any part of this UI design, CRDT engine, or system architecture for commercial redistribution is illegal and strictly prohibited.
            </div>
            <div style={{ padding: '0.8rem 1rem', background: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.7)', borderRadius: '10px', border: `1px solid ${colors.cardBorder}`, fontSize: '0.85rem' }}>
              <strong style={{ color: '#6366f1', display: 'block', marginBottom: '0.3rem' }}>📌 Temporary Working Branding</strong>
              The name <em>&quot;Devcollab&quot;</em> is a temporary project code-name. The permanent commercial brand name and trademarks will be formally announced upon official market launch.
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Section 1 */}
          <section style={{
            background: colors.cardBg, border: `1px solid ${colors.cardBorder}`,
            borderRadius: '16px', padding: '2rem', backdropFilter: 'blur(20px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <Lock size={20} color={colors.accent} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>1. Information We Collect & Ephemeral Sessions</h3>
            </div>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: colors.textSecondary, marginBottom: '1rem' }}>
              Our platform is architected around <strong>ephemeral, high-speed real-time collaboration</strong>. To facilitate peer-to-peer code editing, system architecture whiteboards, and WebRTC voice channels, we collect and process only the minimal data required for synchronization:
            </p>
            <ul style={{ paddingLeft: '1.5rem', lineHeight: 1.8, color: colors.textSecondary, fontSize: '0.95rem', margin: 0 }}>
              <li><strong>Display Names:</strong> The temporary username or display tag you enter when creating or joining a collaboration workspace.</li>
              <li><strong>Room Identifiers:</strong> The unique 7-character session codes used to route cryptographic peer-to-peer signaling between participants.</li>
              <li><strong>Real-Time Signaling Metadata:</strong> Transient WebSocket routing packets and WebRTC SDP/ICE candidates required to establish direct low-latency connections between engineering teammates.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section style={{
            background: colors.cardBg, border: `1px solid ${colors.cardBorder}`,
            borderRadius: '16px', padding: '2rem', backdropFilter: 'blur(20px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <Cpu size={20} color="#10b981" />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>2. Zero Persistent Code Logging & CRDT Security</h3>
            </div>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: colors.textSecondary, marginBottom: '1rem' }}>
              We understand that software teams work on sensitive proprietary algorithms and confidential source code. Our synchronization infrastructure is built with security first:
            </p>
            <div style={{ background: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '12px', padding: '1.2rem', color: colors.textPrimary, fontSize: '0.9rem', lineHeight: 1.6 }}>
              <strong>⚡ Ephemeral In-Memory State:</strong> Collaboration state (code edits, cursor movements, and whiteboard vectors) is synchronized across active participants using Conflict-Free Replicated Data Types (CRDTs). Once all participants terminate or disconnect from a room session, the transient session memory is automatically purged from active signaling relay nodes.
            </div>
          </section>

          {/* Section 3 */}
          <section style={{
            background: colors.cardBg, border: `1px solid ${colors.cardBorder}`,
            borderRadius: '16px', padding: '2rem', backdropFilter: 'blur(20px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <Copyright size={20} color="#f59e0b" />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>3. Protection of Commercial Ideas & Market IP</h3>
            </div>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: colors.textSecondary, marginBottom: 0 }}>
              Because this platform represents a novel, practical commercial implementation of unified real-time engineering tools, all visual aesthetics, UI layout matrices, instant sandbox launch mechanics, and collaborative workflows are protected as proprietary trade secrets and copyrighted commercial works. Accessing this preview site does not grant any express or implied right to reproduce, copy, scrape, or imitate our product features for competitive development.
            </p>
          </section>

          {/* Section 4 */}
          <section style={{
            background: colors.cardBg, border: `1px solid ${colors.cardBorder}`,
            borderRadius: '16px', padding: '2rem', backdropFilter: 'blur(20px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <Eye size={20} color="#3b82f6" />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>4. Third-Party Services & WebRTC Transmission</h3>
            </div>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: colors.textSecondary, margin: 0 }}>
              When engaging in WebRTC voice channels or multi-user code compilation, peer-to-peer data streams are encrypted using standard Datagram Transport Layer Security (DTLS) and Secure Real-time Transport Protocol (SRTP). We do not record, transcribe, or store audio voice communications conducted within workspaces.
            </p>
          </section>

        </div>

        {/* Footer Note */}
        <div style={{ marginTop: '3rem', textAlign: 'center', padding: '2rem', borderTop: `1px solid ${colors.cardBorder}`, color: colors.textMuted, fontSize: '0.85rem' }}>
          <p style={{ margin: '0 0 0.5rem' }}>
            © {new Date().getFullYear()} <strong>Devcollab (Temporary Code-Name)</strong>. All rights reserved. Strictly Proprietary & Commercial Software.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.8rem' }}>
            <Link href="/terms" style={{ color: colors.accent, textDecoration: 'none', fontWeight: 600 }}>View Terms of Service →</Link>
            <Link href="/" style={{ color: colors.textSecondary, textDecoration: 'none' }}>Return to Launchpad</Link>
          </div>
        </div>

      </main>

      <style jsx global>{`
        .back-btn:hover {
          background: rgba(99, 102, 241, 0.15) !important;
          border-color: #6366f1 !important;
          transform: translateX(-3px);
        }
      `}</style>
    </div>
  );
}
