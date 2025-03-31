import React, { useState } from 'react';
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

const audioRecorderPlayer = new AudioRecorderPlayer();

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedURI, setRecordedURI] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordings, setRecordings] = useState<string[]>([]);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);

      const audioGranted =
        granted['android.permission.RECORD_AUDIO'] ===
        PermissionsAndroid.RESULTS.GRANTED;

      if (!audioGranted) {
        Alert.alert(
          'Permiso requerido',
          'Se necesita permiso para grabar audio.',
          [{ text: 'OK' }],
          { cancelable: false }
        );
        return false;
      }

      return true;
    }

    return true;
  };

  const startRecording = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      console.warn('Permisos no concedidos');
      return;
    }

    const result = await audioRecorderPlayer.startRecorder();
    setIsRecording(true);
    setRecordedURI(result);
  };

  const stopRecording = async () => {
    const result = await audioRecorderPlayer.stopRecorder();
    setIsRecording(false);
    setRecordedURI(result);
    setRecordings((prev) => [...prev, result]); // Agregar al historial
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

  const deleteRecording = (uri: string) => {
    setRecordings((prev) => prev.filter((item) => item !== uri));
    // Si quieres eliminar el archivo físicamente más adelante, podemos usar react-native-fs
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
          Última grabación guardada:
          {'\n'}{recordedURI}
        </Text>
      )}

      {recordings.length > 0 && (
        <>
          <Text style={{ marginTop: 30, fontSize: 16, fontWeight: 'bold' }}>
            Historial de grabaciones:
          </Text>
          {recordings.map((uri, index) => (
            <View
              key={index}
              style={{
                marginTop: 10,
                padding: 10,
                borderWidth: 1,
                borderRadius: 8,
                borderColor: '#ccc',
              }}
            >
              <Text numberOfLines={1} style={{ marginBottom: 5 }}>
                {uri}
              </Text>
              <Button
                title="Reproducir"
                onPress={() => playRecording(uri)}
                color="#4CAF50"
              />
              <View style={{ height: 5 }} />
              <Button
                title="Eliminar"
                onPress={() => deleteRecording(uri)}
                color="#f44336"
              />
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
};

export default AudioRecorder;
