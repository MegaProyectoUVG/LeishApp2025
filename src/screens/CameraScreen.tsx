// src/screens/CameraScreen.tsx
import React, {useState} from 'react';
import {
  View,
  Text,
  Button,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  launchImageLibrary,
  ImageLibraryOptions,
  Asset,
} from 'react-native-image-picker';
import ImageResizer from 'react-native-image-resizer';
import RNFS from 'react-native-fs';
import jpeg from 'jpeg-js';
import {Buffer} from 'buffer';
import {useLeishModel} from '../tensorflow/tfService';

const pickerOptions: ImageLibraryOptions = {
  mediaType: 'photo',
  includeBase64: false,
  quality: 0.8,
};

export default function CameraScreen() {
  const {state, model} = useLeishModel();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [result, setResult] = useState<number[] | null>(null);

  const pickImage = async () => {
    if (state !== 'loaded' || !model) return;

    const res = await launchImageLibrary(pickerOptions);
    const asset = res.assets?.[0] as Asset | undefined;
    if (!asset?.uri) return;

    setPhotoUri(asset.uri);
    try {
      // Redimensiona a 224×224
      const resized = await ImageResizer.createResizedImage(
        asset.uri,
        224,
        224,
        'JPEG',
        100,
      );

      // Lee como Base64
      const base64 = await RNFS.readFile(resized.uri, 'base64');

      // Convierte a Buffer
      const buffer = Buffer.from(base64, 'base64');

      // Decodifica JPEG a píxeles RGBA
      const raw = jpeg.decode(buffer, {useTArray: true});
      const {data, width, height} = raw;

      // Extrae RGB en TypedArray
      const rgbData = new Uint8Array(width * height * 3);
      for (let i = 0; i < width * height; i++) {
        rgbData[i * 3] = data[i * 4];
        rgbData[i * 3 + 1] = data[i * 4 + 1];
        rgbData[i * 3 + 2] = data[i * 4 + 2];
      }

      // Ejecuta inferencia
      const output = await model.run([rgbData]);
      setResult(output as unknown as number[]);
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
      <Button title="Seleccionar Imagen" onPress={pickImage} />
      {photoUri && <Image source={{uri: photoUri}} style={styles.preview} />}
      {result && (
        <View style={styles.output}>
          <Text>Resultado:</Text>
          <Text>{JSON.stringify(result)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  container: {flex: 1, padding: 16, alignItems: 'center'},
  preview: {width: 200, height: 200, margin: 16},
  output: {padding: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 8},
});
