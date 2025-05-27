// src/screens/CameraScreen.tsx
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Button,
  Image,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import RNFS from 'react-native-fs';
import jpeg from 'jpeg-js';
import {Buffer} from 'buffer';
import {useLeishModel} from '../tensorflow/tfService';

const TARGET = 224;

export default function CameraScreen() {
  const {state, model} = useLeishModel();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [probability, setProbability] = useState<number | null>(null);

  useEffect(() => {
    if (state === 'loaded' && model) {
      console.log('Model inputs:', model.inputs);
      console.log('Model outputs:', model.outputs);
    }
  }, [state, model]);

  const pickAndInfer = async () => {
    if (state !== 'loaded' || !model) {
      return;
    }

    try {
      // 1️⃣ Seleccionar y recortar un square EXACTO de tamaño TARGET
      const img = await ImagePicker.openPicker({
        width: TARGET,
        height: TARGET,
        cropping: true,
        compressImageQuality: 1,
        mediaType: 'photo',
      });
      const uri = img.path;
      setPhotoUri(uri);

      // 2️⃣ Leer el JPEG recortado como Base64
      const path = Platform.OS === 'android' ? uri : uri.replace('file://', '');
      const b64 = await RNFS.readFile(path, 'base64');

      // 3️⃣ Convertir Base64 a Buffer y decodificar JPEG a RGBA
      const buffer = Buffer.from(b64, 'base64');
      const raw = jpeg.decode(buffer, {useTArray: true});
      const {data} = raw; // data.length = TARGET*TARGET*4

      // 4️⃣ Extraer canales RGB en Float32Array (0–255)
      const floatInput = new Float32Array(TARGET * TARGET * 3);
      for (let i = 0; i < TARGET * TARGET; i++) {
        const base = i * 4;
        const out = i * 3;
        floatInput[out] = data[base]; // R
        floatInput[out + 1] = data[base + 1]; // G
        floatInput[out + 2] = data[base + 2]; // B
      }

      // 5️⃣ Ejecutar inferencia síncrona con array de TypedArray
      const tensorInput = floatInput;
      const outputs = model.runSync([tensorInput]);
      const outTensor = outputs[0] as Float32Array;
      const prob = outTensor[0];

      console.log('Inference probability:', prob);
      setProbability(prob);
    } catch (e) {
      console.error('Inference error:', e);
    }
  };

  if (state !== 'loaded') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Cargando modelo…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Button title="Seleccionar Imagen" onPress={pickAndInfer} />
      {photoUri && <Image source={{uri: photoUri}} style={styles.preview} />}
      {probability !== null && (
        <View style={styles.output}>
          <Text>Probabilidad de Leishmania:</Text>
          <Text>{(probability * 100).toFixed(2)}%</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  container: {flex: 1, padding: 16, alignItems: 'center'},
  preview: {width: 200, height: 200, margin: 16},
  output: {
    marginTop: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
});
