import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { authStorage } from '@/services/authStorage';
import { initDatabase } from '@/services/database';
import { syncEngine } from '@/services/sync/SyncEngine';

/**
 * Root index component that handles initial routing logic.
 * It checks if the user is authenticated and redirects to either
 * the main tabs or the welcome/onboarding screen.
 */
export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function initializeApp() {
      try {
        // Initialize local database
        await initDatabase();

        // Check for existing authentication data
        const authData = await authStorage.getAuthData();

        if (authData?.token) {
          setIsAuthenticated(true);
          // Start background sync if user is logged in
          syncEngine.initialize().catch((err) => {
            console.warn('Background sync initialization failed:', err);
          });
        }
      } catch (error) {
        console.error('App initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    }

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#122117', // Match app background
        }}>
        <ActivityIndicator size="large" color="#36e27b" />
      </View>
    );
  }

  // Redirect based on auth state
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}
