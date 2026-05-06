'use client';
import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, X, File as FileIcon } from 'lucide-react';

export default function Chat({ socket, roomId, username, users }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('chat-message', handleMessage);

    return () => {
      socket.off('chat-message', handleMessage);
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File size must be under 2MB.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedFile({
        name: file.name,
        type: file.type,
        data: event.target.result
      });
    };
    reader.readAsDataURL(file);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() && !selectedFile) return;
    if (!socket) return;
    
    socket.emit('chat-message', { roomId, message: input, file: selectedFile });
    setInput('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileOpen = (file) => {
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      const win = window.open();
      if (win) {
        win.document.write(`
          <html>
            <head><title>${file.name}</title></head>
            <body style="margin:0; height: 100vh; display: flex; justify-content: center; align-items: center; background: #0f172a;">
              ${file.type.startsWith('image/') 
                ? `<img src="${file.data}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />`
                : `<iframe src="${file.data}" style="width: 100%; height: 100%; border: none;"></iframe>`
              }
            </body>
          </html>
        `);
        win.document.close();
      }
    } else {
      const a = document.createElement('a');
      a.href = file.data;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--panel-bg)' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Team Chat</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
          {users.map((u) => (
            <span key={u.id} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              {u.username} {u.isHost ? '(Host)' : (u.id === socket?.id ? '(You)' : '')}
            </span>
          ))}
        </div>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {messages.map((msg) => {
          const isMe = msg.userId === socket?.id;
          return (
            <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.2rem', textAlign: isMe ? 'right' : 'left' }}>
                {msg.username} • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
              <div style={{ 
                background: isMe ? 'var(--accent-color)' : 'var(--glass-bg)', 
                color: isMe ? '#fff' : 'var(--text-primary)',
                padding: '0.5rem 0.75rem', 
                borderRadius: '8px',
                border: isMe ? 'none' : '1px solid var(--border-color)',
                wordBreak: 'break-word'
              }}>
                {!msg.file && !msg.text ? (
                  <div style={{ fontStyle: 'italic', opacity: 0.8, fontSize: '0.8rem' }}>
                    [File dropped. Please restart backend server on port 3001]
                  </div>
                ) : (
                  <>
                    {msg.file && (
                      <div style={{ marginBottom: msg.text ? '0.5rem' : '0' }}>
                        {msg.file.type && msg.file.type.startsWith('image/') ? (
                          <img 
                            src={msg.file.data} 
                            alt={msg.file.name} 
                            onClick={() => handleFileOpen(msg.file)}
                            title="Click to open full size"
                            style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px', display: 'block', cursor: 'pointer' }} 
                          />
                        ) : (
                          <div 
                            onClick={() => handleFileOpen(msg.file)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.8rem' }}
                            title="Click to open or download"
                          >
                            <FileIcon size={16} /> {msg.file.name}
                          </div>
                        )}
                      </div>
                    )}
                    {msg.text && <div>{msg.text}</div>}
                  </>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {selectedFile && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--hover-bg)', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              <FileIcon size={14} /> {selectedFile.name}
            </span>
            <button type="button" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="btn-icon" style={{ padding: '0.2rem' }}>
              <X size={14} />
            </button>
          </div>
        )}
        <form onSubmit={sendMessage} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            type="button" 
            className="btn-icon" 
            onClick={() => fileInputRef.current?.click()}
            style={{ padding: '0.5rem' }}
            title="Attach file (Max 2MB)"
          >
            <Paperclip size={18} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleFileSelect} 
          />
          <input
            type="text"
            className="input"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem' }}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
