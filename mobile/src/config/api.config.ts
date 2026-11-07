import { Platform } from 'react-native';

/**
 * DaaruDoor Live Production Backend URL.
 * Standalone APKs and production builds will connect to this server by default.
 */
export const PRODUCTION_API_URL = 'https://daarudoor-server.vercel.app';

/**
 * Local development fallback for emulator / localhost debugging.
 */
export const LOCAL_DEV_API_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:5500' : 'http://localhost:5500';

/**
 * Returns the effective API base URL for the mobile application.
 * Guaranteed to never return localhost/10.0.2.2 in production builds.
 */
export const getApiBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() && !envUrl.includes('api.daarudoor.com')) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return PRODUCTION_API_URL;
};

export const API_BASE_URL = getApiBaseUrl();

export default API_BASE_URL;
