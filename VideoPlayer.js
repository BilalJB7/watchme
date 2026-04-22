import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Dimensions } from 'react-native';
import Video from 'react-native-video';

const { width } = Dimensions.get('window');

export default function VideoPlayer({ videoState, isHost, onPlay, onPause, onSeek, onSetVideo }) {
  const videoRef = useRef(null);
  const [urlInput, setUrlInput] = useState('');
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [paused, setPaused] = useState(true);
  const isSeeking = useRef(false);

  useEffect(() => {
    if (!isSeeking.current) {
      setPaused(!videoState.isPlaying);
      if (Math.abs(currentTime - videoState.currentTime) > 2) {
        videoRef.current?.seek(videoState.currentTime);
      }
    }
  }, [videoState]);

  const handlePlay = () => {
    setPaused(false);
    onPlay(currentTime);
  };

  const handlePause = () => {
    setPaused(true);
    onPause(currentTime);
  };

  const handleProgress = ({ currentTime: ct }) => {
    setCurrentTime(ct);
  };

  const handleLoad = ({ duration: d }) => {
    setDuration(d);
    videoRef.current?.seek(videoState.currentTime || 0);
  };

  const seekTo = (ratio) => {
    const time = ratio * duration;
    isSeeking.current = true;
    videoRef.current?.seek(time);
    onSeek(time);
    setTimeout(() => { isSeeking.current = false; }, 500);
  };

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const loadUrl = () => {
    if (urlInput.trim()) {
      onSetVideo(urlInput.trim());
      setUrlInput('');
    }
  };

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <View style={s.wrap}>
      <View style={s.videoBox}>
        {videoState.url ? (
          <Video
            ref={videoRef}
            source={{ uri: videoState.url }}
            style={s.video}
            paused={paused}
            onProgress={handleProgress}
            onLoad={handleLoad}
            resizeMode="contain"
            controls={false}
          />
        ) : (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>▶</Text>
            <Text style={s.emptyTxt}>الصق رابط الأنمي للبدء</Text>
          </View>
        )}

        <View style={s.syncBadge}>
          <View style={s.syncDot} />
          <Text style={s.syncTxt}>متزامن</Text>
        </View>
      </View>

      <View style={s.urlRow}>
        <TextInput
          style={s.urlInput}
          placeholder="رابط الفيديو (mp4, m3u8, gogoanime...)"
          placeholderTextColor="rgba(255,255,255,0.25)"
          value={urlInput}
          onChangeText={setUrlInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity style={s.goBtn} onPress={loadUrl}>
          <Text style={s.goTxt}>تشغيل</Text>
        </TouchableOpacity>
      </View>

      <View style={s.controls}>
        <View style={s.progRow}>
          <Text style={s.time}>{fmt(currentTime)}</Text>
          <TouchableOpacity
            style={s.prog}
            onPress={(e) => {
              const ratio = e.nativeEvent.locationX / (width - 80);
              seekTo(Math.max(0, Math.min(1, ratio)));
            }}
          >
            <View style={s.progBg}>
              <View style={[s.progFill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
          </TouchableOpacity>
          <Text style={s.time}>{fmt(duration)}</Text>
        </View>

        <View style={s.btns}>
          <TouchableOpacity style={s.cb} onPress={() => seekTo(Math.max(0, (currentTime - 10) / duration))}>
            <Text style={s.cbTxt}>⏪</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.cb, s.mainBtn]} onPress={paused ? handlePlay : handlePause}>
            <Text style={[s.cbTxt, { color: '#fff', fontSize: 18 }]}>{paused ? '▶' : '⏸'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.cb} onPress={() => seekTo(Math.min(1, (currentTime + 10) / duration))}>
            <Text style={s.cbTxt}>⏩</Text>
          </TouchableOpacity>
          {isHost && (
            <View style={s.hostBadge}>
              <Text style={s.hostTxt}>Host</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { backgroundColor: '#08080f' },
  videoBox: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', position: 'relative' },
  video: { width: '100%', height: '100%' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyIcon: { fontSize: 40, color: '#a78bfa' },
  emptyTxt: { color: 'rgba(255,255,255,0.3)', fontSize: 13 },
  syncBadge: { position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(74,222,128,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 0.5, borderColor: 'rgba(74,222,128,0.35)' },
  syncDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  syncTxt: { color: '#4ade80', fontSize: 11 },
  urlRow: { flexDirection: 'row', gap: 8, padding: 10, backgroundColor: '#0e0e1a', borderTopWidth: 0.5, borderColor: 'rgba(255,255,255,0.06)' },
  urlInput: { flex: 1, backgroundColor: '#16162a', borderRadius: 10, padding: 10, color: 'rgba(255,255,255,0.8)', fontSize: 12, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)' },
  goBtn: { backgroundColor: '#7c3aed', borderRadius: 10, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  goTxt: { color: '#fff', fontSize: 13, fontWeight: '500' },
  controls: { padding: 10, backgroundColor: '#0e0e1a', borderTopWidth: 0.5, borderColor: 'rgba(255,255,255,0.05)', gap: 10 },
  progRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  time: { color: 'rgba(255,255,255,0.35)', fontSize: 11, minWidth: 36 },
  prog: { flex: 1, height: 20, justifyContent: 'center' },
  progBg: { height: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
  progFill: { height: '100%', backgroundColor: '#a78bfa', borderRadius: 2 },
  btns: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cb: { width: 36, height: 36, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)' },
  cbTxt: { color: 'rgba(255,255,255,0.7)', fontSize: 15 },
  mainBtn: { backgroundColor: '#7c3aed', borderColor: '#a78bfa', width: 42, height: 42, borderRadius: 12 },
  hostBadge: { marginLeft: 'auto', backgroundColor: 'rgba(167,139,250,0.15)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 0.5, borderColor: 'rgba(167,139,250,0.3)' },
  hostTxt: { color: '#a78bfa', fontSize: 11 },
});
