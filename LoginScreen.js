import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AVATARS = ['أح', 'سم', 'رن', 'كر', 'مح', 'فا', 'عل', 'نو'];
const COLORS = ['#4c1d95', '#064e3b', '#831843', '#78350f', '#1e3a5f', '#3b0764', '#14532d', '#7f1d1d'];

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);

  const join = async () => {
    if (!username.trim()) return Alert.alert('تنبيه', 'اكتب اسمك أولاً');
    if (!roomId.trim()) return Alert.alert('تنبيه', 'اكتب اسم الغرفة');

    setLoading(true);
    const idx = username.charCodeAt(0) % AVATARS.length;
    const userInfo = {
      username: username.trim(),
      avatar: AVATARS[idx],
      color: COLORS[idx],
    };
    await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
    navigation.navigate('Room', { roomId: roomId.trim(), userInfo });
    setLoading(false);
  };

  const createRoom = () => {
    const id = 'room-' + Math.random().toString(36).substr(2, 6);
    setRoomId(id);
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.wrap}>
        <View style={s.center}>
          <Text style={s.logo}>WATCH<Text style={s.logoAccent}>ME</Text></Text>
          <Text style={s.sub}>شاهد الأنمي مع أصحابك</Text>

          <View style={s.card}>
            <Text style={s.label}>اسمك</Text>
            <TextInput
              style={s.input}
              placeholder="مثال: أحمد"
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={username}
              onChangeText={setUsername}
              maxLength={20}
            />

            <Text style={[s.label, { marginTop: 16 }]}>اسم الغرفة</Text>
            <TextInput
              style={s.input}
              placeholder="مثال: anime-night"
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={roomId}
              onChangeText={setRoomId}
              autoCapitalize="none"
            />

            <TouchableOpacity style={s.createBtn} onPress={createRoom}>
              <Text style={s.createTxt}>+ إنشاء غرفة عشوائية</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.joinBtn} onPress={join} disabled={loading}>
              <Text style={s.joinTxt}>{loading ? 'جارٍ الدخول...' : 'دخول الغرفة'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#08080f' },
  wrap: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  logo: { fontSize: 36, fontWeight: '700', color: '#fff', letterSpacing: 2 },
  logoAccent: { color: '#a78bfa' },
  sub: { color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 6, marginBottom: 32 },
  card: { width: '100%', maxWidth: 360, backgroundColor: '#12121f', borderRadius: 20, padding: 24, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)' },
  label: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 8 },
  input: { backgroundColor: '#0d0d1a', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.12)' },
  createBtn: { marginTop: 12, alignItems: 'center', padding: 10 },
  createTxt: { color: '#a78bfa', fontSize: 13 },
  joinBtn: { marginTop: 8, backgroundColor: '#7c3aed', borderRadius: 14, padding: 16, alignItems: 'center' },
  joinTxt: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
