import { useToast } from '../../providers/ToastProvider';
import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppTheme } from '../../constants/theme';
import { Button, Input } from '../../components/ui';
import { MaterialIcons } from '@expo/vector-icons';

const ForgotPasswordScreen = () => {
  const { showToast } = useToast();
  const navigation = useNavigation<any>();
  const { colors } = useAppTheme();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isFormValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSendResetOTP = async () => {
    if (!isFormValid) return;
    setIsLoading(true);
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:5500' : 'http://localhost:5500');
      const response = await fetch(`${API_URL}/api/auth/forget-password-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email }),
      });
      const data = await response.json();
      if (response.ok) {
        navigation.navigate('OTPVerification', { email, mode: 'forgot' });
      } else {
        showToast(data.message || 'Failed to send reset OTP', 'error');
      }
    } catch (error) {
      showToast('Unable to connect to server', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1, padding: 20, paddingTop: 40 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 20 }}>
          <MaterialIcons name="arrow-back-ios" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 10 }}>Forgot Password</Text>
        <Text style={{ color: colors.muted, marginBottom: 30 }}>Enter your registered email address to receive a password reset OTP.</Text>
        <Input
          label="Email Address"
          placeholder="yourname@gmail.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <Button
          title="Send OTP"
          onPress={handleSendResetOTP}
          loading={isLoading}
          variant={isFormValid ? 'primary' : 'disabled'}
          style={{ marginTop: 20 }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
export default ForgotPasswordScreen;
