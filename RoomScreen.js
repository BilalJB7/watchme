import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import VideoPlayer from '../components/VideoPlayer';
import ChatPanel from '../components/ChatPanel';
import { useSocket } from '../hooks/useSocket';

export default function RoomScreen({ route }) {
  const { roomId, userInfo } = route.params;
  const {
    connected, users, messages, videoState, isHost, reactions,
    setVideo, play, pause, seek, sendMessage, sendVoice, sendReaction,
  } = useSocket(roomId, userInfo);

  const avatarColors = ['#4c1d95','#064e3b','#831843','#78350f','#1e3a5f','#3b0764'];

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#08080f" />

      <View style={s.nav}>
        <Text style={s.logo}>WATCH<Text style={s.accent}>ME</Text></Text>
        <Text style={s.roomName}>{roomId}</Text>
        <View style={s.navRight}>
          <View style={[s.dot, { backgroundColor: connected ? '#4ade80' : '#ef4444' }]} />
          <View style={s.avatars}>
            {users.slice(0, 4).map((u, i) => (
              <View key={u.id} style={[s.av, { backgroundColor: avatarColors[i % avatarColors.length], zIndex: 10 - i, marginLeft: i > 0 ? -8 : 0 }]}>
                <Text style={s.avTxt}>{u.avatar || u.username[0]}</Text>
              </View>
            ))}
            {users.length > 4 && (
              <View style={[s.av, { backgroundColor: '#1e1e35', marginLeft: -8 }]}>
                <Text style={s.avTxt}>+{users.length - 4}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={s.body}>
        <VideoPlayer
          videoState={videoState}
          isHost={isHost}
          onPlay={play}
          onPause={pause}
          onSeek={seek}
          onSetVideo={setVideo}
        />
        <View style={s.chatWrap}>
          <ChatPanel
            messages={messages}
            sendMessage={sendMessage}
            sendVoice={sendVoice}
            sendReaction={sendReaction}
            users={users}
          />
        </View>
      </View>

      {reactions.length > 0 && (
        <View style={s.reactionsOverlay} pointerEvents="none">
          {reactions.map(r => (
            <Text key={r.id} style={s.floatingReaction}>{r.emoji}</Text>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#08080f' },
  nav: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderBottomWidth: 0.5, borderColor: 'rgba(255,255,255,0.07)', gap: 10 },
  logo: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 1 },
  accent: { color: '#a78bfa' },
  roomName: { fontSize: 12, color: 'rgba(255,255,255,0.35)', backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)' },
  navRight: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  avatars: { flexDirection: 'row' },
  av: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#08080f' },
  avTxt: { color: '#fff', fontSize: 9, fontWeight: '600' },
  body: { flex: 1 },
  chatWrap: { flex: 1 },
  reactionsOverlay: { position: 'absolute', bottom: 120, right: 16, gap: 8, alignItems: 'flex-end' },
  floatingReaction: { fontSize: 32 },
});
