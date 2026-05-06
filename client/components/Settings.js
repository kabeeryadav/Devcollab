'use client';
import React, { useState } from 'react';
import { Settings as SettingsIcon, User, Keyboard, Volume2, Video, MousePointer, Bell, Shield, Info, Check } from 'lucide-react';

export default function Settings({ socket, username, setUsername }) {
  const [newUsername, setNewUsername] = useState(username);
  const [saved, setSaved] = useState(false);

  const handleUpdateUsername = () => {
    if (!newUsername.trim()) return;
    setUsername(newUsername);
    if (socket) {
      socket.emit('change-username', { newUsername });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const shortcuts = [
    { label: 'Run Code', key: 'Ctrl + Enter' },
    { label: 'Download Code', key: 'Ctrl + S' },
    { label: 'Toggle Sidebar', key: 'Ctrl + B' },
    { label: 'Toggle Terminal', key: 'Ctrl + `' },
    { label: 'Switch Tab (Editor)', key: 'Alt + 1' },
    { label: 'Switch Tab (Whiteboard)', key: 'Alt + 2' },
    { label: 'Copy Room Link', key: 'Alt + C' },
  ];

  return (
    <div style={{ padding: '2rem', height: '100%', overflowY: 'auto', background: 'var(--panel-bg)', color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 700 }}>
          <SettingsIcon size={28} className="text-primary" /> Workspace Settings
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Profile Section */}
          <section className="settings-section" style={{ background: 'var(--bg-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <User size={18} /> User Profile
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Display Name</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    value={newUsername} 
                    onChange={(e) => setNewUsername(e.target.value)}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', background: 'var(--panel-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />
                  <button onClick={handleUpdateUsername} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                    {saved ? <Check size={16} /> : 'Update'}
                  </button>
                </div>
                {saved && <p style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.4rem' }}>Username updated successfully!</p>}
              </div>
            </div>
          </section>

          {/* Media Section */}
          <section className="settings-section" style={{ background: 'var(--bg-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <Volume2 size={18} /> Media & Input
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem' }}>Microphone Permission</span>
                <span style={{ color: 'var(--success)', fontSize: '0.8rem' }}>Granted</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem' }}>Camera Permission</span>
                <span style={{ color: 'var(--success)', fontSize: '0.8rem' }}>Granted</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem' }}>Sound Effects</span>
                <input type="checkbox" defaultChecked />
              </div>
            </div>
          </section>

          {/* Shortcuts Section */}
          <section className="settings-section" style={{ gridColumn: 'span 2', background: 'var(--bg-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <Keyboard size={18} /> Keyboard Shortcuts
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {shortcuts.map((s, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
                  <kbd style={{ background: 'var(--panel-bg)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.75rem', fontWeight: 700 }}>{s.key}</kbd>
                </div>
              ))}
            </div>
          </section>
          
          {/* Features Section */}
          <section className="settings-section" style={{ gridColumn: 'span 2', background: 'var(--bg-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <Shield size={18} /> Session Features
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: 'var(--panel-bg)', borderRadius: '8px', textAlign: 'center' }}>
                <Bell size={20} style={{ marginBottom: '0.5rem', color: 'var(--accent-color)' }} />
                <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600 }}>Notifications</p>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>On Join Requests</p>
              </div>
              <div style={{ padding: '1rem', background: 'var(--panel-bg)', borderRadius: '8px', textAlign: 'center' }}>
                <MousePointer size={20} style={{ marginBottom: '0.5rem', color: 'var(--accent-color)' }} />
                <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600 }}>Sync Cursors</p>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Figma Style Active</p>
              </div>
              <div style={{ padding: '1rem', background: 'var(--panel-bg)', borderRadius: '8px', textAlign: 'center' }}>
                <Info size={20} style={{ marginBottom: '0.5rem', color: 'var(--accent-color)' }} />
                <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600 }}>System Status</p>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>All Systems Go</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
