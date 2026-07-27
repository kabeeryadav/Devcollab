'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, AlertTriangle, ArrowLeft, Sparkles, Scale, Cpu, Copyright, Ban, CheckCircle2, FileText } from 'lucide-react';

export default function TermsOfServicePage() {
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
        position: 'absolute', top: '-10%', right: '20%', width: '500px', height: '500px',
        background: isDark ? 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none', zIndex: 1
      }} />
      <div style={{
        position: 'absolute', top: '40%', left: '10%', width: '400px', height: '400px',
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
            <Scale size={16} color="#818cf8" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Legal Agreement & IP Rights
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '0.8rem' }}>
            Terms of Service & License Terms
          </h1>
          <p style={{ fontSize: '1.05rem', color: colors.textSecondary, maxWidth: '640px', margin: '0 auto' }}>
            Please read these terms carefully. This platform is a strictly private, proprietary commercial product and market concept.
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
              CRITICAL NOTICE: Proprietary Commercial Asset (Not Open Source)
            </h2>
          </div>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: colors.textPrimary, marginBottom: '1rem', fontWeight: 500 }}>
            By accessing or viewing this platform (currently operating under the temporary working code-name <strong>&quot;Devcollab&quot;</strong> or <strong>&quot;Temp Devcollab&quot;</strong>), you expressly acknowledge and agree that this software, its real-time CRDT code synchronization architecture, its interactive system whiteboard, and its unified workflow concepts are <strong>strictly proprietary commercial intellectual property</strong>. <strong>THIS IS NOT AN OPEN-SOURCE PROJECT.</strong>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.2rem' }}>
            <div style={{ padding: '0.8rem 1rem', background: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.7)', borderRadius: '10px', border: `1px solid ${colors.cardBorder}`, fontSize: '0.85rem' }}>
              <strong style={{ color: '#ef4444', display: 'block', marginBottom: '0.3rem' }}>🚫 Strictly No Cloning or Copying</strong>
              You are expressly prohibited from copying, cloning, reverse engineering, republishing, or creating derivative commercial works based on this platform or its UI/UX concepts.
            </div>
            <div style={{ padding: '0.8rem 1rem', background: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.7)', borderRadius: '10px', border: `1px solid ${colors.cardBorder}`, fontSize: '0.85rem' }}>
              <strong style={{ color: '#6366f1', display: 'block', marginBottom: '0.3rem' }}>🏷️ Working Brand Name Notice</strong>
              The name <em>&quot;Devcollab&quot;</em> is a temporary project code-name. All terms herein apply equally to the upcoming official commercial brand release.
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
              <FileText size={20} color={colors.accent} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>1. Proprietary Rights & Limited Access License</h3>
            </div>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: colors.textSecondary, marginBottom: '1rem' }}>
              All source code, visual designs, interactive components, CRDT synchronization algorithms, and cloud compilation interfaces are the exclusive property of the project creators. We grant you a limited, revocable, non-transferable, non-exclusive license solely to evaluate and test the platform in a non-commercial preview capacity.
            </p>
            <div style={{ background: isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '12px', padding: '1.2rem', color: colors.textPrimary, fontSize: '0.9rem', lineHeight: 1.6 }}>
              <strong>⚠️ Zero Transfer of Ownership:</strong> Nothing in these terms or within the interface shall be construed as conferring any license under open-source software terms (such as MIT, Apache, or GPL). You may not extract, modify, adapt, or distribute any part of the software.
            </div>
          </section>

          {/* Section 2 */}
          <section style={{
            background: colors.cardBg, border: `1px solid ${colors.cardBorder}`,
            borderRadius: '16px', padding: '2rem', backdropFilter: 'blur(20px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <Ban size={20} color="#ef4444" />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>2. Strict Prohibition on Market Copying & Cloning</h3>
            </div>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: colors.textSecondary, marginBottom: '1rem' }}>
              This platform embodies practical, high-value commercial engineering innovations in real-time software development. You expressly agree NOT to:
            </p>
            <ul style={{ paddingLeft: '1.5rem', lineHeight: 1.8, color: colors.textSecondary, fontSize: '0.95rem', margin: 0 }}>
              <li>Copy, imitate, or clone our distinctive UI layouts, instant workspace launchpads, or real-time feature combinations for competing commercial products.</li>
              <li>Use automated scrapers, spiders, or extraction tools to harvest design tokens, component hierarchies, or signaling architectures.</li>
              <li>Decompile, disassemble, or reverse engineer our proprietary client-side CRDT state management or WebRTC relay protocols.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section style={{
            background: colors.cardBg, border: `1px solid ${colors.cardBorder}`,
            borderRadius: '16px', padding: '2rem', backdropFilter: 'blur(20px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <Sparkles size={20} color="#10b981" />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>3. Temporary Branding & Preview Status</h3>
            </div>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: colors.textSecondary, marginBottom: 0 }}>
              The project is currently operating under the temporary internal code-name <strong>&quot;Devcollab&quot;</strong> (or <strong>&quot;Temp Devcollab&quot;</strong>). This name is a placeholder used during beta preview development. All intellectual property protection, terms of service, and anti-copying restrictions apply fully to this working title and will automatically transition to the official commercial product name upon public market launch.
            </p>
          </section>

          {/* Section 4 */}
          <section style={{
            background: colors.cardBg, border: `1px solid ${colors.cardBorder}`,
            borderRadius: '16px', padding: '2rem', backdropFilter: 'blur(20px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <ShieldCheck size={20} color="#3b82f6" />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>4. Acceptable Use & Collaboration Conduct</h3>
            </div>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: colors.textSecondary, margin: 0 }}>
              Users utilizing our shared workspaces, audio channels, and code editors agree to conduct themselves professionally. Abusive behavior, transmission of malicious code, unauthorized security stress-testing, or attempting to degrade signaling server performance will result in immediate termination of session access and potential legal action.
            </p>
          </section>

          {/* Section 5 */}
          <section style={{
            background: colors.cardBg, border: `1px solid ${colors.cardBorder}`,
            borderRadius: '16px', padding: '2rem', backdropFilter: 'blur(20px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <AlertTriangle size={20} color="#f59e0b" />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>5. Disclaimer of Warranty & Limitation of Liability</h3>
            </div>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: colors.textSecondary, margin: 0 }}>
              The platform is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis for preview evaluation. We make no warranties regarding uninterrupted service or permanent retention of transient workspace data. In no event shall the project creators or intellectual property owners be liable for any indirect, incidental, or consequential damages arising from your use of the preview platform.
            </p>
          </section>

        </div>

        {/* Footer Note */}
        <div style={{ marginTop: '3rem', textAlign: 'center', padding: '2rem', borderTop: `1px solid ${colors.cardBorder}`, color: colors.textMuted, fontSize: '0.85rem' }}>
          <p style={{ margin: '0 0 0.5rem' }}>
            © {new Date().getFullYear()} <strong>Devcollab (Temporary Code-Name)</strong>. All rights reserved. Strictly Proprietary & Commercial Software.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.8rem' }}>
            <Link href="/privacy" style={{ color: colors.accent, textDecoration: 'none', fontWeight: 600 }}>View Privacy Policy →</Link>
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
