import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import MapViewComponent from './MapViewComponent';

const App: React.FC = () => {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <MapViewComponent />
      </SafeAreaView>
    </>
  );
};

export default App;
