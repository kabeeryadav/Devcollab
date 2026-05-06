/* eslint-disable react-hooks/set-state-in-effect */
'use client';
import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { Play, Square, Download, Sparkles } from 'lucide-react';

const LANGUAGES = [
  { id: 'python', name: 'Python' },
  { id: 'javascript', name: 'JS (Node)' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'java', name: 'Java' },
  { id: 'cpp', name: 'C++' },
  { id: 'c', name: 'C' },
  { id: 'csharp', name: 'C#' },
  { id: 'dart', name: 'Dart' },
  { id: 'jupyter', name: 'Jupyter' },
  { id: 'sql', name: 'SQL' },
  { id: 'html', name: 'HTML' },
  { id: 'css', name: 'CSS' }
];

const C_COMMENT = `/******************************************************************************

                            Welcome to Dev Collaboration App.
    This is a real-time developer collaboration tool for C, C++, Python, Java, 
    TypeScript, HTML, CSS, JS, SQL, and React.
    Code, Compile, Run and Collaborate online from anywhere in the world.

*******************************************************************************/

`;

const PY_COMMENT = `'''
******************************************************************************

                            Welcome to Dev Collaboration App.
    This is a real-time developer collaboration tool for C, C++, Python, Java, 
    TypeScript, HTML, CSS, JS, SQL, and React.
    Code, Compile, Run and Collaborate online from anywhere in the world.

******************************************************************************
'''

`;

const HTML_COMMENT = `<!--
******************************************************************************

                            Welcome to Dev Collaboration App.
    This is a real-time developer collaboration tool for C, C++, Python, Java, 
    TypeScript, HTML, CSS, JS, SQL, and React.
    Code, Compile, Run and Collaborate online from anywhere in the world.

******************************************************************************
-->

`;

const BOILERPLATES = {
  python: PY_COMMENT + 'print("Hello World")\n',
  javascript: C_COMMENT + 'console.log("Hello World");\n',
  typescript: C_COMMENT + 'let message: string = "Hello World";\nconsole.log(message);\n',
  java: C_COMMENT + 'public class Main\n{\n\tpublic static void main(String[] args) {\n\t\tSystem.out.println("Hello World");\n\t}\n}\n',
  cpp: C_COMMENT + '#include <iostream>\n\nusing namespace std;\n\nint main()\n{\n    cout<<"Hello World";\n\n    return 0;\n}\n',
  c: C_COMMENT + '#include <stdio.h>\n\nint main()\n{\n    printf("Hello World");\n\n    return 0;\n}\n',
  csharp: C_COMMENT + 'using System;\n\nclass Program\n{\n    static void Main()\n    {\n        Console.WriteLine("Hello World");\n    }\n}\n',
  dart: C_COMMENT + 'void main() {\n  print("Hello World");\n}\n',
  jupyter: PY_COMMENT + '# %%\n# Welcome to the Interactive Notebook!\n# You can use the "Run Cell" button to execute just the block of code your cursor is in.\n\nprint("Hello from Cell 1!")\n\n# %%\nprint("Hello from Cell 2!")\n# Note: This environment is stateless. Variables from Cell 1 will not carry over.\n',
  sql: C_COMMENT + '-- create a table\nCREATE TABLE students (\n  id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL\n);\n\n-- insert some values\nINSERT INTO students VALUES (1, \'Ryan\');\nINSERT INTO students VALUES (2, \'Joanna\');\n\n-- fetch some values\nSELECT * FROM students;\n',
  html: HTML_COMMENT + '<!DOCTYPE html>\n<html>\n<head>\n<title>Page Title</title>\n</head>\n<body>\n\n<h1>This is a Heading</h1>\n<p>This is a paragraph.</p>\n\n</body>\n</html>\n',
  css: C_COMMENT + 'body {\n  background-color: lightblue;\n}\n\nh1 {\n  color: white;\n  text-align: center;\n}\n\np {\n  font-family: verdana;\n  font-size: 20px;\n}\n'
};

export default function CodeEditor({ roomId, username }) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const settingsMapRef = useRef(null);
  const typeRef = useRef(null);
  const [provider, setProvider] = useState(null);
  const [binding, setBinding] = useState(null);
  const [language, setLanguage] = useState('python');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [previewCode, setPreviewCode] = useState('');
  const [shareCopied, setShareCopied] = useState(false);
  const [stdinValue, setStdinValue] = useState('');
  
  const [terminalHeight, setTerminalHeight] = useState(250);
  const [isDraggingTerminal, setIsDraggingTerminal] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Set theme based on html attribute
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    monaco.editor.setTheme(isDark ? 'vs-dark' : 'vs');

    // Force LF line endings for the model to prevent index shift/carriage return bug in Yjs
    const model = editor.getModel();
    if (model) {
      model.setEOL(monaco.editor.EndOfLineSequence.LF);
    }

    const doc = new Y.Doc();
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    // Robustly construct wsUrl: replace http/https with ws/wss and remove trailing slash
    const wsBase = socketUrl.replace(/^http/, 'ws').replace(/\/$/, '');
    const wsUrl = `${wsBase}/yjs`;
    
    console.log('Connecting to Yjs at:', wsUrl, 'Room:', roomId);
    const wsProvider = new WebsocketProvider(wsUrl, roomId, doc);
    
    const settingsMap = doc.getMap('settings');
    settingsMapRef.current = settingsMap;

    // Awareness (Cursors)
    const userColor = '#' + Math.floor(Math.random()*16777215).toString(16);
    wsProvider.awareness.setLocalStateField('user', {
      name: username,
      color: userColor
    });

    // Style awareness cursors
    const style = document.createElement('style');
    style.innerHTML = `
      .yRemoteSelection-${wsProvider.awareness.clientID} { background-color: ${userColor}33; }
      .yRemoteSelectionHead-${wsProvider.awareness.clientID} { border-color: ${userColor}; }
      .yRemoteSelectionHead-${wsProvider.awareness.clientID}::after { background-color: ${userColor}; }
    `;
    document.head.appendChild(style);

    const type = doc.getText('monaco');
    typeRef.current = type;
    const monacoBinding = new MonacoBinding(type, editor.getModel(), new Set([editor]), wsProvider.awareness);

    // Track connection status
    wsProvider.on('status', event => {
      console.log('Yjs Status:', event.status);
      setIsConnected(event.status === 'connected');
    });

    wsProvider.on('sync', (isSynced) => {
      console.log('Yjs Synced:', isSynced);
      if (isSynced) {
        if (model) {
          model.setEOL(monaco.editor.EndOfLineSequence.LF);
        }
        if (!settingsMap.has('language')) {
          settingsMap.set('language', 'python');
        } else {
          const storedLang = settingsMap.get('language');
          setLanguage(storedLang);
          if (monacoRef.current) {
            const monacoLang = storedLang === 'jupyter' ? 'python' : storedLang;
            monacoRef.current.editor.setModelLanguage(model, monacoLang);
          }
        }
        if (type.length === 0) {
          console.log('Inserting boilerplate...');
          type.insert(0, BOILERPLATES[settingsMap.get('language') || 'python'].replace(/\r\n/g, '\n'));
        }
      }
    });
    
    wsProvider.on('connection-error', (err) => {
      console.error('Yjs Connection Error:', err);
    });

    settingsMap.observe((event) => {
      if (settingsMap.has('language')) {
        const sharedLang = settingsMap.get('language');
        console.log('Shared language updated:', sharedLang);
        setLanguage(sharedLang);
        if (monacoRef.current && editorRef.current) {
          const monacoLang = sharedLang === 'jupyter' ? 'python' : sharedLang;
          const model = editorRef.current.getModel();
          if (model) {
            monacoRef.current.editor.setModelLanguage(model, monacoLang);
          }
        }
      }
    });

    setProvider(wsProvider);
    setBinding(monacoBinding);
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    if (settingsMapRef.current) {
      settingsMapRef.current.set('language', newLang);
    }
    if (editorRef.current && monacoRef.current) {
      const monacoLang = newLang === 'jupyter' ? 'python' : newLang;
      const model = editorRef.current.getModel();
      monacoRef.current.editor.setModelLanguage(model, monacoLang);
      
      const currentText = model.getValue().replace(/\r\n/g, '\n').trim();
      const isBoilerplate = Object.values(BOILERPLATES).some(bp => bp.replace(/\r\n/g, '\n').trim() === currentText) || currentText === '';
      if (isBoilerplate && typeRef.current) {
        typeRef.current.delete(0, typeRef.current.length);
        typeRef.current.insert(0, BOILERPLATES[newLang].replace(/\r\n/g, '\n'));
        model.setEOL(monacoRef.current.editor.EndOfLineSequence.LF);
      }
    }
  };

  const handleBeautify = () => {
    if (!editorRef.current) return;
    // Monaco built-in formatter only works for JS/TS/HTML/CSS
    const nativeFormatLangs = ['javascript', 'typescript', 'html', 'css', 'json'];
    if (nativeFormatLangs.includes(language)) {
      const action = editorRef.current.getAction('editor.action.formatDocument');
      if (action) {
        action.run();
        return;
      }
    }
    fallbackFormat();
  };

  const fallbackFormat = () => {
    const model = editorRef.current.getModel();
    const code = model.getValue();
    const lines = code.split('\n');
    let indentLevel = 0;
    const formattedLines = lines.map(line => {
      let trimmed = line.trim();
      
      // Look for opening and closing brackets in the line
      const opens = (trimmed.match(/\{/g) || []).length;
      const closes = (trimmed.match(/\}/g) || []).length;
      
      if (trimmed.startsWith('}')) {
        indentLevel = Math.max(0, indentLevel - 1);
        const indented = '    '.repeat(indentLevel) + trimmed;
        indentLevel = Math.max(0, indentLevel + opens - (closes - 1));
        return indented;
      }
      
      const indented = '    '.repeat(indentLevel) + trimmed;
      indentLevel = Math.max(0, indentLevel + (opens - closes));
      return indented;
    });
    
    model.setValue(formattedLines.join('\n'));
    if (monacoRef.current) {
      model.setEOL(monacoRef.current.editor.EndOfLineSequence.LF);
    }
  };

  const handleDownload = () => {
    if (!editorRef.current) return;
    const code = editorRef.current.getValue();
    const extMap = {
      python: 'py', javascript: 'js', java: 'java', cpp: 'cpp', c: 'c',
      csharp: 'cs', dart: 'dart', jupyter: 'ipynb', sql: 'sql', html: 'html', css: 'css'
    };
    const ext = extMap[language] || 'txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `main.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDebug = () => {
    setOutput('Debugging requires a GDB server instance. Not supported in standard mode.');
  };

  const handleStop = () => {
    setIsRunning(false);
    setOutput(prev => prev + '\n[Process forcefully stopped]');
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    }).catch(() => {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    });
  };

  const handleRunCode = async () => {
    if (!editorRef.current) return;
    const code = editorRef.current.getValue();
    
    if (['html', 'css'].includes(language)) {
      setPreviewCode(code);
      return;
    }

    setIsRunning(true);
    setOutput('Running...');
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001').replace(/\/$/, '');
      const apiUrl = `${baseUrl}/api/execute`;
      
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code, stdin: stdinValue })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server returned ${res.status}: ${errorText.substring(0, 100)}`);
      }
      
      const data = await res.json();
      setOutput(data.output || data.error);
    } catch (err) {
      setOutput('Failed to execute code: ' + err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunCell = async () => {
    if (!editorRef.current) return;
    const model = editorRef.current.getModel();
    const position = editorRef.current.getPosition();
    const lines = model.getLinesContent();
    
    let startLine = 0;
    let endLine = lines.length - 1;
    
    // Find boundary above cursor
    for (let i = position.lineNumber - 1; i >= 0; i--) {
      if (lines[i].startsWith('# %%') || lines[i].startsWith('# In[')) {
        startLine = i;
        break;
      }
    }
    
    // Find boundary below cursor
    for (let i = position.lineNumber; i < lines.length; i++) {
      if (lines[i].startsWith('# %%') || lines[i].startsWith('# In[')) {
        endLine = i - 1;
        break;
      }
    }
    
    const cellCode = lines.slice(startLine, endLine + 1).join('\n');
    
    setIsRunning(true);
    setOutput('Running Cell...');
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001').replace(/\/$/, '');
      const apiUrl = `${baseUrl}/api/execute`;
      
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: 'python', code: cellCode, stdin: stdinValue })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server returned ${res.status}: ${errorText.substring(0, 100)}`);
      }
      
      const data = await res.json();
      setOutput(`--- Cell Output ---\n${data.output || data.error}`);
    } catch (err) {
      setOutput('Failed to execute cell: ' + err.message);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
          if (editorRef.current && window.monaco) {
             window.monaco.editor.setTheme(isDark ? 'vs-dark' : 'vs');
          }
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => {
      observer.disconnect();
      if (provider) {
        provider.disconnect();
      }
      if (binding) {
        binding.destroy();
      }
    };
  }, [provider, binding]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingTerminal) return;
      const newHeight = window.innerHeight - e.clientY;
      if (newHeight < 100) return setTerminalHeight(100);
      if (newHeight > window.innerHeight - 200) return setTerminalHeight(window.innerHeight - 200);
      setTerminalHeight(newHeight);
    };

    const handleMouseUp = () => {
      if (isDraggingTerminal) {
        setIsDraggingTerminal(false);
        document.body.classList.remove('dragging');
      }
    };

    if (isDraggingTerminal) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.classList.add('dragging');
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('dragging');
    };
  }, [isDraggingTerminal]);

  const startTerminalDrag = (e) => {
    e.preventDefault();
    setIsDraggingTerminal(true);
  };

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="editor-toolbar" style={{ padding: '0.4rem 1rem', background: 'var(--panel-bg)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        
        {/* Left Actions Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {language === 'jupyter' && (
            <button className="btn btn-primary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={handleRunCell} disabled={isRunning}>
              <Play size={14} fill="currentColor" /> Run Cell
            </button>
          )}
          <button className="btn btn-primary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#22c55e', borderColor: '#22c55e' }} onClick={handleRunCode} disabled={isRunning}>
             <Play size={14} fill="currentColor" /> {language === 'jupyter' ? 'Run All' : 'Run'}
          </button>
          
          <button className="btn" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', background: '#ef4444', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={handleStop}>
            <Square size={14} fill="currentColor" /> Stop
          </button>

          <button className="btn" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', background: shareCopied ? '#22c55e' : '#f59e0b', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'background 0.3s' }} onClick={handleShare}>
            {shareCopied ? '✓ Link Copied!' : 'Share'}
          </button>

          <button className="btn" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', background: '#0ea5e9', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={handleBeautify}>
            <Sparkles size={14} /> Beautify
          </button>
          
          <button className="btn" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', background: '#8b5cf6', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={handleDownload}>
            <Download size={14} /> Download
          </button>

          <button className="btn" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => { if(confirm('Reset code to boilerplate?')) handleLanguageChange(language); }}>
             Reset
          </button>
        </div>

        {/* Right Language Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Language:</span>
          <select 
            value={language} 
            onChange={(e) => handleLanguageChange(e.target.value)}
            style={{ 
              padding: '0.3rem 0.5rem', 
              fontSize: '0.8rem', 
              background: 'var(--bg-primary)', 
              color: 'var(--text-primary)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '4px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {LANGUAGES.map(lang => (
              <option key={lang.id} value={lang.id}>{lang.name}</option>
            ))}
          </select>
            {isConnected ? (
              <span style={{ fontSize: '0.75rem', color: '#22c55e', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}></span> Connected
              </span>
            ) : (
              <span style={{ fontSize: '0.75rem', color: '#ef4444', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }}></span> Reconnecting...
              </span>
            )}
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
          <Editor
            height="100%"
            defaultLanguage="python"
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              automaticLayout: true,
              padding: { top: 16 }
            }}
          />
        </div>
        
        <div 
          className={`resizer-horizontal ${isDraggingTerminal ? 'active' : ''}`}
          onMouseDown={startTerminalDrag}
        />

        <div className="terminal-container" style={{ height: `${terminalHeight}px`, flexShrink: 0, borderTop: '1px solid var(--border-color)', background: 'var(--panel-bg)', padding: '0.5rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                {['html', 'css'].includes(language) ? 'Live Web Preview' : 'Output Terminal'}
              </h4>
              {!['html', 'css'].includes(language) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Input (stdin):</span>
                  <input 
                    type="text" 
                    placeholder="Provide input here..." 
                    value={stdinValue}
                    onChange={(e) => setStdinValue(e.target.value)}
                    style={{ 
                      background: 'var(--bg-primary)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '4px', 
                      padding: '2px 8px', 
                      fontSize: '0.75rem', 
                      color: 'var(--text-primary)',
                      width: '180px'
                    }}
                  />
                </div>
              )}
           </div>
           {['html', 'css'].includes(language) ? (
             <iframe 
               srcDoc={
                 language === 'html' ? previewCode :
                 `<html><head><style>${previewCode}</style></head><body><h1>Preview</h1><p>Change your CSS to style this HTML.</p></body></html>`
               } 
               style={{ width: '100%', height: '100%', border: 'none', background: '#fff', borderRadius: '4px' }} 
               sandbox="allow-scripts"
             />
           ) : (
             <pre style={{ flex: 1, overflow: 'auto', fontSize: '0.85rem', color: output && (output.includes('Error') || output.includes('Failed')) ? 'var(--danger)' : 'var(--text-primary)', margin: 0, fontFamily: '"Fira Code", monospace', whiteSpace: 'pre-wrap' }}>
                {output || 'Ready. Click Run to execute.'}
             </pre>
           )}
        </div>
      </div>
    </div>
  );
}
