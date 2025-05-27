// App.tsx
import React from 'react';
import {SafeAreaView, StatusBar, StyleSheet} from 'react-native';
import CameraScreen from './src/screens/CameraScreen';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <CameraScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
});
