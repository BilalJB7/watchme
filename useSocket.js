import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3001';

export function useSocket(roomId, userInfo) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [videoState, setVideoState] = useState({
    url: '',
    currentTime: 0,
    isPlaying: false,
  });
  const [isHost, setIsHost] = useState(false);
  const [reactions, setReactions] = useState([]);

  useEffect(() => {
    if (!roomId || !userInfo) return;

    const socket = io(SERVER_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_room', {
        roomId,
        username: userInfo.username,
        avatar: userInfo.avatar,
      });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('room_state', (state) => {
      setUsers(state.users);
      setIsHost(state.isHost);
      setVideoState({
        url: state.videoUrl,
        currentTime: state.currentTime,
        isPlaying: state.isPlaying,
      });
    });

    socket.on('user_joined', ({ users }) => setUsers(users));
    socket.on('user_left', ({ users }) => setUsers(users));

    socket.on('video_changed', ({ url, currentTime }) => {
      setVideoState(prev => ({ ...prev, url, currentTime, isPlaying: false }));
    });

    socket.on('sync_play', ({ currentTime }) => {
      setVideoState(prev => ({ ...prev, isPlaying: true, currentTime }));
    });

    socket.on('sync_pause', ({ currentTime }) => {
      setVideoState(prev => ({ ...prev, isPlaying: false, currentTime }));
    });

    socket.on('sync_seek', ({ currentTime }) => {
      setVideoState(prev => ({ ...prev, currentTime }));
    });

    socket.on('new_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('new_reaction', (reaction) => {
      const id = Date.now();
      setReactions(prev => [...prev, { ...reaction, id }]);
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== id));
      }, 3000);
    });

    return () => socket.disconnect();
  }, [roomId, userInfo?.username]);

  const setVideo = useCallback((url) => {
    socketRef.current?.emit('set_video', { roomId, url });
  }, [roomId]);

  const play = useCallback((currentTime) => {
    socketRef.current?.emit('play', { roomId, currentTime });
  }, [roomId]);

  const pause = useCallback((currentTime) => {
    socketRef.current?.emit('pause', { roomId, currentTime });
  }, [roomId]);

  const seek = useCallback((currentTime) => {
    socketRef.current?.emit('seek', { roomId, currentTime });
  }, [roomId]);

  const sendMessage = useCallback((text) => {
    socketRef.current?.emit('send_message', { roomId, message: text });
  }, [roomId]);

  const sendVoice = useCallback((audioBase64, duration) => {
    socketRef.current?.emit('send_voice', { roomId, audioBase64, duration });
  }, [roomId]);

  const sendReaction = useCallback((emoji) => {
    socketRef.current?.emit('send_reaction', { roomId, emoji });
  }, [roomId]);

  return {
    connected, users, messages, videoState,
    isHost, reactions,
    setVideo, play, pause, seek,
    sendMessage, sendVoice, sendReaction,
  };
}
