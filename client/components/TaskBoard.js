/* eslint-disable react-hooks/set-state-in-effect */
'use client';
import { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export default function TaskBoard({ roomId }) {
  const [isConnected, setIsConnected] = useState(false);
  const [tasks, setTasks] = useState({});
  const [newTask, setNewTask] = useState('');
  const [ymap, setYmap] = useState(null);

  useEffect(() => {
    const doc = new Y.Doc();
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    const wsBase = socketUrl.replace(/^http/, 'ws').replace(/\/$/, '');
    const wsUrl = `${wsBase}/yjs`;

    const wsProvider = new WebsocketProvider(wsUrl, `taskboard-${roomId}`, doc);
    const map = doc.getMap('tasks');
    setYmap(map);

    wsProvider.on('status', event => {
      setIsConnected(event.status === 'connected');
    });

    const updateTasks = () => {
      setTasks(map.toJSON());
    };

    map.observe(updateTasks);
    // Initial sync
    updateTasks();

    return () => {
      wsProvider.disconnect();
    };
  }, [roomId]);

  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.trim() || !ymap) return;
    
    const id = Date.now().toString() + Math.random().toString();
    ymap.set(id, { id, title: newTask.trim(), status: 'todo' });
    setNewTask('');
  };

  const moveTask = (id, newStatus) => {
    if (!ymap) return;
    const task = ymap.get(id);
    if (task) {
      ymap.set(id, { ...task, status: newStatus });
    }
  };

  const deleteTask = (id) => {
    if (!ymap) return;
    ymap.delete(id);
  };

  const columns = ['todo', 'in-progress', 'done'];
  const columnTitles = {
    'todo': 'To Do',
    'in-progress': 'In Progress',
    'done': 'Done'
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1rem', background: 'var(--panel-bg)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 500 }}>Collaborative Task Board</h3>
          {isConnected ? (
            <span style={{ fontSize: '0.75rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}></span> Connected
            </span>
          ) : (
            <span style={{ fontSize: '0.75rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }}></span> Offline
            </span>
          )}
        </div>
        <form onSubmit={addTask} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="input"
            placeholder="Add new task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">Add Task</button>
        </form>
      </div>
      
      <div style={{ flex: 1, display: 'flex', padding: '1rem', gap: '1rem', overflowX: 'auto', background: 'var(--bg-color)' }}>
        {columns.map(status => (
          <div key={status} style={{ flex: 1, minWidth: '250px', background: 'var(--panel-bg)', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-color)' }}>
              {columnTitles[status]}
            </h4>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Object.values(tasks)
                .filter(t => t.status === status)
                .map(task => (
                  <div key={task.id} style={{ background: 'var(--bg-color)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.9rem', wordBreak: 'break-word', color: 'var(--text-primary)' }}>{task.title}</span>
                      <button onClick={() => deleteTask(task.id)} style={{ background: 'transparent', border: 'none', color: 'var(--error-color, #ff4d4f)', cursor: 'pointer', padding: '2px', fontSize: '1rem', lineHeight: 1 }} title="Delete task">×</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: 'auto' }}>
                      {columns.map(targetStatus => (
                        status !== targetStatus && (
                          <button 
                            key={targetStatus}
                            onClick={() => moveTask(task.id, targetStatus)}
                            style={{ fontSize: '0.7rem', padding: '4px 8px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'background 0.2s' }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            Move to {columnTitles[targetStatus]}
                          </button>
                        )
                      ))}
                    </div>
                  </div>
              ))}
              {Object.values(tasks).filter(t => t.status === status).length === 0 && (
                 <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                   No tasks here
                 </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
