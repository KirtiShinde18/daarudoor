import { NativeModules, Alert } from 'react-native';

/**
 * Checks whether the Razorpay native module is compiled into the current runtime.
 * Returns `false` inside standard Expo Go, and `true` inside standalone APKs and EAS dev builds.
 */
export const isRazorpayAvailable = (): boolean => {
  return !!(
    NativeModules.RNRazorpayCheckout ||
    (globalThis as any)?.__turboModuleProxy?.('RNRazorpayCheckout')
  );
};

/**
 * Safe wrapper for Razorpay checkout.
 * Gracefully handles Expo Go environment where custom native modules cannot run.
 */
export const openRazorpayCheckout = async (options: any): Promise<any> => {
  if (!isRazorpayAvailable()) {
    throw new Error(
      'Razorpay payment gateway requires native binaries and is not supported in Expo Go. Please select Cash on Delivery (COD) to test in Expo Go, or test with the standalone Android APK.'
    );
  }

  // Lazy load RazorpayCheckout only when native module is present
  const RazorpayCheckout = require('react-native-razorpay').default;
  return RazorpayCheckout.open(options);
};

export default {
  isAvailable: isRazorpayAvailable,
  open: openRazorpayCheckout,
};
