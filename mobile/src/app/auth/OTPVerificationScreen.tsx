import { useToast } from '../../providers/ToastProvider';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, TextInput, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppTheme } from '../../constants/theme';
import { FONT_FAMILY } from '../../constants/typography';
import { Button } from '../../components/ui';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { setAuth } from '../../store/slices/authSlice';

const OTPVerificationScreen = () => {
  const { showToast } = useToast();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { email, targetPath, mode } = route.params || {};
  const { colors } = useAppTheme();
  const dispatch = useDispatch();

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:5500' : 'http://localhost:5500');
      const endpoint = mode === 'forgot' ? '/api/auth/forget-password-otp' : '/api/auth/send-otp';
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email }),
      });
      if (res.ok) {
        setCooldown(60);
        showToast('OTP resent successfully', 'success');
      } else {
        showToast('Failed to resend OTP', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    setIsLoading(true);
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:5500' : 'http://localhost:5500');
      
      if (mode === 'forgot') {
        const res = await fetch(`${API_URL}/api/auth/verify-forget-password-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: email, otp }),
        });
        const data = await res.json();
        if (res.ok) {
          navigation.navigate('ResetPassword', { resetToken: data.resetToken });
        } else {
          showToast(data.message || 'Invalid OTP', 'error');
        }
      } else {
        // Login mode
        const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: email, otp }),
        });
        const data = await res.json();
        if (res.ok && data.result) {
          // Fix Race Condition: Wait for Redux and Storage updates BEFORE navigating
          const { setAuth } = await import('../../store/slices/authSlice');
          const { store } = await import('../../store');
          
          store.dispatch(setAuth({ token: data.token, user: data.result }));
          
          await AsyncStorage.setItem('token', data.token);
          await AsyncStorage.setItem('userToken', data.token);
          await AsyncStorage.setItem('user', JSON.stringify(data.result));
          await AsyncStorage.setItem('userData', JSON.stringify(data.result));
          await AsyncStorage.setItem('userRole', data.result?.role || 'customer');
          
          if (targetPath) {
            navigation.navigate('Main', { screen: targetPath } as any);
          } else {
            navigation.replace('Main');
          }
        } else {
          showToast(data.message || 'Invalid OTP', 'error');
        }
      }
    } catch (error) {
      showToast('Unable to connect to server', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 20, paddingTop: 40 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 20 }}>
          <MaterialIcons name="arrow-back-ios" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 24, fontFamily: FONT_FAMILY.bold, color: colors.text, marginBottom: 10 }}>Verify OTP</Text>
        <Text style={{ fontFamily: FONT_FAMILY.regular, color: colors.muted, marginBottom: 30 }}>Enter the 6-digit code sent to {email}</Text>
        
        <TextInput
          style={{ backgroundColor: colors.card, color: colors.text, fontSize: 24, fontFamily: FONT_FAMILY.regular, padding: 15, borderRadius: 10, textAlign: 'center', letterSpacing: 10 }}
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={setOtp}
          placeholder="000000"
          placeholderTextColor={colors.muted}
        />
        
        <Button
          title="Verify & Proceed"
          onPress={handleVerify}
          loading={isLoading}
          variant={otp.length === 6 ? 'primary' : 'disabled'}
          style={{ marginTop: 30 }}
        />

        <TouchableOpacity onPress={handleResend} style={{ marginTop: 20, alignItems: 'center' }} disabled={cooldown > 0}>
          <Text style={{ fontFamily: FONT_FAMILY.medium, color: cooldown > 0 ? colors.muted : colors.primary, fontSize: 14 }}>
            {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
export default OTPVerificationScreen;
