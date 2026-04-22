import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform
} from 'react-native';
import { Audio } from 'expo-av';

const REACTIONS = ['😭', '🔥', '💀', '😱', '🤯', '👏'];

export default function ChatPanel({ messages, sendMessage, sendVoice, sendReaction, users }) {
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(null);
  const [recSeconds, setRecSeconds] = useState(0);
  const [playingId, setPlayingId] = useState(null);
  const recTimer = useRef(null);
  const soundRef = useRef(null);
  const listRef = useRef(null);

  const send = () => {
    if (!text.trim()) return;
    sendMessage(text.trim());
    setText('');
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setRecSeconds(0);
      recTimer.current = setInterval(() => setRecSeconds(s => s + 1), 1000);
    } catch (e) {
      console.warn('خطأ في التسجيل:', e);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    clearInterval(recTimer.current);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    const duration = recSeconds;
    setRecording(null);
    setRecSeconds(0);
    const response = await fetch(uri);
    const blob = await response.blob();
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      sendVoice(base64, duration);
    };
    reader.readAsDataURL(blob);
  };

  const playVoice = useCallback(async (msg) => {
    if (playingId === msg.id) {
      await soundRef.current?.stopAsync();
      setPlayingId(null);
      return;
    }
    if (soundRef.current) await soundRef.current.unloadAsync();
    const uri = `data:audio/m4a;base64,${msg.audioBase64}`;
    const { sound } = await Audio.Sound.createAsync({ uri });
    soundRef.current = sound;
    setPlayingId(msg.id);
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate(status => {
      if (status.didJustFinish) setPlayingId(null);
    });
  }, [playingId]);

  const fmt = (s) => `0:${String(s).padStart(2, '0')}`;

  const renderMsg = ({ item }) => {
    if (item.type === 'system') {
      return <Text style={s.sys}>{item.text}</Text>;
    }
    return (
      <View style={s.msg}>
        <View style={[s.av, { backgroundColor: item.color || '#4c1d95' }]}>
          <Text style={s.avTxt}>{item.avatar}</Text>
        </View>
        <View style={s.msgBody}>
          <View style={s.msgTop}>
            <Text style={[s.name, { color: item.nameColor || '#c4b5fd' }]}>{item.username}</Text>
            <Text style={s.time}>{new Date(item.timestamp).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
          {item.type === 'text' ? (
            <Text style={s.msgTxt}>{item.text}</Text>
          ) : (
            <TouchableOpacity style={s.voiceMsg} onPress={() => playVoice(item)}>
              <View style={s.vplay}>
                <Text style={{ color: '#fff', fontSize: 12 }}>{playingId === item.id ? '⏹' : '▶'}</Text>
              </View>
              <View style={s.waveWrap}>
                {Array.from({ length: 20 }).map((_, i) => (
                  <View key={i} style={[s.wbar, { height: 4 + ((i * 7 + 3) % 16) }]} />
                ))}
              </View>
              <Text style={s.dur}>{fmt(item.duration || 0)}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.wrap}>
      <View style={s.header}>
        <Text style={s.headerTxt}>الدردشة</Text>
        <View style={s.onlinePill}>
          <Text style={s.onlineTxt}>{users.length} متصل</Text>
        </View>
      </View>

      <View style={s.reactions}>
        {REACTIONS.map(e => (
          <TouchableOpacity key={e} style={s.reactionBtn} onPress={() => sendReaction(e)}>
            <Text style={{ fontSize: 20 }}>{e}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        renderItem={renderMsg}
        style={s.list}
        contentContainerStyle={{ padding: 12, gap: 12 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={s.inputArea}>
        <TouchableOpacity
          style={[s.micBtn, recording && s.micRecording]}
          onPress={recording ? stopRecording : startRecording}
        >
          <Text style={{ fontSize: 18 }}>{recording ? '⏹' : '🎙'}</Text>
          <Text style={[s.micTxt, recording && { color: '#f87171' }]}>
            {recording ? `${fmt(recSeconds)} — اضغط للإيقاف` : 'اضغط للتسجيل'}
          </Text>
        </TouchableOpacity>
        <View style={s.textRow}>
          <TextInput
            style={s.input}
            placeholder="اكتب رسالة..."
            placeholderTextColor="rgba(255,255,255,0.2)"
            value={text}
            onChangeText={setText}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <TouchableOpacity style={s.sendBtn} onPress={send}>
            <Text style={{ color: '#fff', fontSize: 16 }}>↑</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0c0c18' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottomWidth: 0.5, borderColor: 'rgba(255,255,255,0.07)' },
  headerTxt: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
  onlinePill: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  onlineTxt: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  reactions: { flexDirection: 'row', padding: 8, gap: 4, borderBottomWidth: 0.5, borderColor: 'rgba(255,255,255,0.05)' },
  reactionBtn: { padding: 4 },
  list: { flex: 1 },
  sys: { textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 11, marginVertical: 4 },
  msg: { flexDirection: 'row', gap: 9 },
  av: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avTxt: { color: '#fff', fontSize: 11, fontWeight: '500' },
  msgBody: { flex: 1 },
  msgTop: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 3 },
  name: { fontSize: 12, fontWeight: '500' },
  time: { fontSize: 10, color: 'rgba(255,255,255,0.25)' },
  msgTxt: { color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 19 },
  voiceMsg: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#16162a', borderRadius: 10, padding: 10, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)' },
  vplay: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' },
  waveWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 22 },
  wbar: { width: 3, borderRadius: 2, backgroundColor: '#a78bfa', opacity: 0.7 },
  dur: { color: 'rgba(255,255,255,0.3)', fontSize: 11 },
  inputArea: { borderTopWidth: 0.5, borderColor: 'rgba(255,255,255,0.07)', padding: 10, gap: 8 },
  micBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#16162a', borderRadius: 10, padding: 10, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)' },
  micRecording: { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' },
  micTxt: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  textRow: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, backgroundColor: '#16162a', borderRadius: 10, padding: 12, color: '#fff', fontSize: 13, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)' },
  sendBtn: { width: 42, height: 42, backgroundColor: '#7c3aed', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
