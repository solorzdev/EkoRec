// src/components/AudioRecorder.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Alert,
  ScrollView,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import styles from '../styles/audioStyles';
import RecordingItem from './RecordingItem';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AudioRecorder = () => {
  const {
    isRecording,
    recordings,
    currentPlayingId,
    startRecording,
    stopRecording,
    playRecording,
    stopPlayback,
    deleteRecording
  } = useAudioRecorder();

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      ]);

      const audioGranted =
        granted['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED;

      if (!audioGranted) {
        Alert.alert('Permiso requerido', 'Se necesita permiso para grabar audio.');
        return false;
      }
      return true;
    }
    return true;
  };

  const handleRecordingPress = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    isRecording ? await stopRecording() : await startRecording();
  };

  const confirmDelete = (id: number, uri: string, name: string) => {
    Alert.alert(
      '¿Eliminar grabación?',
      `¿Estás seguro de que quieres eliminar "${name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', onPress: () => deleteRecording(id, uri), style: 'destructive' },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎙 Mis Grabaciones</Text>
      </View>

      <TouchableOpacity
        style={[styles.recordButton, isRecording && styles.recording]}
        onPress={handleRecordingPress}
      >
        <Text style={styles.recordText}>{isRecording ? '⏹️' : '🎤'}</Text>
      </TouchableOpacity>

      {recordings.length === 0 && (
        <Text style={styles.emptyMessage}>
          No hay grabaciones aún. Presiona el botón para grabar tu primera nota.
        </Text>
      )}

      {recordings.map((rec) => (
        <RecordingItem
          key={rec.id}
          rec={rec}
          isPlaying={rec.id === currentPlayingId}
          onPlay={() => playRecording(rec.uri, rec.id)}
          onStop={stopPlayback}
          onDelete={() => confirmDelete(rec.id, rec.uri, rec.name)}
        />
      ))}
    </ScrollView>
  );
};

export default AudioRecorder;