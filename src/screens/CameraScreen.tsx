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
import {useLeishModel} from '../tensorflow/tfService';

const options: ImageLibraryOptions = {
  mediaType: 'photo',
  includeBase64: false,
  quality: 0.8,
};

const CameraScreen: React.FC = () => {
  const {state, model} = useLeishModel();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [output, setOutput] = useState<any>(null);

  const pickImage = async () => {
    const result = await launchImageLibrary(options);
    const asset = result.assets?.[0] as Asset | undefined;
    if (asset?.uri) {
      setPhotoUri(asset.uri);
      if (state === 'loaded' && model) {
        try {
          const response = await fetch(asset.uri);
          const buffer = await response.arrayBuffer();
          const input = new Uint8Array(buffer);
          const res = await model.run([input]);
          setOutput(res);
        } catch (e) {
          console.error('Inference error:', e);
        }
      }
    }
  };

  if (state !== 'loaded') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Cargando modelo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Button title="Seleccionar Imagen" onPress={pickImage} />
      {photoUri && <Image source={{uri: photoUri}} style={styles.preview} />}
      {output && (
        <View style={styles.output}>
          <Text>Resultado:</Text>
          <Text>{JSON.stringify(output)}</Text>
        </View>
      )}
    </View>
  );
};

export default CameraScreen;

const styles = StyleSheet.create({
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preview: {width: 200, height: 200, marginVertical: 16},
  output: {
    marginTop: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
});
