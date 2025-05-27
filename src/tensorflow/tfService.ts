// src/tensorflow/tfService.ts
import {
  loadTensorflowModel,
  useTensorflowModel,
} from 'react-native-fast-tflite';

/** Llama esto al arrancar tu App (o en un efecto inicial) */
export async function initLeishModel(): Promise<void> {
  await loadTensorflowModel(
    require('../../android/app/src/main/assets/leish_cls_fp16.tflite'),
  );
}

/** Hook para usar dentro de tus componentes */
export function useLeishModel() {
  return useTensorflowModel(
    require('../../android/app/src/main/assets/leish_cls_fp16.tflite'),
  );
}
