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
import ImageResizer from 'react-native-image-resizer';

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
      // 1️⃣ Seleccionar y recortar un cuadrado EXACTO de 224×224
      const img = await ImagePicker.openPicker({
        cropping: true,
        cropperToolbarTitle: 'Recorta la imagen',
        cropperCircleOverlay: false,
        cropperActiveWidgetColor: '#1976d2',
        cropperStatusBarColor: '#1976d2',
        cropperToolbarColor: '#1976d2',
        mediaType: 'photo',
        forceJpg: true,
        // El crop será centrado por defecto si no tocas el recorte manualmente
      });
      const uri = img.path;
      setPhotoUri(uri);
      const resized = await ImageResizer.createResizedImage(
        uri,
        TARGET,
        TARGET,
        'JPEG',
        100,
      );
      const resizedUri = resized.uri;
      const filePath =
        Platform.OS === 'android'
          ? resizedUri
          : resizedUri.replace('file://', '');
      const base64 = await RNFS.readFile(filePath, 'base64');

      // 3️⃣ Convertir Base64 a Buffer y decodificar a RGBA píxeles
      const jpgBuffer = Buffer.from(base64, 'base64');
      const jpegRaw = jpeg.decode(jpgBuffer, {useTArray: true});
      const {data} = jpegRaw; // Uint8Array length = TARGET * TARGET * 4
      console.log('JPEG decoded. Data length:', data.length);

      // 4️⃣ Extraer canales RGB
      const floatPixels = new Float32Array(TARGET * TARGET * 3);
      for (let i = 0; i < TARGET * TARGET; i++) {
        const baseIdx = i * 4;
        const outIdx = i * 3;
        floatPixels[outIdx] = data[baseIdx]; // R
        floatPixels[outIdx + 1] = data[baseIdx + 1]; // G
        floatPixels[outIdx + 2] = data[baseIdx + 2]; // B
      }
      console.log(
        'First 10 floatPixels:',
        Array.from(floatPixels.slice(0, 10)),
      );

      // 5️⃣ Cuantizar usando los parámetros del modelo
      const {scale = 1 / 255, zeroPoint = 0} =
        (model.inputs?.[0] as any)?.quantization || {};
      console.log('Input quantization params:', {scale, zeroPoint});
      const quantized = new Uint8Array(TARGET * TARGET * 3);
      for (let i = 0; i < floatPixels.length; i++) {
        quantized[i] = Math.round(floatPixels[i] / scale + zeroPoint);
      }
      console.log(
        'First 10 quantized input values:',
        Array.from(quantized.slice(0, 10)),
      );
      console.log('Model input shape:', (model.inputs?.[0] as any)?.shape);

      // 6️⃣ Llamar a `model.run(...)` (async) con el Uint8Array cuantizado
      const outputs = await model.run([quantized]);
      const outTensor = outputs[0];
      console.log('Output tensor:', outTensor);

      let rawValue = outTensor[0];
      // 7️⃣ Descuantizar la salida si es necesario (igual que en Python)
      const {scale: outScale = 1 / 255, zeroPoint: outZeroPoint = 0} =
        (model.outputs?.[0] as any)?.quantization || {};
      console.log('Output quantization params:', {outScale, outZeroPoint});
      console.log('Raw output value:', rawValue);

      const prob = (Number(rawValue) - Number(outZeroPoint)) * Number(outScale);
      console.log('Inference probability (INT8):', prob);

      setProbability(prob);
    } catch (e) {
      console.error('Inference error:', e);
    }
  };

  if (state !== 'loaded') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Cargando modelo TFLite…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Button title="Seleccionar Imagen" onPress={pickAndInfer} />
      {photoUri && <Image source={{uri: photoUri}} style={styles.preview} />}
      {probability !== null && (
        <View style={styles.output}>
          <Text>Probabilidad de Leishmania (INT8):</Text>
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
