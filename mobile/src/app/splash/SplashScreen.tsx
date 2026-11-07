import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { setAuth, clearAuth } from '../../store/slices/authSlice';
import { Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useAppTheme } from '../../constants/theme';
import { FONT_FAMILY } from '../../constants/typography';
import { MaterialIcons } from '@expo/vector-icons';

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

const SplashScreen = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const { colors } = useAppTheme();
  const dispatch = useDispatch();

  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 1000 });
    logoScale.value = withSequence(
      withTiming(1.05, { duration: 800 }),
      withTiming(1, { duration: 400 })
    );

    textOpacity.value = withDelay(800, withTiming(1, { duration: 800 }));

    const checkAuthAndNavigate = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('token');
        const userRole = await AsyncStorage.getItem('userRole') || 'customer';
        const userStr = await AsyncStorage.getItem('userData') || await AsyncStorage.getItem('user');
        
        if (token && userStr) {
          try {
            const API_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:5500' : 'http://localhost:5500');
            const endpoint = userRole === 'delivery' 
              ? `${API_URL}/api/delivery/profile`
              : `${API_URL}/api/auth/customer/me`;

            const response = await fetch(endpoint, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
              const data = await response.json();
              dispatch(setAuth({ token, user: data.data || data.user || JSON.parse(userStr) }));
              
              if (userRole === 'delivery') {
                navigation.replace('DeliveryMain' as any);
              } else {
                navigation.replace('Main');
              }
            } else {
              // Token invalid or user deleted
              await AsyncStorage.multiRemove(['userToken', 'token', 'userData', 'user', 'userRole']);
              dispatch(clearAuth());
              navigation.replace('AuthSelection');
            }
          } catch (error) {
            // Network error, maybe proceed with local data or go to login. Given instructions, backend must validate, but if network fails we probably shouldn't log out permanently.
            // But wait, if network fails, we'll just go to login to be safe or stay here? The instruction says: "The customer should be considered logged in ONLY if the backend confirms that the customer account still exists and is valid."
            await AsyncStorage.multiRemove(['userToken', 'token', 'userData', 'user', 'userRole']);
            dispatch(clearAuth());
            navigation.replace('AuthSelection');
          }
        } else {
          navigation.replace('AuthSelection');
        }
      } catch (error) {
        console.error('Error checking token:', error);
        navigation.replace('AuthSelection');
      }
    };

    const timeout = setTimeout(() => {
      checkAuthAndNavigate();
    }, 2500);

    return () => clearTimeout(timeout);
  }, [navigation, logoOpacity, logoScale, textOpacity]);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }]
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
        {/* Glow effect */}
        <View style={[styles.glow, { backgroundColor: colors.primary, shadowColor: colors.primary }]} />
        <MaterialIcons name="local-drink" size={90} color={colors.white} />
      </Animated.View>

      <Animated.View style={[styles.textContainer, animatedTextStyle]}>
        <Text style={[styles.title, { color: colors.text }]}>DAARUDOOR</Text>
        <Text style={[styles.subtitle, { color: colors.primary }]}>Premium Beverage Delivery</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 32,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.3,
    transform: [{ scale: 1.5 }],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 10,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    letterSpacing: 6,
    fontFamily: FONT_FAMILY.bold,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.medium,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});

export default SplashScreen;
