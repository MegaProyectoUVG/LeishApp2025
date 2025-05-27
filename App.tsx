import React, { useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator } from 'react-native';
import { initLeishModel, useLeishModel } from './src/tensorflow/tfService';

export default function App() {
  const [ready, setReady] = useState(false);
  const { state, model } = useLeishModel();
  const [output, setOutput] = useState<any>(null);

  // Al montar, inicializamos el modelo
  useEffect(() => {
    initLeishModel()
      .then(() => setReady(true))
      .catch(err => console.error('Error loading model:', err));
  }, []);

  // Ejecuta la inferencia cuando el usuario pulsa el botón
  const runTest = async () => {
    if (state === 'loaded' && model) {
      // TODO: reemplaza con el buffer de tu imagen o datos de entrada
      const inputBuffer = 
      try {
        const res = await model.run(inputBuffer);
        setOutput(res);
      } catch (e) {
        console.error('Inference error:', e);
      }
    }
  };

  // Mientras no esté listo o cargándose, muestro loader
  if (!ready || state !== 'loaded') {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
        <ActivityIndicator size="large" />
        <Text>Cargando modelo...</Text>
      </View>
    );
  }

  // UI principal: botón para ejecutar inferencia y mostrar resultado
  return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center', padding:16 }}>
      <Button title="Ejecutar Inferencia" onPress={runTest} />
      {output && <Text>{JSON.stringify(output)}</Text>}
    </View>
  );
}
