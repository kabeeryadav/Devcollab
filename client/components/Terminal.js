'use client';
import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export default function Terminal({ socket }) {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const term = new XTerm({
      cursorBlink: true,
      theme: {
        background: isDark ? '#141b2d' : '#ffffff',
        foreground: isDark ? '#f1f5f9' : '#1e293b',
        cursor: isDark ? '#6366f1' : '#3b82f6',
      },
      fontFamily: '"Fira Code", "Inter", monospace',
      fontSize: 13,
    });
    
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Connect to backend PTY via socket.io
    if (socket) {
      socket.emit('terminal-start');

      socket.on('terminal-data', (data) => {
        term.write(data);
      });

      term.onData((data) => {
        socket.emit('terminal-input', data);
      });

      const handleResize = () => {
        fitAddon.fit();
        socket.emit('terminal-resize', { cols: term.cols, rows: term.rows });
      };

      window.addEventListener('resize', handleResize);
      
      // Initial resize emit
      setTimeout(handleResize, 100);

      return () => {
        window.removeEventListener('resize', handleResize);
        socket.off('terminal-data');
      };
    }
  }, [socket]);

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme' && xtermRef.current) {
          const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
          xtermRef.current.options.theme = {
            background: isDark ? '#141b2d' : '#ffffff',
            foreground: isDark ? '#f1f5f9' : '#1e293b',
            cursor: isDark ? '#6366f1' : '#3b82f6',
          };
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--panel-bg)' }}>
      <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 500 }}>Terminal</h3>
      </div>
      <div style={{ flex: 1, padding: '0.5rem', overflow: 'hidden' }}>
        <div ref={terminalRef} style={{ height: '100%', width: '100%' }} />
      </div>
    </div>
  );
}
