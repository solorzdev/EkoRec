import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from '../styles/audioStyles';
import { Recording } from '../db/recording-db';

interface Props {
  rec: Recording;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  onDelete: () => void;
}

const RecordingItem = ({ rec, isPlaying, onPlay, onStop, onDelete }: Props) => (
  <View style={styles.card}>
    <Text style={{ fontWeight: 'bold' }}>{rec.name}</Text>
    <Text style={{ fontSize: 12, color: '#888' }}>{new Date(rec.date).toLocaleString()}</Text>

    <View style={{ flexDirection: 'row', marginTop: 10, gap: 10 }}>
      {isPlaying ? (
        <TouchableOpacity style={styles.deleteButton} onPress={onStop}>
          <Text style={styles.deleteText}>⏹️ Detener</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.playButton} onPress={onPlay}>
          <Text style={styles.playText}>▶ Reproducir</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
        <Text style={styles.deleteText}>🗑 Eliminar</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default RecordingItem;
