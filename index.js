const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const rooms = {};

function getRoom(roomId) {
  if (!rooms[roomId]) {
    rooms[roomId] = {
      id: roomId,
      users: {},
      videoUrl: '',
      currentTime: 0,
      isPlaying: false,
      hostId: null,
    };
  }
  return rooms[roomId];
}

io.on('connection', (socket) => {
  console.log('✅ مستخدم متصل:', socket.id);

  socket.on('join_room', ({ roomId, username, avatar }) => {
    socket.join(roomId);
    const room = getRoom(roomId);
    room.users[socket.id] = { id: socket.id, username, avatar };
    if (!room.hostId) room.hostId = socket.id;
    socket.data.roomId = roomId;
    socket.data.username = username;

    socket.emit('room_state', {
      videoUrl: room.videoUrl,
      currentTime: room.currentTime,
      isPlaying: room.isPlaying,
      users: Object.values(room.users),
      isHost: room.hostId === socket.id,
    });

    socket.to(roomId).emit('user_joined', {
      user: room.users[socket.id],
      users: Object.values(room.users),
    });

    console.log(`👥 ${username} دخل الغرفة ${roomId}`);
  });

  socket.on('set_video', ({ roomId, url }) => {
    const room = getRoom(roomId);
    room.videoUrl = url;
    room.currentTime = 0;
    room.isPlaying = false;
    io.to(roomId).emit('video_changed', { url, currentTime: 0 });
  });

  socket.on('play', ({ roomId, currentTime }) => {
    const room = getRoom(roomId);
    room.isPlaying = true;
    room.currentTime = currentTime;
    socket.to(roomId).emit('sync_play', { currentTime });
  });

  socket.on('pause', ({ roomId, currentTime }) => {
    const room = getRoom(roomId);
    room.isPlaying = false;
    room.currentTime = currentTime;
    socket.to(roomId).emit('sync_pause', { currentTime });
  });

  socket.on('seek', ({ roomId, currentTime }) => {
    const room = getRoom(roomId);
    room.currentTime = currentTime;
    socket.to(roomId).emit('sync_seek', { currentTime });
  });

  socket.on('send_message', ({ roomId, message }) => {
    const room = getRoom(roomId);
    const user = room.users[socket.id];
    const msg = {
      id: Date.now().toString(),
      type: 'text',
      text: message,
      username: user?.username || 'مجهول',
      avatar: user?.avatar || '؟',
      timestamp: new Date().toISOString(),
    };
    io.to(roomId).emit('new_message', msg);
  });

  socket.on('send_voice', ({ roomId, audioBase64, duration }) => {
    const room = getRoom(roomId);
    const user = room.users[socket.id];
    const msg = {
      id: Date.now().toString(),
      type: 'voice',
      audioBase64,
      duration,
      username: user?.username || 'مجهول',
      avatar: user?.avatar || '؟',
      timestamp: new Date().toISOString(),
    };
    io.to(roomId).emit('new_message', msg);
  });

  socket.on('send_reaction', ({ roomId, emoji }) => {
    const room = getRoom(roomId);
    const user = room.users[socket.id];
    io.to(roomId).emit('new_reaction', {
      emoji,
      username: user?.username,
    });
  });

  socket.on('disconnect', () => {
    const { roomId, username } = socket.data;
    if (roomId && rooms[roomId]) {
      delete rooms[roomId].users[socket.id];
      if (rooms[roomId].hostId === socket.id) {
        const remaining = Object.keys(rooms[roomId].users);
        rooms[roomId].hostId = remaining[0] || null;
      }
      io.to(roomId).emit('user_left', {
        userId: socket.id,
        username,
        users: Object.values(rooms[roomId].users),
      });
      if (Object.keys(rooms[roomId].users).length === 0) {
        delete rooms[roomId];
      }
    }
    console.log('❌ مستخدم غادر:', socket.id);
  });
});

app.get('/rooms', (req, res) => {
  const list = Object.values(rooms).map(r => ({
    id: r.id,
    userCount: Object.keys(r.users).length,
    videoUrl: r.videoUrl,
    isPlaying: r.isPlaying,
  }));
  res.json(list);
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 WATCH ME Server يعمل على http://localhost:${PORT}`);
});
