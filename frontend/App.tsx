import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
// Note: useCameraPermissions is the stable hook in SDK 54
import { CameraView, useCameraPermissions } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export default function FaceCaptureScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // Configuration for your local FastAPI server
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

  const captureAndVerify = async () => {
    // Ensure camera is ready and not already processing
    if (cameraRef.current && isReady && !loading) {
      setLoading(true);
      try {
        // 1. Capture the photo
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });

        // 2. Resize and get Base64 (Using stable functional API)
        const resized = await manipulateAsync(
          photo.uri,
          [{ resize: { width: 600 } }],
          { base64: true, format: SaveFormat.JPEG }
        );

        // 3. Send to FastAPI
        const response = await fetch(`${BACKEND_URL}/verify-face`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            user_id: "chan_jun_xi", 
            image_base64: resized.base64 
          }),
        });

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }

        const result = await response.json();
        if (result.status === "Success") {
          Alert.alert(
            "Face Embedded! 🧠",
            `We turned your face into ${result.total_dimensions} numbers.\n\nPreview: ${result.embedding_preview.map((n: number) => n.toFixed(2)).join(', ')}...`
          );
        } else {
          Alert.alert("Failed ❌", result.error || "Unknown Error");
        }
        
      } catch (error) {
        console.error("Capture/Verify Error:", error);
        Alert.alert("Error", "Could not verify face. Check your backend terminal.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <CameraView 
        style={styles.camera} 
        facing="front" 
        ref={cameraRef}
        onCameraReady={() => setIsReady(true)}
      />
      
      <View style={styles.bottomControls}>
        <TouchableOpacity 
          style={[styles.captureBtn, (loading || !isReady) && styles.disabledBtn]} 
          onPress={captureAndVerify}
          disabled={loading || !isReady}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify Face</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  message: { color: '#fff', textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
  camera: { flex: 4, borderRadius: 20, overflow: 'hidden', margin: 10 },
  bottomControls: { flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  button: { backgroundColor: '#4A90E2', padding: 15, borderRadius: 10 },
  captureBtn: { backgroundColor: '#FF4757', paddingVertical: 18, paddingHorizontal: 40, borderRadius: 30 },
  disabledBtn: { backgroundColor: '#555' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});