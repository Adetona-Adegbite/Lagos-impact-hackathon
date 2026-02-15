import { useState, useRef } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';

export const useScanner = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [torch, setTorch] = useState(false);
  const [isScannerPaused, setIsScannerPaused] = useState(false);

  const toggleTorch = () => setTorch((prev) => !prev);
  const toggleCameraType = () => setFacing((t) => (t === 'back' ? 'front' : 'back'));

  return {
    permission,
    requestPermission,
    cameraRef,
    facing,
    setFacing,
    torch,
    setTorch,
    isScannerPaused,
    setIsScannerPaused,
    toggleTorch,
    toggleCameraType,
  };
};
