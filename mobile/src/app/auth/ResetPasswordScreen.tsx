import { useToast } from '../../providers/ToastProvider';
import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppTheme } from '../../constants/theme';
import { Button, Input } from '../../components/ui';
import { MaterialIcons } from '@expo/vector-icons';

const ResetPasswordScreen = () => {
  const { showToast } = useToast();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { resetToken } = route.params || {};
  const { colors } = useAppTheme();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const isFormValid = password.length >= 8 && password === confirmPassword;

  const handleResetPassword = async () => {
    if (!isFormValid) return;
    setIsLoading(true);
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:5500' : 'http://localhost:5500');
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, password }),
      });
      const data = await response.json();
      if (response.ok) {
        showToast('Password reset successfully.', 'success');
        navigation.navigate('Login');
      } else {
        showToast(data.message || 'Failed to reset password', 'error');
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
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 10 }}>Create New Password</Text>
        <Text style={{ color: colors.muted, marginBottom: 30 }}>Your new password must be different from previous used passwords.</Text>
        
        <Input
          label="New Password"
          placeholder="Enter new password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        
        <Input
          label="Confirm Password"
          placeholder="Confirm new password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        
        {password.length > 0 && confirmPassword.length > 0 && password !== confirmPassword && (
          <Text style={{ color: colors.error, fontSize: 12, marginBottom: 10 }}>Passwords do not match</Text>
        )}
        
        <Button
          title="Reset Password"
          onPress={handleResetPassword}
          loading={isLoading}
          variant={isFormValid ? 'primary' : 'disabled'}
          style={{ marginTop: 20 }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
export default ResetPasswordScreen;
