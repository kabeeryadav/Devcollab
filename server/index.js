const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const os = require('os');
const pty = require('node-pty');
const WebSocket = require('ws');
const { setupWSConnection } = require('y-websocket/bin/utils');
// Code execution now uses Piston API (free, no API key needed)
// https://github.com/engineer-man/piston
const PISTON_URL = 'https://emkc.org/api/v2/piston/execute';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Setup Socket.IO for chat, presence, signaling, and terminal
const io = new Server(server, {
  maxHttpBufferSize: 1e7, // 10 MB limit for file uploads
  cors: {
    origin: "*", // allow all for dev
    methods: ["GET", "POST"]
  }
});

// Setup y-websocket server on the same HTTP server
const wss = new WebSocket.Server({ noServer: true });

// wss.on('connection', setupWSConnection); // Handled manually in upgrade below

server.on('upgrade', (request, socket, head) => {
  const { pathname } = new URL(request.url, `http://${request.headers.host}`);
  console.log(`Upgrade request for: ${pathname}`);

  if (pathname.startsWith('/yjs')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      // Strip the /yjs prefix so that setupWSConnection sees a clean room name
      request.url = decodeURIComponent(request.url.replace(/^\/yjs/, '') || '/');
      console.log(`Yjs connection established for room: ${request.url}`);
      setupWSConnection(ws, request);
    });
  } else {
    // Socket.io handles its own upgrades if the path is /socket.io/
    // We don't need to do anything here for Socket.io
  }
});

const activeUsers = new Map();
const pendingRequests = new Map(); // socketId -> { username, roomId }
const recentUsers = new Map(); // roomId-username -> timestamp

const getUserList = (rId) => Array.from(activeUsers.entries())
  .filter(([id, user]) => user.roomId === rId)
  .map(([id, user]) => ({ id, ...user }));

const getHostId = (rId) => {
  const host = Array.from(activeUsers.entries()).find(([id, u]) => u.roomId === rId && u.isHost);
  return host ? host[0] : null;
};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Presence
  socket.on('join-room', ({ roomId, username }) => {
    // Check if room is empty to assign host
    const isFirst = Array.from(activeUsers.values()).filter(u => u.roomId === roomId).length === 0;
    const userKey = `${roomId}-${username}`;
    const wasRecent = recentUsers.has(userKey) && (Date.now() - recentUsers.get(userKey) < 60000); // 60 seconds grace

    if (isFirst || wasRecent) {
      // Creator or rejoining user joins immediately
      socket.join(roomId);
      activeUsers.set(socket.id, { username, roomId, isHost: isFirst && !wasRecent ? true : (wasRecent ? recentUsers.get(userKey + '-isHost') : false) });
      recentUsers.delete(userKey);
      recentUsers.delete(userKey + '-isHost');
      io.to(roomId).emit('room-users', getUserList(roomId));
      socket.emit('join-approved');
    } else {
      // New member: put in pending, ask host for approval
      pendingRequests.set(socket.id, { username, roomId });
      socket.emit('join-pending'); // tell the user to wait
      
      const hostId = getHostId(roomId);
      if (hostId) {
        io.to(hostId).emit('join-request', { requesterId: socket.id, username });
      } else {
        // No host found, auto-approve
        socket.join(roomId);
        pendingRequests.delete(socket.id);
        activeUsers.set(socket.id, { username, roomId, isHost: false });
        io.to(roomId).emit('room-users', getUserList(roomId));
        socket.emit('join-approved');
      }
    }
  });

  // Host: approve join request
  socket.on('accept-join', ({ requesterId }) => {
    const requester = activeUsers.get(socket.id);
    if (!requester || !requester.isHost) return;
    
    const pending = pendingRequests.get(requesterId);
    if (!pending) return;
    
    pendingRequests.delete(requesterId);
    const { username, roomId } = pending;
    
    const requesterSocket = io.sockets.sockets.get(requesterId);
    if (requesterSocket) {
      requesterSocket.join(roomId);
      activeUsers.set(requesterId, { username, roomId, isHost: false });
      requesterSocket.emit('join-approved');
      io.to(roomId).emit('room-users', getUserList(roomId));
    }
  });

  // Host: decline join request
  socket.on('decline-join', ({ requesterId }) => {
    const requester = activeUsers.get(socket.id);
    if (!requester || !requester.isHost) return;
    
    const pending = pendingRequests.get(requesterId);
    if (!pending) return;
    
    pendingRequests.delete(requesterId);
    io.to(requesterId).emit('join-declined');
  });

  // Member: notify host that they copied/shared the room link
  socket.on('share-link', ({ roomId, username }) => {
    const hostId = getHostId(roomId);
    if (hostId && hostId !== socket.id) {
      io.to(hostId).emit('link-shared', { sharer: username });
    }
  });

  // Host: promote another user to host
  socket.on('promote-host', ({ roomId, targetId }) => {
    const requester = activeUsers.get(socket.id);
    if (!requester || !requester.isHost) return;
    
    // Demote current host
    requester.isHost = false;
    activeUsers.set(socket.id, requester);
    
    // Promote target
    const target = activeUsers.get(targetId);
    if (target) {
      target.isHost = true;
      activeUsers.set(targetId, target);
    }
    
    const getUserList_local = getUserList;
    io.to(roomId).emit('room-users', getUserList_local(roomId));
    io.to(targetId).emit('you-are-host');
  });

  // Host: kick user
  socket.on('kick-user', ({ roomId, targetId }) => {
    const requester = activeUsers.get(socket.id);
    if (!requester || !requester.isHost) return;
    
    io.to(targetId).emit('kicked');
    activeUsers.delete(targetId);
    
    io.to(roomId).emit('room-users', getUserList(roomId));
  });

  // Cursor Tracking
  socket.on('cursor-move', (data) => {
    socket.to(data.roomId).emit('cursor-move', {
      userId: socket.id,
      username: data.username,
      x: data.x,
      y: data.y,
      color: data.color
    });
  });

  // Chat
  socket.on('chat-message', ({ roomId, message, file }) => {
    const user = activeUsers.get(socket.id);
    if (user) {
      io.to(roomId).emit('chat-message', {
        id: Date.now(),
        userId: socket.id,
        username: user.username,
        text: message,
        file: file,
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on('change-username', ({ newUsername }) => {
    const user = activeUsers.get(socket.id);
    if (user) {
      console.log(`User ${user.username} changed name to ${newUsername}`);
      user.username = newUsername;
      io.to(user.roomId).emit('room-users', getUserList(user.roomId));
    }
  });

  // WebRTC Signaling (Voice Call)
  socket.on('join-voice', (roomId) => {
    socket.join(`voice-${roomId}`);
    // Notify others that I joined
    socket.to(roomId).emit('user-joined-voice', socket.id);
    // Send me the list of people already in voice
    const voiceUsers = Array.from(io.sockets.adapter.rooms.get(`voice-${roomId}`) || [])
      .filter(id => id !== socket.id);
    socket.emit('voice-users-list', voiceUsers);
  });

  socket.on('start-call', ({ roomId, username, type }) => {
    socket.to(roomId).emit('incoming-call', { callerId: socket.id, callerName: username, type });
  });

  socket.on('signal', ({ to, signal }) => {
    io.to(to).emit('signal', {
      from: socket.id,
      signal
    });
  });

  // Terminal (node-pty)
  let ptyProcess = null;
  
  socket.on('terminal-start', () => {
    if (ptyProcess) return; // already started for this socket
    const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
    try {
      ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: process.env.HOME || process.cwd(),
        env: process.env
      });

      ptyProcess.onData((data) => {
        socket.emit('terminal-data', data);
      });
    } catch (err) {
      console.error("PTY spawn error:", err);
      socket.emit('terminal-data', `\r\nError starting terminal: ${err.message}\r\n`);
    }
  });

  socket.on('terminal-input', (data) => {
    if (ptyProcess) {
      ptyProcess.write(data);
    }
  });

  socket.on('terminal-resize', ({ cols, rows }) => {
    if (ptyProcess) {
      try {
        ptyProcess.resize(cols, rows);
      } catch (e) {
        console.error(e);
      }
    }
  });

  socket.on('disconnect', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      const { roomId, username, isHost } = user;
      activeUsers.delete(socket.id);
      
      // Store in recent users for auto-rejoin
      const userKey = `${roomId}-${username}`;
      recentUsers.set(userKey, Date.now());
      recentUsers.set(userKey + '-isHost', isHost);
      setTimeout(() => {
        if (recentUsers.get(userKey) < Date.now() - 55000) {
          recentUsers.delete(userKey);
          recentUsers.delete(userKey + '-isHost');
        }
      }, 60000);

      // If host left, promote the next user in the room
      if (isHost) {
        const remaining = Array.from(activeUsers.entries()).filter(([id, u]) => u.roomId === roomId);
        if (remaining.length > 0) {
          const [nextId, nextUser] = remaining[0];
          nextUser.isHost = true;
          activeUsers.set(nextId, nextUser);
          io.to(nextId).emit('you-are-host');
        }
      }
      
      const getUserList = (rId) => Array.from(activeUsers.entries())
        .filter(([id, u]) => u.roomId === rId)
        .map(([id, u]) => ({ id, ...u }));
      io.to(roomId).emit('room-users', getUserList(roomId));
    }
    if (ptyProcess) {
      ptyProcess.kill();
    }
    console.log('User disconnected:', socket.id);
  });
});

// AI Mock Endpoint
app.post('/api/ai/prompt', (req, res) => {
  const { prompt } = req.body;
  // Mock AI response
  const mockCode = `// Generated code for: ${prompt}
function generatedCode() {
  console.log("This is a mock implementation");
  return true;
}
`;
  res.json({ code: mockCode });
});

// ─── Language map: our language name → Piston runtime name + version ───────
const PISTON_LANG_MAP = {
  python:     { language: 'python',     version: '3.10.0' },
  jupyter:    { language: 'python',     version: '3.10.0' },
  javascript: { language: 'javascript', version: '18.15.0' },
  typescript: { language: 'typescript', version: '5.0.3' },
  c:          { language: 'c',          version: '10.2.0' },
  cpp:        { language: 'c++',        version: '10.2.0' },
  java:       { language: 'java',       version: '15.0.2' },
  csharp:     { language: 'csharp',     version: '6.12.0' },
  go:         { language: 'go',         version: '1.16.2' },
  ruby:       { language: 'ruby',       version: '3.0.1' },
  php:        { language: 'php',        version: '8.2.3' },
  rust:       { language: 'rust',       version: '1.50.0' },
  kotlin:     { language: 'kotlin',     version: '1.8.20' },
  swift:      { language: 'swift',      version: '5.3.3' },
  bash:       { language: 'bash',       version: '5.2.0' },
};

// File extension map for Piston
const LANG_EXT = {
  python: 'py', jupyter: 'py', javascript: 'js', typescript: 'ts',
  c: 'c', cpp: 'cpp', java: 'java', csharp: 'cs',
  go: 'go', ruby: 'rb', php: 'php', rust: 'rs',
  kotlin: 'kt', swift: 'swift', bash: 'sh',
};

// Code Execution Endpoint — powered by Piston API (free, no Docker needed)
app.post('/api/execute', async (req, res) => {
  const { language, code, stdin } = req.body;
  if (!code) return res.status(400).json({ error: 'No code provided' });

  if (['html', 'css'].includes(language)) {
    return res.status(400).json({ error: 'Web languages are rendered in the browser.' });
  }
  if (language === 'sql') {
    return res.json({ output: 'SQL execution is not supported in the sandbox.', error: false });
  }

  const pistonLang = PISTON_LANG_MAP[language];
  if (!pistonLang) {
    return res.status(400).json({ output: `Language "${language}" is not supported.`, error: true });
  }

  const ext = LANG_EXT[language] || 'txt';
  // Java requires the file to be named Main.java
  const filename = language === 'java' ? 'Main.java' : `code.${ext}`;

  try {
    const pistonRes = await fetch(PISTON_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: pistonLang.language,
        version: pistonLang.version,
        files: [{ name: filename, content: code }],
        stdin: stdin || '',
        run_timeout: 10000,   // 10 second max run time
        compile_timeout: 15000
      })
    });

    if (!pistonRes.ok) {
      const errText = await pistonRes.text();
      return res.status(502).json({ output: `Piston API error: ${errText}`, error: true });
    }

    const data = await pistonRes.json();

    // Piston returns: { compile: { stdout, stderr, code }, run: { stdout, stderr, code } }
    let output = '';

    // Show compile errors/warnings if present
    if (data.compile) {
      if (data.compile.stderr && data.compile.stderr.trim()) {
        output += `[Compile]\n${data.compile.stderr.trim()}\n`;
      }
      if (data.compile.stdout && data.compile.stdout.trim()) {
        output += data.compile.stdout.trim() + '\n';
      }
      // If compile failed (non-zero exit), stop here
      if (data.compile.code !== 0) {
        return res.json({ output: output.trim() || '[Compilation failed with no output]', error: true });
      }
    }

    // Run output
    if (data.run) {
      if (data.run.stdout && data.run.stdout.trim()) output += data.run.stdout.trim();
      if (data.run.stderr && data.run.stderr.trim()) {
        output += (output ? '\n' : '') + `[stderr]\n${data.run.stderr.trim()}`;
      }
      if (!output.trim()) output = '(No output)';

      const hasError = data.run.code !== 0;
      return res.json({ output: output.trim(), error: hasError });
    }

    res.json({ output: output.trim() || '(No output)', error: false });

  } catch (err) {
    res.status(500).json({ output: 'Execution failed: ' + err.message, error: true });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
