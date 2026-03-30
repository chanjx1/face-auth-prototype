import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export default function FaceCaptureScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'register' | 'verify'>('register');
  const [username, setUsername] = useState('');
  const cameraRef = useRef<CameraView>(null);

  const BACKEND_URL = "http://10.100.91.16:8000";

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need camera access to verify your identity.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const captureAndProcess = async () => {
    if (mode === 'register' && username.trim() === '') {
      Alert.alert("Wait!", "Please enter a name before enrolling.");
      return;
    }

    if (cameraRef.current && isReady && !loading) {
      setLoading(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });

        const resized = await manipulateAsync(
          photo.uri,
          [{ resize: { width: 600 } }],
          { base64: true, format: SaveFormat.JPEG }
        );

        const endpoint = mode === 'register' ? 'register' : 'verify-face';
        
        const response = await fetch(`${BACKEND_URL}/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            user_id: username.trim() || "unknown",
            image_base64: resized.base64 
          }),
        });

        if (!response.ok) throw new Error(`Server error: ${response.status}`);

        const result = await response.json();

        if (mode === 'register') {
          if (result.status === "Success") {
            Alert.alert("Registration Complete ✅", `Welcome, ${username}!`);
            setMode('verify');
            setUsername(''); // Clear input for privacy
          } else {
            Alert.alert("Registration Failed ❌", result.message);
          }
        } else {
          if (result.verified) {
            // result.user comes from the database match!
            Alert.alert("Identity Confirmed ✅", `Hello, ${result.user}!\nMatch confidence is high.`);
          } else {
            Alert.alert("Access Denied ❌", result.error || "User not recognized.");
          }
        }
        
      } catch (error) {
        console.error("Error:", error);
        Alert.alert("Error", "Check your backend terminal connection.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.toggleBtn, mode === 'register' && styles.activeToggle]} 
          onPress={() => setMode('register')}
        >
          <Text style={styles.toggleText}>Register</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleBtn, mode === 'verify' && styles.activeToggle]} 
          onPress={() => setMode('verify')}
        >
          <Text style={styles.toggleText}>Verify</Text>
        </TouchableOpacity>
      </View>

      {/* MODIFIED: Always show the Input Field so the user can identify themselves for 1:1 verification */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          // Dynamic placeholder helps the user understand what to do in each mode
          placeholder={mode === 'register' ? "Enter full name to register..." : "Enter your username to login..."}
          placeholderTextColor="#888"
          value={username}
          onChangeText={setUsername}
        />
      </View>

      <CameraView 
        style={styles.camera} 
        facing="front" 
        ref={cameraRef}
        onCameraReady={() => setIsReady(true)}
      />
      
      <View style={styles.bottomControls}>
        <TouchableOpacity 
          style={[styles.captureBtn, (loading || !isReady) && styles.disabledBtn]} 
          onPress={captureAndProcess}
          disabled={loading || !isReady}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {mode === 'register' ? "Enroll Face" : "Verify Identity"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', marginTop: 50, marginBottom: 10, justifyContent: 'center', gap: 10 },
  toggleBtn: { padding: 10, borderRadius: 20, backgroundColor: '#333', width: 100, alignItems: 'center' },
  activeToggle: { backgroundColor: '#4A90E2' },
  toggleText: { color: '#fff', fontWeight: 'bold' },
  inputContainer: { paddingHorizontal: 20, marginBottom: 10 },
  input: { backgroundColor: '#222', color: '#fff', padding: 15, borderRadius: 10, fontSize: 16, borderBottomWidth: 2, borderBottomColor: '#4A90E2' },
  camera: { flex: 4, borderRadius: 20, overflow: 'hidden', margin: 10 },
  bottomControls: { flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  captureBtn: { backgroundColor: '#FF4757', paddingVertical: 18, paddingHorizontal: 40, borderRadius: 30, minWidth: 200, alignItems: 'center' },
  disabledBtn: { backgroundColor: '#555' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  message: { color: '#fff', textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
  button: { backgroundColor: '#4A90E2', padding: 15, borderRadius: 10 },
});