import {
  loadTensorflowModel,
  useTensorflowModel,
} from 'react-native-fast-tflite';

// Carga tu modelo FP16 (statically bundled in android/app/src/main/assets)
export async function initLeishModel(): Promise<void> {
  await loadTensorflowModel(
    require('../../android/app/src/main/assets/leish_cls_fp16.tflite'),
  );
}

// Hook para obtener el plugin de inferencia en cualquier componente
export function useLeishModel() {
  return useTensorflowModel(
    require('../../android/app/src/main/assets/leish_cls_fp16.tflite'),
  );
}
