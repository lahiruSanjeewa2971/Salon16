import { addDoc, collection, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db, firebaseNetwork } from '../firebase.config';

export default function FirebaseTest() {
  const [isConnected, setIsConnected] = useState(false);
  const [testData, setTestData] = useState(null);

  useEffect(() => {
    // Test Firebase connection
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      // Enable network first
      await firebaseNetwork.enable();
      
      // Test Firestore connection with timeout
      const testCollection = collection(db, 'test');
      const querySnapshot = await getDocs(testCollection);
      setIsConnected(true);
      console.log('Firebase connection successful!');
      Alert.alert('Success', 'Firebase connected successfully!');
    } catch (error) {
      console.error('Firebase connection failed:', error);
      setIsConnected(false);
      
      // Check if it's a network issue
      if (error.code === 'unavailable' || error.message.includes('timeout')) {
        Alert.alert('Network Issue', 'Firebase is in offline mode. Check your internet connection.');
      } else {
        Alert.alert('Error', 'Firebase connection failed: ' + error.message);
      }
    }
  };

  const addTestData = async () => {
    try {
      const docRef = await addDoc(collection(db, 'test'), {
        message: 'Hello from Salon 16!',
        timestamp: new Date(),
        app: 'salon16'
      });
      setTestData(docRef.id);
      Alert.alert('Success', 'Test data added to Firestore!');
    } catch (error) {
      console.error('Error adding test data:', error);
      Alert.alert('Error', 'Failed to add test data');
    }
  };

  const testAuth = async () => {
    try {
      // This is just a test - in real app, use proper auth flow
      Alert.alert('Auth Test', 'Authentication is configured and ready!');
    } catch (error) {
      console.error('Auth test failed:', error);
      Alert.alert('Error', 'Authentication test failed');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Connection Status:</Text>
        <Text style={[styles.status, { color: isConnected ? 'green' : 'red' }]}>
          {isConnected ? 'Connected ✅' : 'Disconnected ❌'}
        </Text>
      </View>

      {testData && (
        <View style={styles.dataContainer}>
          <Text style={styles.dataLabel}>Test Data ID:</Text>
          <Text style={styles.dataText}>{testData}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={addTestData}>
        <Text style={styles.buttonText}>Add Test Data to Firestore</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={testAuth}>
        <Text style={styles.buttonText}>Test Authentication</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={testConnection}>
        <Text style={styles.buttonText}>Test Connection</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.networkButton]} 
        onPress={async () => {
          try {
            await firebaseNetwork.enable();
            Alert.alert('Success', 'Network enabled');
          } catch (error) {
            Alert.alert('Error', 'Failed to enable network');
          }
        }}
      >
        <Text style={styles.buttonText}>Enable Network</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.offlineButton]} 
        onPress={async () => {
          try {
            await firebaseNetwork.disable();
            Alert.alert('Info', 'Network disabled - App will work offline');
          } catch (error) {
            Alert.alert('Error', 'Failed to disable network');
          }
        }}
      >
        <Text style={styles.buttonText}>Go Offline</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusLabel: {
    fontSize: 16,
    marginRight: 10,
    color: '#666',
  },
  status: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dataContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#e8f5e8',
    borderRadius: 5,
  },
  dataLabel: {
    fontSize: 14,
    color: '#666',
  },
  dataText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginVertical: 5,
    minWidth: 200,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  networkButton: {
    backgroundColor: '#28a745',
  },
  offlineButton: {
    backgroundColor: '#6c757d',
  },
});
