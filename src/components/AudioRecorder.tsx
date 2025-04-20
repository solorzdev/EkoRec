// src/components/AudioRecorder.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Button,
  PermissionsAndroid,
  Platform,
  Text,
  Alert,
  ScrollView,
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import {
  initDatabase,
  insertRecording,
  fetchRecordings,
  deleteRecordingById,
  testConnection,
} from '../db/recording-db';

const audioRecorderPlayer = new AudioRecorderPlayer();

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedURI, setRecordedURI] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordings, setRecordings] = useState<
    { id: number; uri: string; name: string; date: string }[]
  >([]);

  useEffect(() => {
    initDatabase();
    testConnection();
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    try {
      const data = await fetchRecordings();
      console.log('📄 Grabaciones cargadas:', data); // ⬅️ añade esto
      setRecordings(data);
    } catch (err) {
      console.error('Error al cargar grabaciones:', err);
    }
  };
  

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

  const startRecording = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const timestamp = new Date().getTime(); // número único por milisegundos
    const path = Platform.select({
      ios: `${RNFS.DocumentDirectoryPath}/audio_record_${timestamp}.m4a`,
      android: `${RNFS.ExternalDirectoryPath}/audio_record_${timestamp}.mp4`,
    });


    try {
      const uri = await audioRecorderPlayer.startRecorder(path);
      setIsRecording(true);
      setRecordedURI(uri);
    } catch (error) {
      console.error('Error al iniciar grabación:', error);
    }
  };

  const stopRecording = async () => {
    try {
      const uri = await audioRecorderPlayer.stopRecorder();
      setIsRecording(false);
      setRecordedURI(uri);
  
      if (!uri) throw new Error('No se pudo obtener la URI de la grabación');
  
      const name = `Grabación - ${new Date().toLocaleTimeString()}`;
      const date = new Date().toISOString();
  
      console.log('🚀 Detalle de grabación antes de guardar:', { uri, name, date });
  
      const cleanedUri = uri.replace(/^file:\/*/, 'file:///');
      await insertRecording(cleanedUri, name, date);
      await loadRecordings();
    } catch (error) {
      console.error('❌ Error al guardar grabación:', error?.message ?? error);
      Alert.alert('Error', 'No se pudo guardar la grabación');
    }
  };  

  const playRecording = async (uri: string) => {
    try {
      await audioRecorderPlayer.startPlayer(uri);
      setIsPlaying(true);
      audioRecorderPlayer.addPlayBackListener((e) => {
        if (e.current_position >= e.duration) {
          stopPlayback();
        }
      });
    } catch (error) {
      console.error('Error al reproducir:', error);
    }
  };

  const stopPlayback = async () => {
    await audioRecorderPlayer.stopPlayer();
    setIsPlaying(false);
    audioRecorderPlayer.removePlayBackListener();
  };

  const deleteRecording = async (id: number, uri: string) => {
    try {
      const path = uri.replace('file://', '');
      const exists = await RNFS.exists(path);
      if (exists) await RNFS.unlink(path);

      await deleteRecordingById(id);
      await loadRecordings();
    } catch (error) {
      console.error('Error al eliminar grabación:', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Button
        title={isRecording ? 'DETENER GRABACIÓN' : 'INICIAR GRABACIÓN'}
        onPress={isRecording ? stopRecording : startRecording}
        color="#2196F3"
      />

      {recordedURI && (
        <Text style={{ marginTop: 20, fontWeight: 'bold' }}>
          Última grabación guardada:{'\n'}{recordedURI}
        </Text>
      )}

      {recordings.length > 0 && (
        <>
          <Text style={{ marginTop: 30, fontSize: 16, fontWeight: 'bold' }}>
            Historial de grabaciones:
          </Text>
          {recordings.map((rec) => (
            <View
              key={rec.id}
              style={{
                marginTop: 10,
                padding: 10,
                borderWidth: 1,
                borderRadius: 8,
                borderColor: '#ccc',
              }}
            >
              <Text numberOfLines={1} style={{ marginBottom: 5 }}>
                {rec.name}
              </Text>
              <Text style={{ fontSize: 12, color: '#666' }}>
                {new Date(rec.date).toLocaleString()}
              </Text>

              <Button title="Reproducir" onPress={() => playRecording(rec.uri)} color="#4CAF50" />
              <View style={{ height: 5 }} />
              <Button title="Eliminar" onPress={() => deleteRecording(rec.id, rec.uri)} color="#f44336" />
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
};

export default AudioRecorder;
