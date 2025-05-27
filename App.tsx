import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Button,
  ActivityIndicator,
  Image,
  StyleSheet,
} from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  Asset,
} from 'react-native-image-picker';
import {initLeishModel, useLeishModel} from './src/tensorflow/tfService';

export default function App() {
  const [ready, setReady] = useState(false);
  const {state, model} = useLeishModel();
  const [output, setOutput] = useState<any>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Al montar, inicializa el modelo
  useEffect(() => {
    initLeishModel()
      .then(() => setReady(true))
      .catch(err => console.error('Error loading model:', err));
  }, []);

  // Dispara la cámara nativa
  const takePhoto = async () => {
    const res = await launchCamera({mediaType: 'photo'});
    handleImageResponse(res.assets);
  };

  // Abre galería
  const pickFromGallery = async () => {
    const res = await launchImageLibrary({mediaType: 'photo'});
    handleImageResponse(res.assets);
  };

  // Guarda la URI y corre inferencia
  const handleImageResponse = async (assets?: Asset[]) => {
    if (!assets?.length || assets[0].uri == null) return;
    const uri = assets[0].uri;
    setPhotoUri(uri);

    if (state === 'loaded' && model) {
      try {
        // Leemos el archivo como ArrayBuffer
        const response = await fetch(uri);
        const buffer = await response.arrayBuffer();
        const input = new Uint8Array(buffer);

        const res = await model.run(input);
        setOutput(res);
      } catch (e) {
        console.error('Inference error:', e);
      }
    }
  };

  // Loader mientras el modelo no esté listo
  if (!ready || state !== 'loaded') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Cargando modelo…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.buttons}>
        <Button title="Tomar Foto" onPress={takePhoto} />
        <Button title="Seleccionar Imagen" onPress={pickFromGallery} />
      </View>

      {photoUri && <Image source={{uri: photoUri}} style={styles.preview} />}

      <Button
        title="Ejecutar Inferencia"
        onPress={() => {
          /* ya corre al cargar */
        }}
      />

      {output && (
        <View style={styles.output}>
          <Text>Resultado:</Text>
          <Text>{JSON.stringify(output)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  container: {flex: 1, padding: 16},
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  preview: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginBottom: 16,
  },
  output: {
    marginTop: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
});
