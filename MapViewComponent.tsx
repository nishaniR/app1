// MapViewComponent.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, PermissionsAndroid, Image, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { Picker } from '@react-native-picker/picker';
import mapStyle1 from './assets/style.json';
import mapStyle2 from './assets/style2.json';

const wsUrl = 'ws://10.233.35.31:8080'; // Replace with your WebSocket server address

const MapViewComponent: React.FC = () => {
  const [initialRegion, setInitialRegion] = useState({
    latitude: 6.9313,
    longitude: 79.8467,
    zoom: 16,
  });
  const [selectedMapStyle, setSelectedMapStyle] = useState(mapStyle1);
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  const mapRef = useRef<MapView | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message: 'This app needs access to your location to show it on the map.',
              buttonPositive: 'OK',
            }
          );

          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            startWatchingLocation();
          } else {
            console.log('Location permission denied.');
          }
        } catch (err) {
          console.warn(err);
        }
      } else if (Platform.OS === 'ios') {
        startWatchingLocation();
      }
    };

    let watchId: number | null = null;

    const startWatchingLocation = () => {
      watchId = Geolocation.watchPosition(
        position => {
          const { latitude, longitude } = position.coords;
          setInitialRegion(prevRegion => ({
            ...prevRegion,
            latitude,
            longitude,
          }));

          if (mapRef.current) {
            mapRef.current.animateCamera({
              center: {
                latitude,
                longitude,
              },
            });
          }

          if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ latitude, longitude }));
          }
        },
        error => console.error(error),
        { enableHighAccuracy: true, distanceFilter: 10 }
      );
    };

    requestLocationPermission();

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connection opened');
    };

    ws.current.onmessage = event => {
      const data = event.data;
      if (data) {
        try {
          const parsedData = JSON.parse(data);
          setInitialRegion({ ...parsedData, zoom: initialRegion.zoom });
        } catch (error) {
          console.error('Error parsing JSON:', error);
        }
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      if (watchId) {
        Geolocation.clearWatch(watchId);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const handleMapStyleChange = (styleName: string) => {
    const newMapStyle = styleName === 'style1' ? mapStyle1 : mapStyle2;
    setSelectedMapStyle(newMapStyle);
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.animateCamera({
        zoom: initialRegion.zoom - 1,
      });
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.animateCamera({
        zoom: initialRegion.zoom + 1,
      });
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: initialRegion.latitude,
          longitude: initialRegion.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        mapType={mapType}
        customMapStyle={selectedMapStyle}
      >
        <Marker
          coordinate={{
            latitude: initialRegion.latitude,
            longitude: initialRegion.longitude,
          }}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <Image source={require('./assets/dotx.png')} style={styles.markerImage} />
        </Marker>
      </MapView>
      <View style={styles.controlsContainer}>
        <View style={styles.zoomButtons}>
          <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
            <Text style={styles.buttonText}>Zoom Out</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn}>
            <Text style={styles.buttonText}>Zoom In</Text>
          </TouchableOpacity>
        </View>
        <Picker
          selectedValue={selectedMapStyle === mapStyle1 ? 'style1' : 'style2'}
          onValueChange={handleMapStyleChange}
          style={{ ...styles.picker, backgroundColor: '#016BFF', color: 'white' }}
          dropdownIconColor="white"
        >
          <Picker.Item label="Dark Style" value="style1" />
          <Picker.Item label="Light Style" value="style2" />
        </Picker>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  map: {
    width: '100%',
    height: '86%',
  },
  controlsContainer: {
    backgroundColor: '#016BFF',
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  zoomButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  zoomButton: {
    backgroundColor: '#016BFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginHorizontal: 5,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
  },
  picker: {
    width: '50%',
    marginTop: 10,
  },
  markerImage: {
    width: 50,
    height: 50,
  },
});

export default MapViewComponent;
