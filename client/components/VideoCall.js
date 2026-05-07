'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneCall, PhoneOff, PhoneIncoming, Check, X, Users, Headphones } from 'lucide-react';

export default function VideoCall({ socket, roomId, username, users }) {
  const [inCall, setInCall] = useState(false);
  const [callType, setCallType] = useState(null); 
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [pinnedId, setPinnedId] = useState(null);
  const [streams, setStreams] = useState([]); 
  
  const localStreamRef = useRef(null);
  const inCallRef = useRef(false);
  const peersRef = useRef({});
  const pendingSignals = useRef({}); // userId -> Array of signals

  const configuration = { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] };

  useEffect(() => {
    if (!socket) return;

    const handleUserJoinedVoice = async (userId) => {
      if (!inCallRef.current || !localStreamRef.current) return;
      
      // If we are already connected to this user, ignore
      if (peersRef.current[userId]) return;

      console.log(`Creating offer for new user: ${userId}`);
      const pc = createPeerConnection(userId);
      peersRef.current[userId] = pc;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('signal', { to: userId, signal: offer });
    };

    const handleSignal = async ({ from, signal }) => {
      if (!inCallRef.current) {
        // Queue signals if we aren't "in call" yet but might be soon
        if (!pendingSignals.current[from]) pendingSignals.current[from] = [];
        pendingSignals.current[from].push(signal);
        return;
      }

      let pc = peersRef.current[from];

      if (signal.type === 'offer') {
        if (pc) pc.close();
        pc = createPeerConnection(from);
        peersRef.current[from] = pc;
        
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('signal', { to: from, signal: answer });
      } else if (signal.type === 'answer') {
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
        }
      } else if (signal.type === 'ice-candidate') {
        if (pc) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (e) {
            console.error('Error adding ice candidate', e);
          }
        }
      }
    };

    const handleIncomingCall = ({ callerId, callerName, type }) => {
      if (!inCallRef.current) {
        setIncomingCall({ callerId, callerName, type });
      }
    };

    const handleVoiceUsersList = (userIds) => {
      if (!inCallRef.current || !localStreamRef.current) return;
      userIds.forEach(userId => {
        handleUserJoinedVoice(userId);
      });
    };

    const handleUserLeft = (userId) => {
      console.log(`User left call: ${userId}`);
      if (peersRef.current[userId]) {
        peersRef.current[userId].close();
        delete peersRef.current[userId];
      }
      setStreams(prev => prev.filter(s => s.id !== userId));
      const audioEl = document.getElementById(`audio-out-${userId}`);
      if (audioEl) audioEl.remove();
    };

    socket.on('user-joined-voice', handleUserJoinedVoice);
    socket.on('voice-users-list', handleVoiceUsersList);
    socket.on('signal', handleSignal);
    socket.on('incoming-call', handleIncomingCall);
    socket.on('user-left', handleUserLeft);

    return () => {
      socket.off('user-joined-voice', handleUserJoinedVoice);
      socket.off('voice-users-list', handleVoiceUsersList);
      socket.off('signal', handleSignal);
      socket.off('incoming-call', handleIncomingCall);
      socket.off('user-left', handleUserLeft);
    };
  }, [socket]);

  const createPeerConnection = (userId) => {
    const pc = new RTCPeerConnection(configuration);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('signal', { to: userId, signal: { type: 'ice-candidate', candidate: event.candidate } });
      }
    };

    pc.ontrack = (event) => {
      console.log(`Received track from ${userId}: ${event.track.kind}`);
      setStreams(prev => {
        const otherStreams = prev.filter(s => s.id !== userId);
        return [...otherStreams, { id: userId, stream: event.streams[0], isLocal: false }];
      });
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Process any signals that arrived before we were in the call
    processPendingSignals(userId);

    return pc;
  };


  const processPendingSignals = async (userId) => {
    if (pendingSignals.current[userId]) {
      for (const signal of pendingSignals.current[userId]) {
        await handleSignal({ from: userId, signal });
      }
      delete pendingSignals.current[userId];
    }
  };

  useEffect(() => {
    // Sync remote streams to audio elements (the highly reliable "old" way)
    const remoteStreams = streams.filter(s => !s.isLocal);
    
    remoteStreams.forEach(s => {
      let audio = document.getElementById(`audio-out-${s.id}`);
      if (!audio) {
        audio = document.createElement('audio');
        audio.id = `audio-out-${s.id}`;
        audio.autoplay = true;
        document.body.appendChild(audio);
      }
      if (audio.srcObject !== s.stream) {
        audio.srcObject = s.stream;
      }
    });

    return () => {};
  }, [streams]);

  const startCall = async (type) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: type === 'video', 
        audio: true 
      });
      localStreamRef.current = stream;
      setInCall(true);
      inCallRef.current = true;
      setCallType(type);
      setStreams([{ id: socket.id, stream, isLocal: true }]);
      
      socket.emit('start-call', { roomId, username, type });
      socket.emit('join-voice', roomId);
    } catch (err) {
      console.error(err);
      alert("Camera/Mic access denied.");
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    const type = incomingCall.type;
    setIncomingCall(null);
    await startCall(type);
  };

  const declineCall = () => setIncomingCall(null);

  const leaveCall = () => {
    setInCall(false);
    inCallRef.current = false;
    setCallType(null);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    Object.keys(peersRef.current).forEach(userId => {
      peersRef.current[userId].close();
    });
    peersRef.current = {};
    setStreams([]);
    document.querySelectorAll('audio[id^="audio-out-"]').forEach(el => el.remove());
    socket.emit('user-left', socket.id); 
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsVideoOff(!track.enabled);
      }
    }
  };

  return (
    <>
      {incomingCall && (
        <div className="incoming-call-toast" style={{
          position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(30, 41, 59, 0.95)', backdropFilter: 'blur(10px)',
          padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #334155',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: '1.25rem', color: '#fff'
        }}>
          <div style={{ background: '#6366f1', padding: '0.75rem', borderRadius: '50%', animation: 'pulse 2s infinite' }}>
            <PhoneIncoming size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Incoming Call</div>
            <div style={{ fontSize: '1rem', fontWeight: 600 }}>{incomingCall.callerName}</div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={declineCall} style={{ background: '#ef4444', border: 'none', padding: '0.6rem', borderRadius: '50%', color: '#fff', cursor: 'pointer' }}><X size={18} /></button>
            <button onClick={acceptCall} style={{ background: '#10b981', border: 'none', padding: '0.6rem', borderRadius: '50%', color: '#fff', cursor: 'pointer' }}><Check size={18} /></button>
          </div>
        </div>
      )}

      {inCall && callType === 'video' && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ 
            display: streamTypeDisplay(streams), 
            gridTemplateColumns: pinnedId ? '1fr' : (streams.length > 2 ? 'repeat(2, 1fr)' : '1fr'),
            gridTemplateRows: 'auto',
            gap: '0.6rem', 
            maxWidth: pinnedId ? '400px' : '500px',
            maxHeight: '75vh',
            overflowY: 'auto',
            padding: '4px',
            scrollbarWidth: 'none'
          }}>
            {[...streams].sort((a, b) => {
              if (a.id === pinnedId) return -1;
              if (b.id === pinnedId) return 1;
              return 0;
            }).map(s => (
              <MediaRenderer 
                key={s.id} 
                stream={s.stream} 
                isLocal={s.isLocal} 
                type={callType}
                isPinned={s.id === pinnedId}
                onPin={() => setPinnedId(pinnedId === s.id ? null : s.id)}
                name={s.isLocal ? 'You' : (users.find(u => u.id === s.id)?.username || 'User')} 
              />
            ))}
          </div>
          
          <div style={{ 
            background: 'rgba(15, 23, 42, 0.95)', padding: '0.75rem 1.5rem', borderRadius: '99px',
            display: 'flex', gap: '1.25rem', border: '1px solid #334155', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(12px)'
          }}>
            <button onClick={toggleMute} title="Toggle Mute" style={{ background: isMuted ? '#ef4444' : 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>{isMuted ? <MicOff size={20} /> : <Mic size={20} />}</button>
            <button onClick={toggleVideo} title="Toggle Video" style={{ background: isVideoOff ? '#ef4444' : 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>{isVideoOff ? <VideoOff size={20} /> : <VideoIcon size={20} />}</button>
            <div style={{ width: '1px', background: '#334155' }}></div>
            <button onClick={leaveCall} style={{ background: '#ef4444', border: 'none', padding: '0.4rem 1.25rem', borderRadius: '99px', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }}>Leave</button>
          </div>
        </div>
      )}

      {/* Header UI for Audio Call or Buttons for Starting Call */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {!inCall ? (
          <>
            <button onClick={() => startCall('audio')} style={{ background: 'transparent', border: '1px solid var(--border-color)', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
              <Headphones size={14} /> Audio Call
            </button>
            <button onClick={() => startCall('video')} style={{ background: 'transparent', border: '1px solid var(--border-color)', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
              <VideoIcon size={14} /> Video Call
            </button>
          </>
        ) : (
          callType === 'audio' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--panel-bg)', padding: '4px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite' }}></span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Audio Live ({streams.length})</span>
              </div>
              <div style={{ width: '1px', height: '16px', background: 'var(--border-color)' }}></div>
              <button onClick={toggleMute} style={{ background: isMuted ? '#ef4444' : 'transparent', border: 'none', color: isMuted ? '#fff' : 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '4px' }}>
                {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
              <button onClick={leaveCall} style={{ background: '#ef4444', border: 'none', padding: '4px 10px', borderRadius: '6px', color: '#fff', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                End
              </button>
              {/* Invisible audio renderers to keep audio track attached */}
              <div style={{ display: 'none' }}>
                {streams.filter(s => !s.isLocal).map(s => (
                  <MediaRenderer key={s.id} stream={s.stream} type="audio" name={s.name || 'User'} isLocal={false} />
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </>
  );
}

function MediaRenderer({ stream, isLocal, name, type, isPinned, onPin }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (type === 'video' && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, type]);

  if (type === 'audio') return null;

  return (
    <div 
      onClick={onPin}
      style={{ 
        width: isPinned ? '380px' : '220px', 
        aspectRatio: '16/9', 
        background: '#000', 
        borderRadius: '14px', 
        overflow: 'hidden', 
        position: 'relative', 
        border: isPinned ? '2px solid #6366f1' : '1px solid #334155',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isPinned ? '0 20px 25px -5px rgba(0, 0, 0, 0.5)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}
    >
      <video ref={videoRef} autoPlay playsInline muted={isLocal} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: isLocal ? 'scaleX(-1)' : 'none' }} />
      <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.5rem', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500, backdropFilter: 'blur(4px)' }}>
        {name} {isLocal && '(You)'}
      </div>
      {isPinned && (
        <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: '#6366f1', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase' }}>
          Pinned
        </div>
      )}
    </div>
  );
}

function streamTypeDisplay(streams) {
  return streams.length > 0 ? 'grid' : 'none';
}
