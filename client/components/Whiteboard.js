/* eslint-disable react-hooks/set-state-in-effect */
'use client';
import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { PenTool, Highlighter, Eraser, Type, Trash2 } from 'lucide-react';

const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ffffff', '#000000'];

export default function Whiteboard({ roomId }) {
  const canvasRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [provider, setProvider] = useState(null);
  const [ydoc, setYdoc] = useState(null);
  
  const [tool, setTool] = useState('pen'); // 'pen', 'marker', 'eraser', 'text'
  const [color, setColor] = useState('#3b82f6');
  const [size, setSize] = useState(3);
  
  const handleToolSelect = (newTool) => {
    setTool(newTool);
    if (newTool === 'pen') setSize(3);
    else if (newTool === 'marker') setSize(15);
    else if (newTool === 'eraser') setSize(30);
    else if (newTool === 'text') setSize(24);
  };
  
  const [textBox, setTextBox] = useState({ visible: false, x: 0, y: 0, text: '' });
  
  const ymapRef = useRef(null);
  const drawItemRef = useRef(null);
  const isDrawing = useRef(false);
  const currentPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const doc = new Y.Doc();
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    const wsBase = socketUrl.replace(/^http/, 'ws').replace(/\/$/, '');
    const wsUrl = `${wsBase}/yjs`;

    const wsProvider = new WebsocketProvider(wsUrl, `whiteboard-${roomId}`, doc);
    const ymap = doc.getMap('lines');
    ymapRef.current = ymap;

    wsProvider.on('status', event => {
      setIsConnected(event.status === 'connected');
    });

    setYdoc(doc);
    setProvider(wsProvider);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const redrawAll = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      Array.from(ymap.values()).forEach(item => drawItem(item, false));
    };

    const drawItem = (item, emit) => {
      ctx.save();
      
      const isEraser = item.tool === 'eraser';
      if (isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = item.size || 30;
      } else if (item.tool === 'marker') {
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = item.size || 15;
        ctx.strokeStyle = item.color || '#fff';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;
        ctx.lineWidth = item.size || 3;
        ctx.strokeStyle = item.color || '#fff';
      }

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (item.type === 'text') {
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
        const fontSize = item.size || 24;
        ctx.font = `${fontSize}px "Inter", sans-serif`;
        ctx.fillStyle = item.color || '#fff';
        ctx.fillText(item.text, item.x, item.y);
      } else {
        // Line or old schema
        ctx.beginPath();
        ctx.moveTo(item.x0, item.y0);
        ctx.lineTo(item.x1, item.y1);
        ctx.stroke();
        ctx.closePath();
      }
      ctx.restore();

      if (!emit) return;
      const id = Date.now().toString() + Math.random().toString();
      ymap.set(id, item);
    };
    
    drawItemRef.current = drawItem;

    ymap.observe((event) => {
      let needsFullRedraw = false;
      event.changes.keys.forEach((change, key) => {
        if (change.action === 'delete') {
          needsFullRedraw = true;
        } else if (change.action === 'add' && !needsFullRedraw) {
          const item = ymap.get(key);
          if (item) drawItem(item, false);
        }
      });
      if (needsFullRedraw) {
        redrawAll();
      }
    });

    const onMouseDown = (e) => {
      // If tool is text, handle via onClick instead
      if (document.documentElement.getAttribute('data-tool') === 'text') return;
      
      isDrawing.current = true;
      const rect = canvas.getBoundingClientRect();
      currentPos.current.x = e.clientX - rect.left;
      currentPos.current.y = e.clientY - rect.top;
    };

    const onMouseUp = (e) => {
      if (!isDrawing.current) return;
      isDrawing.current = false;
      const rect = canvas.getBoundingClientRect();
      const activeTool = document.documentElement.getAttribute('data-tool') || 'pen';
      const activeColor = document.documentElement.getAttribute('data-color') || '#fff';
      const activeSize = document.documentElement.getAttribute('data-size') || 3;
      
      drawItem({ 
        type: 'line', tool: activeTool, color: activeColor, size: parseInt(activeSize),
        x0: currentPos.current.x, y0: currentPos.current.y, 
        x1: e.clientX - rect.left, y1: e.clientY - rect.top 
      }, true);
    };

    const onMouseMove = (e) => {
      if (!isDrawing.current) return;
      const rect = canvas.getBoundingClientRect();
      const activeTool = document.documentElement.getAttribute('data-tool') || 'pen';
      const activeColor = document.documentElement.getAttribute('data-color') || '#fff';
      const activeSize = document.documentElement.getAttribute('data-size') || 3;
      
      drawItem({ 
        type: 'line', tool: activeTool, color: activeColor, size: parseInt(activeSize),
        x0: currentPos.current.x, y0: currentPos.current.y, 
        x1: e.clientX - rect.left, y1: e.clientY - rect.top 
      }, true);
      
      currentPos.current.x = e.clientX - rect.left;
      currentPos.current.y = e.clientY - rect.top;
    };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseout', onMouseUp);
    canvas.addEventListener('mousemove', onMouseMove);

    // Initial draw
    redrawAll();

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mouseout', onMouseUp);
      canvas.removeEventListener('mousemove', onMouseMove);
      wsProvider.disconnect();
    };
  }, [roomId]);

  // Sync tool and color to DOM for event listeners to access without stale closure
  useEffect(() => {
    document.documentElement.setAttribute('data-tool', tool);
    document.documentElement.setAttribute('data-color', color);
    document.documentElement.setAttribute('data-size', size);
  }, [tool, color, size]);

  const handleCanvasClick = (e) => {
    if (tool !== 'text') return;
    const rect = canvasRef.current.getBoundingClientRect();
    setTextBox({
      visible: true,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      text: ''
    });
  };

  const handleTextSubmit = (e) => {
    if (e.key === 'Enter') {
      if (textBox.text.trim() && drawItemRef.current) {
        drawItemRef.current({
          type: 'text',
          tool: 'text',
          color: color,
          size: size,
          x: textBox.x,
          y: textBox.y + (size * 0.8), // offset for baseline
          text: textBox.text
        }, true);
      }
      setTextBox({ visible: false, x: 0, y: 0, text: '' });
    } else if (e.key === 'Escape') {
      setTextBox({ visible: false, x: 0, y: 0, text: '' });
    }
  };

  const clearBoard = () => {
    if (!ymapRef.current) return;
    ymapRef.current.forEach((val, key) => {
      ymapRef.current.delete(key);
    });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ padding: '0.5rem 1rem', background: 'var(--panel-bg)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 500 }}>Whiteboard</h3>
          {isConnected ? (
            <span style={{ fontSize: '0.7rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e' }}></span> Live
            </span>
          ) : (
            <span style={{ fontSize: '0.7rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }}></span> Offline
            </span>
          )}
        </div>
        
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          
          {/* Tools */}
          <div style={{ display: 'flex', background: 'var(--bg-primary)', borderRadius: '8px', padding: '0.25rem' }}>
            <button 
              onClick={() => handleToolSelect('pen')} 
              style={{ padding: '0.4rem', borderRadius: '6px', background: tool === 'pen' ? 'var(--accent-color)' : 'transparent', color: tool === 'pen' ? '#fff' : 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}
              title="Pen"
            ><PenTool size={18} /></button>
            <button 
              onClick={() => handleToolSelect('marker')} 
              style={{ padding: '0.4rem', borderRadius: '6px', background: tool === 'marker' ? 'var(--accent-color)' : 'transparent', color: tool === 'marker' ? '#fff' : 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}
              title="Marker"
            ><Highlighter size={18} /></button>
            <button 
              onClick={() => handleToolSelect('eraser')} 
              style={{ padding: '0.4rem', borderRadius: '6px', background: tool === 'eraser' ? 'var(--accent-color)' : 'transparent', color: tool === 'eraser' ? '#fff' : 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}
              title="Eraser"
            ><Eraser size={18} /></button>
            <button 
              onClick={() => handleToolSelect('text')} 
              style={{ padding: '0.4rem', borderRadius: '6px', background: tool === 'text' ? 'var(--accent-color)' : 'transparent', color: tool === 'text' ? '#fff' : 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}
              title="Text"
            ><Type size={18} /></button>
          </div>

          <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />

          {/* Size Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Size</span>
             <input 
               type="range" 
               min="1" 
               max="100" 
               value={size} 
               onChange={(e) => setSize(parseInt(e.target.value))} 
               style={{ width: '80px', accentColor: 'var(--accent-color)' }}
             />
          </div>

          <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />

          {/* Colors */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{ 
                  width: '24px', height: '24px', borderRadius: '50%', background: c, 
                  border: color === c ? '3px solid var(--accent-color)' : (c === '#ffffff' || c === '#000000' ? '1px solid var(--border-color)' : 'none'), 
                  cursor: 'pointer', padding: 0, boxSizing: 'border-box'
                }}
                title={c}
              />
            ))}
          </div>

          <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />

          <button 
            onClick={clearBoard}
            style={{ padding: '0.4rem', borderRadius: '6px', background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Trash2 size={16} /> Clear
          </button>
        </div>
      </div>
      
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          width={2000}
          height={2000}
          style={{ cursor: tool === 'text' ? 'text' : 'crosshair', background: 'var(--panel-bg)' }}
          onClick={handleCanvasClick}
        />
        
        {textBox.visible && (
          <input
            autoFocus
            type="text"
            placeholder="Type here..."
            value={textBox.text}
            onChange={(e) => setTextBox(prev => ({ ...prev, text: e.target.value }))}
            onKeyDown={handleTextSubmit}
            onBlur={() => {
              if (textBox.text.trim() && drawItemRef.current) {
                drawItemRef.current({
                  type: 'text',
                  tool: 'text',
                  color: color,
                  size: size,
                  x: textBox.x,
                  y: textBox.y + (size * 0.8),
                  text: textBox.text
                }, true);
              }
              setTextBox({ visible: false, x: 0, y: 0, text: '' });
            }}
            style={{
              position: 'absolute',
              left: textBox.x,
              top: textBox.y,
              background: 'var(--panel-bg)',
              border: `2px dashed ${color}`,
              color: color,
              font: `${size}px "Inter", sans-serif`,
              outline: 'none',
              padding: '4px 8px',
              minWidth: '150px',
              zIndex: 10,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              borderRadius: '4px'
            }}
          />
        )}
      </div>
    </div>
  );
}
