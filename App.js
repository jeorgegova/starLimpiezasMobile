/**
 * Star Limpiezas Mobile App
 * Aplicación principal con navegación y autenticación
 * 
 * @format
 */

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { AuthProvider } from './src/services/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <AppNavigator />
      </SafeAreaProvider>
    </AuthProvider>
  );
}

export default App;