const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const os = require('os');
const pty = require('node-pty');
const WebSocket = require('ws');
const { setupWSConnection } = require('y-websocket/bin/utils');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
// const sqlite3 = require('sqlite3').verbose(); // Temporarily disabled due to build errors

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

wss.on('connection', setupWSConnection);

server.on('upgrade', (request, socket, head) => {
  // If request URL starts with /yjs, handle it with y-websocket
  if (request.url.startsWith('/yjs')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
  // Otherwise, let Socket.io handle its own upgrade requests internally
});

const activeUsers = new Map();
const pendingRequests = new Map(); // socketId -> { username, roomId }

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

    if (isFirst) {
      // Creator joins immediately as host
      socket.join(roomId);
      activeUsers.set(socket.id, { username, roomId, isHost: true });
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

  // WebRTC Signaling (Voice Call)
  socket.on('join-voice', (roomId) => {
    socket.to(roomId).emit('user-joined-voice', socket.id);
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
      const { roomId, isHost } = user;
      activeUsers.delete(socket.id);
      
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

// Code Execution Endpoint
app.post('/api/execute', (req, res) => {
  const { language, code, stdin } = req.body;
  if (!code) return res.status(400).json({ error: 'No code provided' });

  // Web languages shouldn't hit the backend usually, but just in case
  if (['html', 'css'].includes(language)) {
    return res.status(400).json({ error: 'Web languages are rendered in the browser.' });
  }

  if (language === 'sql') {
    return res.json({ output: 'SQL execution is temporarily disabled on the live server. It will be back soon!', error: false });
  }

  const tempDir = os.tmpdir();
  const filename = `code_${Date.now()}`;
  let filepath, command;

  if (language === 'javascript') {
    filepath = path.join(tempDir, `${filename}.js`);
    command = `node ${filepath}`;
  } else if (language === 'python' || language === 'jupyter') {
    filepath = path.join(tempDir, `${filename}.py`);
    command = `python ${filepath}`;
  } else if (language === 'typescript') {
    filepath = path.join(tempDir, `${filename}.ts`);
    command = `npx ts-node ${filepath}`;
  } else if (language === 'c') {
    filepath = path.join(tempDir, `${filename}.c`);
    const outpath = path.join(tempDir, `${filename}.exe`);
    command = `gcc ${filepath} -o ${outpath} && ${outpath}`;
  } else if (language === 'cpp') {
    filepath = path.join(tempDir, `${filename}.cpp`);
    const outpath = path.join(tempDir, `${filename}.exe`);
    command = `g++ ${filepath} -o ${outpath} && ${outpath}`;
  } else if (language === 'java') {
    const javaDir = path.join(tempDir, filename);
    fs.mkdirSync(javaDir);
    filepath = path.join(javaDir, 'Main.java');
    // Using powershell syntax for cd and && doesn't always work cleanly, we can use child_process cwd
    command = `javac Main.java && java Main`;
  } else if (language === 'csharp') {
    filepath = path.join(tempDir, `${filename}.cs`);
    const outpath = path.join(tempDir, `${filename}.exe`);
    command = `csc ${filepath} /out:${outpath} && ${outpath}`;
  } else if (language === 'dart') {
    filepath = path.join(tempDir, `${filename}.dart`);
    command = `dart run ${filepath}`;
  } else {
    return res.status(400).json({ error: 'Unsupported backend language' });
  }

  fs.writeFile(filepath, code, (err) => {
    if (err) return res.status(500).json({ error: 'Failed to write file' });

    const parts = command.split(' ');
    let proc;
    try {
      const { spawn } = require('child_process');
      // Use shell to handle compound commands (gcc ... && ./out)
      proc = spawn(command, [], { shell: true, cwd: language === 'java' ? path.dirname(filepath) : undefined, timeout: 10000 });
    } catch (spawnErr) {
      return res.status(500).json({ error: 'Failed to spawn process: ' + spawnErr.message });
    }

    // Pipe stdin if provided
    if (stdin) {
      proc.stdin.write(stdin);
    }
    proc.stdin.end();

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      // Clean up temp files
      try {
        if (language === 'java') {
          fs.rmSync(path.dirname(filepath), { recursive: true, force: true });
        } else {
          fs.unlinkSync(filepath);
        }
      } catch (e) { /* ignore cleanup errors */ }

      if (code !== 0 && !stdout) {
        return res.json({ output: stderr || `Process exited with code ${code}`, error: true });
      }
      res.json({ output: stdout + (stderr ? '\n[stderr]: ' + stderr : ''), error: code !== 0 });
    });

    proc.on('error', (err) => {
      res.json({ output: err.message, error: true });
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
