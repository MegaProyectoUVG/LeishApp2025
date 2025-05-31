// src/tensorflow/tfService.ts
import {
  loadTensorflowModel,
  useTensorflowModel,
} from 'react-native-fast-tflite';

export async function initLeishModel(): Promise<void> {
  await loadTensorflowModel(
    require('../../android/app/src/main/assets/leish_cls_int8.tflite'),
  );
}

export function useLeishModel() {
  return useTensorflowModel(
    require('../../android/app/src/main/assets/leish_cls_int8.tflite'),
  );
}
