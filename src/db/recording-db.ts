// src/db/recording-db.ts
import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(false);
SQLite.DEBUG(true);

export const db = SQLite.openDatabase(
  { name: 'recordings.db', location: 'default' },
  () => console.log('✅ BD abierta'),
  error => console.error('❌ Error al abrir BD:', error)
);

export const initDatabase = () => {
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS recordings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uri TEXT NOT NULL,
        name TEXT,
        date TEXT
      )`,
      [],
      () => console.log('📦 Tabla creada'),
      (_, error) => {
        console.error('❌ Error al crear tabla:', error);
        return false;
      }
    );
  });
};

export const insertRecording = (uri: string, name: string, date: string) => {
  const cleanedUri = uri.replace(/^file:\/*/, 'file:///');

  console.log('📥 Intentando insertar en BD (valores):', {
    cleanedUri,
    typeUri: typeof cleanedUri,
    name,
    typeName: typeof name,
    date,
    typeDate: typeof date,
  });

  return new Promise<void>((resolve, reject) => {
    try {
      db.transaction(tx => {
        // Verificar si ya existe esta URI
        tx.executeSql(
          'SELECT id FROM recordings WHERE uri = ?',
          [cleanedUri],
          (_, result) => {
            if (result.rows.length > 0) {
              console.log('⚠️ Ya existe esta grabación, no se insertará duplicado.');
              resolve();
              return;
            }

            // Si no existe, insertar
            tx.executeSql(
              'INSERT INTO recordings (uri, name, date) VALUES (?, ?, ?)',
              [cleanedUri, name, date],
              () => {
                console.log('✅ Grabación insertada en BD');
                resolve();
              },
              (_, error) => {
                console.error('❌ Error al insertar en SQLite:', error ?? 'error desconocido');
                reject(error ?? new Error('Error desconocido al insertar en SQLite'));
                return false;
              }
            );
          },
          (_, err) => {
            console.error('❌ Error al verificar duplicado en BD:', err);
            reject(err);
            return false;
          }
        );
      });
    } catch (outerError) {
      console.error('❌ Error externo al insertar en BD:', outerError);
      reject(outerError);
    }
  });
};

export const fetchRecordings = (): Promise<
  { id: number; uri: string; name: string; date: string }[]
> => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM recordings ORDER BY id DESC',
        [],
        (_, result) => {
          const rows = result.rows;
          const data = [];
          for (let i = 0; i < rows.length; i++) {
            data.push(rows.item(i));
          }
          resolve(data);
        },
        (_, error) => {
          console.error('❌ Error al obtener grabaciones:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const deleteRecordingById = (id: number) => {
  return new Promise<void>((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM recordings WHERE id = ?',
        [id],
        () => resolve(),
        (_, error) => {
          console.error('❌ Error al eliminar grabación:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const testConnection = () => {
  db.transaction(tx => {
    tx.executeSql(
      'SELECT 1',
      [],
      () => console.log('✅ SQLite conectado'),
      (_, err) => {
        console.error('❌ SQLite NO FUNCIONA:', err);
        return false;
      }
    );
  });
};