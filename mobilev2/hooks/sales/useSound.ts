import { useState, useEffect, useCallback } from 'react';
import { Audio } from 'expo-av';

export const useSound = () => {
  const [sound, setSound] = useState<Audio.Sound>();

  useEffect(() => {
    async function loadSound() {
      try {
        const { sound } = await Audio.Sound.createAsync(require('@/assets/scan-sound.mp3'));
        setSound(sound);
      } catch (e) {
        console.log('Error loading sound', e);
      }
    }

    loadSound();

    return () => {
      sound?.unloadAsync();
    };
  }, []);

  const playSound = useCallback(async () => {
    try {
      if (sound) {
        await sound.replayAsync();
      }
    } catch (error) {
      console.log('Error playing sound', error);
    }
  }, [sound]);

  return { playSound };
};
