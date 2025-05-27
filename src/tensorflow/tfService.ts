import {
  loadTensorflowModel,
  useTensorflowModel,
} from 'react-native-fast-tflite';

// Función para cargar el modelo FP16 al iniciar la app
export async function initLeishModel(): Promise<void> {
  await loadTensorflowModel(
    require('../../android/app/src/main/assets/leish_fp16.tflite'),
  );
}

// Hook para acceder al plugin de inferencia desde cualquier componente
export function useLeishModel() {
  return useTensorflowModel(
    require('../../android/app/src/main/assets/leish_fp16.tflite'),
  );
}
