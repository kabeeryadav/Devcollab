'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneCall, PhoneOff, PhoneIncoming, Check, X, Users, Headphones } from 'lucide-react';

export default function VideoCall({ socket, roomId, username }) {
  const [inCall, setInCall] = useState(false);
  const [callType, setCallType] = useState(null); // 'audio' | 'video'
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [streams, setStreams] = useState([]); // Array of { id, stream, isLocal }
  
  const localStreamRef = useRef(null);
  const peersRef = useRef({});

  const configuration = { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }] };

  useEffect(() => {
    if (!socket) return;

    const handleUserJoinedVoice = async (userId) => {
      if (!inCall || !localStreamRef.current) return;
      const peerConnection = createPeerConnection(userId);
      peersRef.current[userId] = peerConnection;

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit('signal', { to: userId, signal: { type: 'offer', sdp: offer } });
    };

    const handleSignal = async ({ from, signal }) => {
      if (!inCall || !localStreamRef.current) return;
      let peerConnection = peersRef.current[from];

      if (signal.type === 'offer') {
        if (!peerConnection) {
           peerConnection = createPeerConnection(from);
           peersRef.current[from] = peerConnection;
        }
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('signal', { to: from, signal: { type: 'answer', sdp: answer } });
      } else if (signal.type === 'answer') {
        if (peerConnection) {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        }
      } else if (signal.type === 'ice-candidate') {
        if (peerConnection) {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (e) {
            console.error('Error adding ice candidate', e);
          }
        }
      }
    };

    const handleIncomingCall = ({ callerId, callerName, type }) => {
      if (!inCall) {
        setIncomingCall({ callerId, callerName, type });
      }
    };

    const handleUserLeft = (userId) => {
      if (peersRef.current[userId]) {
        peersRef.current[userId].close();
        delete peersRef.current[userId];
      }
      setStreams(prev => prev.filter(s => s.id !== userId));
    };

    socket.on('user-joined-voice', handleUserJoinedVoice);
    socket.on('signal', handleSignal);
    socket.on('incoming-call', handleIncomingCall);
    socket.on('user-left', handleUserLeft);

    return () => {
      socket.off('user-joined-voice', handleUserJoinedVoice);
      socket.off('signal', handleSignal);
      socket.off('incoming-call', handleIncomingCall);
      socket.off('user-left', handleUserLeft);
    };
  }, [socket, inCall]);

  const createPeerConnection = (userId) => {
    const pc = new RTCPeerConnection(configuration);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('signal', { to: userId, signal: { type: 'ice-candidate', candidate: event.candidate } });
      }
    };

    pc.ontrack = (event) => {
      setStreams(prev => {
        if (prev.find(s => s.id === userId)) return prev;
        return [...prev, { id: userId, stream: event.streams[0], isLocal: false }];
      });
      // Always play audio (if any) to ensure we hear them even if we don't render video grid
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

  const startCall = async (type) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: type === 'video', audio: true });
      localStreamRef.current = stream;
      setStreams([{ id: socket?.id || 'local', stream, isLocal: true }]);
      setCallType(type);
      setInCall(true);
      if (socket) {
        socket.emit('start-call', { roomId, username, type });
        socket.emit('join-voice', roomId);
      }
    } catch (err) {
      alert("Could not access camera/microphone.");
    }
  };

  const acceptCall = async () => {
    const type = incomingCall.type;
    setIncomingCall(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: type === 'video', audio: true });
      localStreamRef.current = stream;
      setStreams([{ id: socket?.id || 'local', stream, isLocal: true }]);
      setCallType(type);
      setInCall(true);
      if (socket) {
        socket.emit('join-voice', roomId);
      }
    } catch (err) {
      alert("Could not access camera/microphone.");
    }
  };

  const declineCall = () => {
    setIncomingCall(null);
  };

  const leaveCall = () => {
    setInCall(false);
    setCallType(null);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    Object.values(peersRef.current).forEach(pc => pc.close());
    peersRef.current = {};
    setStreams([]);
    document.querySelectorAll('audio[id^="audio-"]').forEach(el => el.remove());
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  return (
    <>
      {incomingCall && (
        <div style={{ position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)', background: 'var(--panel-bg)', padding: '1rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 1000, animation: 'slideDown 0.3s ease-out' }}>
          <div style={{ background: 'var(--primary-color)', color: '#fff', padding: '0.5rem', borderRadius: '50%', display: 'flex', animation: 'pulse 1.5s infinite' }}>
            {incomingCall.type === 'video' ? <VideoIcon size={20} /> : <PhoneIncoming size={20} />}
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Incoming {incomingCall.type === 'video' ? 'Video' : 'Audio'} Call</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{incomingCall.callerName} is calling the group...</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
            <button onClick={declineCall} className="btn btn-danger" style={{ padding: '0.4rem', borderRadius: '50%', display: 'flex' }} title="Decline">
              <X size={16} />
            </button>
            <button onClick={acceptCall} className="btn" style={{ background: 'var(--success)', color: '#fff', padding: '0.4rem', borderRadius: '50%', display: 'flex', border: 'none' }} title="Accept">
              {incomingCall.type === 'video' ? <VideoIcon size={16} /> : <PhoneCall size={16} />}
            </button>
          </div>
        </div>
      )}

      {/* Floating Video Grid for Video Calls */}
      {inCall && callType === 'video' && (
        <div className="video-grid-floating" style={{ 
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 900,
          background: 'rgba(20, 20, 20, 0.7)', backdropFilter: 'blur(10px)',
          padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '300px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={16} /> Team Video ({streams.length})
            </h4>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: streams.length > 1 ? '1fr 1fr' : '1fr', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
            {streams.map((streamObj) => (
              <VideoRenderer key={streamObj.id} stream={streamObj.stream} isLocal={streamObj.isLocal} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button onClick={toggleMute} className="btn" style={{ background: isMuted ? 'var(--danger)' : '#333', color: '#fff', border: 'none', padding: '0.5rem', borderRadius: '50%' }}>
              {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <button onClick={toggleVideo} className="btn" style={{ background: isVideoOff ? 'var(--danger)' : '#333', color: '#fff', border: 'none', padding: '0.5rem', borderRadius: '50%' }}>
              {isVideoOff ? <VideoOff size={18} /> : <VideoIcon size={18} />}
            </button>
            <button onClick={leaveCall} className="btn btn-danger" style={{ padding: '0.5rem 1rem', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PhoneOff size={16} /> Leave
            </button>
          </div>
        </div>
      )}

      {/* Header Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {!inCall ? (
          <>
            <button onClick={() => startCall('audio')} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
              <Headphones size={16} /> Audio Call
            </button>
            <button onClick={() => startCall('video')} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
              <VideoIcon size={16} /> Video Call
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', animation: 'pulse 1.5s infinite' }}></span> {callType === 'video' ? 'Video' : 'Audio'} Live ({streams.length})
            </span>
            {callType === 'audio' && (
              <>
                <button onClick={toggleMute} className="btn" style={{ background: isMuted ? 'var(--danger)' : 'var(--panel-bg)', color: isMuted ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.4rem', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
                <button onClick={leaveCall} className="btn btn-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                  <PhoneOff size={16} /> Leave
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function VideoRenderer({ stream, isLocal }) {
  const videoRef = useRef(null);
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);
  return (
    <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', background: '#000', aspectRatio: '4/3' }}>
      <video ref={videoRef} autoPlay playsInline muted={isLocal} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: isLocal ? 'scaleX(-1)' : 'none' }} />
      {isLocal && <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px' }}>You</div>}
    </div>
  );
}
