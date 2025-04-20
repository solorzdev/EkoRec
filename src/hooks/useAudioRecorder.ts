import { useState, useEffect } from 'react';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import {
  initDatabase, insertRecording, fetchRecordings, deleteRecordingById,
  Recording
} from '../db/recording-db';

const audioPlayer = new AudioRecorderPlayer();

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentPlayingId, setCurrentPlayingId] = useState<number | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);

  useEffect(() => {
    initDatabase();
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    const data = await fetchRecordings();
    setRecordings(data);
  };

  const startRecording = async () => {
    const timestamp = new Date().getTime();
    const path = Platform.select({
      ios: `${RNFS.DocumentDirectoryPath}/audio_${timestamp}.m4a`,
      android: `${RNFS.ExternalDirectoryPath}/audio_${timestamp}.mp4`,
    });

    const uri = await audioPlayer.startRecorder(path!);
    setIsRecording(true);
    return uri;
  };

  const stopRecording = async () => {
    const uri = await audioPlayer.stopRecorder();
    setIsRecording(false);

    const name = `Grabación - ${new Date().toLocaleTimeString()}`;
    const date = new Date().toISOString();
    const cleanedUri = uri.replace(/^file:\/*/, 'file:///');

    await insertRecording(cleanedUri, name, date);
    await loadRecordings();
    return cleanedUri;
  };

  const playRecording = async (uri: string, id: number) => {
    setCurrentPlayingId(id);
    await audioPlayer.startPlayer(uri);
    audioPlayer.addPlayBackListener(e => {
      if (e.current_position >= e.duration) stopPlayback();
    });
  };

  const stopPlayback = async () => {
    await audioPlayer.stopPlayer();
    audioPlayer.removePlayBackListener();
    setCurrentPlayingId(null);
  };

  const deleteRecording = async (id: number, uri: string) => {
    const path = uri.replace('file://', '');
    const exists = await RNFS.exists(path);
    if (exists) await RNFS.unlink(path);

    await deleteRecordingById(id);
    await loadRecordings();
  };

  return {
    isRecording,
    currentPlayingId,
    recordings,
    startRecording,
    stopRecording,
    playRecording,
    stopPlayback,
    deleteRecording
  };
};
