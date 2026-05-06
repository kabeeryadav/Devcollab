/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const CodeEditor = dynamic(() => import('@/components/CodeEditor'), { ssr: false });
const TaskBoard = dynamic(() => import('@/components/TaskBoard'), { ssr: false });
const Chat = dynamic(() => import('@/components/Chat'), { ssr: false });
const Whiteboard = dynamic(() => import('@/components/Whiteboard'), { ssr: false });
const VideoCall = dynamic(() => import('@/components/VideoCall'), { ssr: false });
import { Code, LayoutDashboard, CheckSquare, Monitor, LogOut, Copy, Check, Sun, Moon, PanelLeftClose, PanelLeftOpen, Crown, X, UserMinus, ShieldCheck } from 'lucide-react';

export default function WorkspacePage({ params }) {
  const roomId = params.id;
  const searchParams = useSearchParams();
  const username = searchParams.get('username') || 'Anonymous';
  const router = useRouter();

  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('editor');
  const [copied, setCopied] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [joinStatus, setJoinStatus] = useState('waiting'); // starts as waiting, server sends 'join-approved' or 'join-pending'→'waiting'→'declined'
  const [joinRequests, setJoinRequests] = useState([]);
  const [shareToasts, setShareToasts] = useState([]); // [{id, sharer, type:'share'|'join'}]
  const [recentlyJoined, setRecentlyJoined] = useState(new Set()); // socket IDs that just joined
  const [remoteCursors, setRemoteCursors] = useState({}); // { socketId: { x, y, username, color } }
  const mySocketId = useRef(null);
  const myColor = useRef('#' + Math.floor(Math.random()*16777215).toString(16));
  
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    // Notify host that this member is sharing the link
    if (socket) {
      socket.emit('share-link', { roomId, username });
    }
  };

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    const newSocket = io(socketUrl);
    setSocket(newSocket);
    mySocketId.current = newSocket.id;

    newSocket.on('connect', () => {
      mySocketId.current = newSocket.id;
      newSocket.emit('join-room', { roomId, username });
    });

    // Host joins immediately — no waiting
    newSocket.on('join-approved', () => setJoinStatus('approved'));

    // Non-host: show waiting screen
    newSocket.on('join-pending', () => setJoinStatus('waiting'));

    // Host declined the join
    newSocket.on('join-declined', () => setJoinStatus('declined'));

    // Host receives join requests from others
    newSocket.on('join-request', ({ requesterId, username: requesterName }) => {
      setJoinRequests(prev => [...prev, { requesterId, username: requesterName }]);
    });

    // Host receives notification that a member copied the link
    newSocket.on('link-shared', ({ sharer }) => {
      const toastId = Date.now() + Math.random();
      setShareToasts(prev => [...prev, { id: toastId, sharer }]);
      setTimeout(() => setShareToasts(prev => prev.filter(t => t.id !== toastId)), 8000);
    });

    newSocket.on('room-users', (updatedUsers) => {
      const userIds = new Set(updatedUsers.map(u => u.id));
      setRemoteCursors(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          if (!userIds.has(id)) delete next[id];
        });
        return next;
      });

      setUsers(prev => {
        const prevIds = new Set(prev.map(u => u.id));
        updatedUsers.forEach(u => {
          if (!prevIds.has(u.id) && u.id !== newSocket.id) {
            setRecentlyJoined(rj => {
              const next = new Set(rj);
              next.add(u.id);
              setTimeout(() => setRecentlyJoined(r2 => { const s = new Set(r2); s.delete(u.id); return s; }), 10000);
              return next;
            });
          }
        });
        return updatedUsers;
      });
      const me = updatedUsers.find(u => u.id === newSocket.id);
      if (me) {
        setIsHost(me.isHost);
        // Fallback: appearing in room-users = approved (handles old server code & race conditions)
        setJoinStatus('approved');
      }
    });

    newSocket.on('you-are-host', () => setIsHost(true));

    newSocket.on('kicked', () => {
      alert('You have been removed from this room by the host.');
      router.push('/');
    });

    newSocket.on('cursor-move', (data) => {
      setRemoteCursors(prev => ({
        ...prev,
        [data.userId]: { x: data.x, y: data.y, username: data.username, color: data.color }
      }));
    });

    const handleMouseMove = (e) => {
      if (newSocket && newSocket.connected) {
        newSocket.emit('cursor-move', {
          roomId,
          username,
          x: e.clientX / window.innerWidth,
          y: e.clientY / window.innerHeight,
          color: myColor.current
        });
      }
    };

    // Throttle cursor movement
    let lastMove = 0;
    const throttledMouseMove = (e) => {
      const now = Date.now();
      if (now - lastMove > 40) { // ~25fps for cursors
        handleMouseMove(e);
        lastMove = now;
      }
    };

    window.addEventListener('mousemove', throttledMouseMove);

    return () => {
      newSocket.disconnect();
      window.removeEventListener('mousemove', throttledMouseMove);
    };
  }, [roomId, username]);

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
  }, []);

  const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    setIsDark(next === 'dark');
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingSidebar) return;
      let newWidth = e.clientX;
      if (newWidth < 200) newWidth = 200;
      if (newWidth > 600) newWidth = 600;
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isDraggingSidebar) {
        setIsDraggingSidebar(false);
        document.body.classList.remove('dragging');
      }
    };

    if (isDraggingSidebar) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.classList.add('dragging');
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('dragging');
    };
  }, [isDraggingSidebar]);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (mobile) setIsSidebarCollapsed(true);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const startSidebarDrag = (e) => {
    e.preventDefault();
    setIsDraggingSidebar(true);
  };

  // Waiting for host approval
  if (joinStatus === 'waiting') {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', color: 'var(--text-primary)', gap: '1.5rem' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', border: '4px solid var(--accent-color)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Waiting for Host Approval</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>The host has been notified. Please wait...</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>Room: <strong style={{ color: 'var(--accent-color)' }}>{roomId}</strong></p>
        </div>
        <button onClick={() => router.push('/')} style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}>
          Cancel &amp; Go Back
        </button>
      </div>
    );
  }

  // Host declined
  if (joinStatus === 'declined') {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', color: 'var(--text-primary)', gap: '1.5rem' }}>
        <div style={{ fontSize: '3rem' }}>🚫</div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--danger)' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>The host has declined your request to join this room.</p>
        </div>
        <button onClick={() => router.push('/')} style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', background: 'var(--accent-color)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
          Go Back Home
        </button>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Host notifications stack */}
      {(shareToasts.length > 0 || joinRequests.length > 0) && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Share toasts — informational only */}
          {shareToasts.map(t => (
            <div key={t.id} style={{ background: 'var(--panel-bg)', border: '1px solid var(--accent-color)', borderRadius: '12px', padding: '0.75rem 1.25rem', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', minWidth: '260px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🔗</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: '0.85rem', margin: 0 }}>{t.sharer}</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: 0 }}>copied & shared the room link</p>
              </div>
              <button onClick={() => setShareToasts(prev => prev.filter(x => x.id !== t.id))} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '1rem', padding: '0 4px' }}>✕</button>
            </div>
          ))}

          {/* Join-request approval cards */}
          {joinRequests.map(req => (
            <div key={req.requesterId} style={{ background: 'var(--panel-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem 1.25rem', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', color: '#fff', flexShrink: 0 }}>
                  {req.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>{req.username}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: 0 }}>wants to join the room</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => {
                    socket.emit('accept-join', { requesterId: req.requesterId });
                    setJoinRequests(prev => prev.filter(r => r.requesterId !== req.requesterId));
                  }}
                  style={{ flex: 1, padding: '0.4rem', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                >
                  ✓ Accept
                </button>
                <button
                  onClick={() => {
                    socket.emit('decline-join', { requesterId: req.requesterId });
                    setJoinRequests(prev => prev.filter(r => r.requesterId !== req.requesterId));
                  }}
                  style={{ flex: 1, padding: '0.4rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                >
                  ✕ Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {!isSidebarCollapsed && isMobile && (
        <div 
          onClick={() => setIsSidebarCollapsed(true)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, backdropFilter: 'blur(4px)' }}
        />
      )}

      {/* Sidebar - Chat & Users */}
      <div 
        className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`} 
        style={{ 
          width: isSidebarCollapsed ? (isMobile ? '320px' : '0px') : `${sidebarWidth}px`, 
          display: 'flex', 
          flexDirection: 'column', 
          flexShrink: 0 
        }}
      >
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 
            onClick={() => setIsSidebarCollapsed(true)}
            style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            title="Close Sidebar"
          >
            <Monitor size={18} /> Dev Collab
          </h2>
          <button onClick={() => { if(confirm('Leave this session?')) router.push('/'); }} className="btn-icon" title="Leave Session" style={{ color: 'var(--danger)' }}>
            <LogOut size={16} />
          </button>
        </div>

        {/* Online Members Panel */}
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Members ({users.length})</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
            {users.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.5rem', borderRadius: '6px', background: u.id === (socket && socket.id) ? 'var(--glass-bg)' : 'transparent', border: u.id === (socket && socket.id) ? '1px solid var(--border-color)' : '1px solid transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                  {/* Online dot */}
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', flexShrink: 0, boxShadow: '0 0 4px #22c55e' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.username} {u.id === (socket && socket.id) ? '(you)' : ''}
                  </span>
                  {u.isHost && (
                    <span style={{ fontSize: '0.65rem', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', borderRadius: '6px', padding: '1px 6px', fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.25rem', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                      <ShieldCheck size={10} /> HOST
                    </span>
                  )}
                </div>
                {/* Host controls — only shown to host, for non-host, non-recently-joined members */}
                {isHost && u.id !== (socket && socket.id) && !recentlyJoined.has(u.id) && (
                  <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                    <button
                      title="Make Host"
                      className="btn-icon"
                      onClick={() => socket.emit('promote-host', { roomId, targetId: u.id })}
                      style={{ padding: '4px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '6px' }}
                    >
                      <Crown size={14} />
                    </button>
                    <button
                      title="Kick"
                      className="btn-icon"
                      onClick={() => { if(confirm(`Kick ${u.username}?`)) socket.emit('kick-user', { roomId, targetId: u.id }); }}
                      style={{ padding: '4px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px' }}
                    >
                      <UserMinus size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Chat socket={socket} roomId={roomId} username={username} users={users} />
        </div>
      </div>

      {!isSidebarCollapsed && (
        <div 
          className={`resizer-vertical ${isDraggingSidebar ? 'active' : ''}`}
          onMouseDown={startSidebarDrag}
        />
      )}

      {/* Main Content Area */}
      <div className="main-content">
        {/* Header Tabs */}
        <div className="workspace-header" style={{ display: 'flex', flexWrap: 'wrap', background: 'var(--panel-bg)', borderBottom: '1px solid var(--border-color)', padding: '0.4rem 1rem', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="btn-icon" 
              style={{ marginRight: '0.25rem' }}
              title={isSidebarCollapsed ? "Open Sidebar" : "Close Sidebar"}
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
            <button 
              className={`btn ${activeTab === 'editor' ? 'btn-primary' : ''}`} 
              style={{ padding: '0.35rem 0.6rem', borderRadius: '8px', background: activeTab === 'editor' ? '' : 'transparent', color: activeTab === 'editor' ? '' : 'var(--text-secondary)', border: activeTab === 'editor' ? 'none' : '1px solid transparent', boxShadow: 'none', fontSize: '0.8rem' }}
              onClick={() => setActiveTab('editor')}
            >
              <Code size={16} /> Code Editor
            </button>
            <button 
              className={`btn ${activeTab === 'whiteboard' ? 'btn-primary' : ''}`} 
              style={{ padding: '0.35rem 0.6rem', borderRadius: '8px', background: activeTab === 'whiteboard' ? '' : 'transparent', color: activeTab === 'whiteboard' ? '' : 'var(--text-secondary)', border: activeTab === 'whiteboard' ? 'none' : '1px solid transparent', boxShadow: 'none', fontSize: '0.8rem' }}
              onClick={() => setActiveTab('whiteboard')}
            >
              <LayoutDashboard size={16} /> Whiteboard
            </button>
            <button 
              className={`btn ${activeTab === 'taskboard' ? 'btn-primary' : ''}`} 
              style={{ padding: '0.35rem 0.6rem', borderRadius: '8px', background: activeTab === 'taskboard' ? '' : 'transparent', color: activeTab === 'taskboard' ? '' : 'var(--text-secondary)', border: activeTab === 'taskboard' ? 'none' : '1px solid transparent', boxShadow: 'none', fontSize: '0.8rem' }}
              onClick={() => setActiveTab('taskboard')}
            >
              <CheckSquare size={16} /> Task Board
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <VideoCall socket={socket} roomId={roomId} username={username} users={users} />
            <button 
              onClick={copyRoomId}
              style={{ background: 'transparent', border: '1px dashed var(--border-color)', borderRadius: '4px', padding: '4px 8px', fontSize: '0.825rem', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s' }}
              title="Copy Room ID"
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-color)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              Room: {roomId} {copied ? <Check size={14} color="var(--accent-color)" /> : <Copy size={14} />}
            </button>
            <label className="switch">
              <input type="checkbox" onChange={toggleTheme} checked={isDark} />
              <span className="slider"></span>
              <span className="sun"><Sun /></span>
              <span className="moon"><Moon /></span>
            </label>
          </div>
        </div>

        {/* Dynamic Content */}
        <div style={{ flex: 1, position: 'relative', background: 'var(--bg-color)', overflow: 'hidden' }}>
          <div style={{ display: activeTab === 'editor' ? 'block' : 'none', height: '100%' }}>
            <CodeEditor roomId={roomId} username={username} />
          </div>
          <div style={{ display: activeTab === 'whiteboard' ? 'block' : 'none', height: '100%' }}>
            <Whiteboard roomId={roomId} />
          </div>
          <div style={{ display: activeTab === 'taskboard' ? 'block' : 'none', height: '100%' }}>
            <TaskBoard roomId={roomId} />
          </div>
        </div>
      </div>

      {/* Figma-style Cursors */}
      {Object.entries(remoteCursors).map(([id, cursor]) => (
        <div 
          key={id} 
          className="cursor-remote"
          style={{ 
            left: `${cursor.x * 100}%`,
            top: `${cursor.y * 100}%`,
            display: recentlyJoined.has(id) ? 'none' : 'block' // hide for a moment if they just joined (optional)
          }}
        >
          <svg viewBox="0 0 24 24" fill={cursor.color}>
            <path d="M5.653 3.123l12.87 12.87a1 1 0 01-.223 1.636l-4.52 2.215a1 1 0 01-1.127-.118l-1.92-1.74a1 1 0 00-.667-.257h-4.32a1 1 0 01-1-1V4.123a1 1 0 011.887-.453l.99 1.94z" />
          </svg>
          <div className="cursor-label" style={{ backgroundColor: cursor.color }}>
            {cursor.username}
          </div>
        </div>
      ))}
    </div>
  );
}
