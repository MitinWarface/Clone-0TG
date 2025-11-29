import React, { useRef, useEffect, useState } from 'react';
import Peer from 'simple-peer';
import { useChat } from '../ChatContext';

const Call = ({ callUserId }) => {
  const { socket } = useChat();
  const [stream, setStream] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState('');
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      setStream(stream);
      if (myVideo.current) {
        myVideo.current.srcObject = stream;
      }
    });

    socket.on('callUser', (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
    });

    socket.on('callAccepted', (signal) => {
      setCallAccepted(true);
      connectionRef.current.signal(signal);
    });

    return () => {
      socket.off('callUser');
      socket.off('callAccepted');
    };
  }, [socket]);

  const callUser = () => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on('signal', (data) => {
      socket.emit('callUser', {
        userToCall: callUserId,
        signalData: data,
      });
    });

    peer.on('stream', (stream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }
    });

    connectionRef.current = peer;
  };

  const answerCall = () => {
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });

    peer.on('signal', (data) => {
      socket.emit('answerCall', { signal: data, to: caller });
    });

    peer.on('stream', (stream) => {
      userVideo.current.srcObject = stream;
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);
    connectionRef.current.destroy();
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        {stream && <video playsInline muted ref={myVideo} autoPlay style={{ width: '140px', borderRadius: '10px' }} />}
        {callAccepted && !callEnded && <video playsInline ref={userVideo} autoPlay style={{ width: '140px', borderRadius: '10px' }} />}
      </div>
      <div>
        {receivingCall && !callAccepted && (
          <div>
            <h3 style={{ color: '#ffffff', marginBottom: '10px' }}>{caller} звонит...</h3>
            <button onClick={answerCall}>Ответить</button>
          </div>
        )}
        {!receivingCall && !callAccepted && <button onClick={callUser}>Позвонить</button>}
        {callAccepted && <button className="danger" onClick={leaveCall}>Завершить звонок</button>}
      </div>
    </div>
  );
};

export default Call;