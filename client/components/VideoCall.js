'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneCall, PhoneOff, PhoneIncoming, Check, X, Users, Headphones } from 'lucide-react';

export default function VideoCall({ socket, roomId, username, users }) {
  const [inCall, setInCall] = useState(false);
  const [callType, setCallType] = useState(null); 
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
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
      socket.emit('signal', { to: userId, signal: { type: 'offer', sdp: offer } });
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
        
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('signal', { to: from, signal: { type: 'answer', sdp: answer } });
      } else if (signal.type === 'answer') {
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
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
      const audioEl = document.getElementById(`audio-${userId}`);
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
      console.log(`Received track from ${userId}`);
      setStreams(prev => {
        if (prev.find(s => s.id === userId)) return prev;
        return [...prev, { id: userId, stream: event.streams[0], isLocal: false }];
      });
      
      const stream = event.streams[0];
      if (stream.getAudioTracks().length > 0) {
        playAudioStream(userId, stream);
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    return pc;
  };

  const playAudioStream = (id, stream) => {
    let audio = document.getElementById(`audio-${id}`);
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = `audio-${id}`;
      audio.autoplay = true;
      document.body.appendChild(audio);
    }
    audio.srcObject = stream;
  };

  const processPendingSignals = async (userId) => {
    if (pendingSignals.current[userId]) {
      for (const signal of pendingSignals.current[userId]) {
        await handleSignal({ from: userId, signal });
      }
      delete pendingSignals.current[userId];
    }
  };

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
    document.querySelectorAll('audio[id^="audio-"]').forEach(el => el.remove());
    socket.emit('user-left', socket.id); // Notify others via server
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

      {inCall && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: streams.length > 2 ? 'repeat(2, 1fr)' : '1fr',
            gap: '0.5rem', 
            maxWidth: '500px'
          }}>
            {streams.map(s => (
              <VideoRenderer 
                key={s.id} 
                stream={s.stream} 
                isLocal={s.isLocal} 
                name={s.isLocal ? 'You' : (users.find(u => u.id === s.id)?.username || 'User')} 
              />
            ))}
          </div>
          
          <div style={{ 
            background: 'rgba(15, 23, 42, 0.9)', padding: '0.75rem 1.5rem', borderRadius: '99px',
            display: 'flex', gap: '1rem', border: '1px solid #334155', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <button onClick={toggleMute} style={{ background: isMuted ? '#ef4444' : 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>{isMuted ? <MicOff size={20} /> : <Mic size={20} />}</button>
            <button onClick={toggleVideo} style={{ background: isVideoOff ? '#ef4444' : 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>{isVideoOff ? <VideoOff size={20} /> : <VideoIcon size={20} />}</button>
            <div style={{ width: '1px', background: '#334155' }}></div>
            <button onClick={leaveCall} style={{ background: '#ef4444', border: 'none', padding: '0.2rem 1rem', borderRadius: '99px', color: '#fff', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>Leave</button>
          </div>
        </div>
      )}

      {!inCall && (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => startCall('audio')} style={{ background: 'transparent', border: '1px solid #e2e8f0', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
            <Headphones size={14} /> Audio Call
          </button>
          <button onClick={() => startCall('video')} style={{ background: 'transparent', border: '1px solid #e2e8f0', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
            <VideoIcon size={14} /> Video Call
          </button>
        </div>
      )}
    </>
  );
}

function VideoRenderer({ stream, isLocal, name }) {
  const videoRef = useRef(null);
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <div style={{ width: '220px', aspectRatio: '16/9', background: '#000', borderRadius: '8px', overflow: 'hidden', position: 'relative', border: '1px solid #334155' }}>
      <video ref={videoRef} autoPlay playsInline muted={isLocal} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: isLocal ? 'scaleX(-1)' : 'none' }} />
      <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.5rem', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem' }}>{name}</div>
    </div>
  );
}
