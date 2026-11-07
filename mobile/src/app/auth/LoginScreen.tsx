import { useToast } from '../../providers/ToastProvider';
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useAppTheme } from '../../constants/theme';
import { FONT_FAMILY } from '../../constants/typography';
import { Button, Input } from '../../components/ui';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { loginUser } from '../../api/auth.api';

type LoginScreenProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen = () => {
  const { showToast } = useToast();
  const navigation = useNavigation<LoginScreenProp>();
  const route = useRoute<any>();
  const targetPath = route.params?.targetPath; // For protected action redirects

  const { colors } = useAppTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isFormValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length >= 6;

  const handleContinue = async () => {
    if (!isFormValid) return;

    setIsLoading(true);

    try {
      const data = await loginUser(email, password);

      if (data.success) {
        const { setAuth } = await import('../../store/slices/authSlice');
        const { store } = await import('../../store');
        const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');

        store.dispatch(setAuth({ token: data.token, user: data.user }));
        
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('userRole', data.role);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        await AsyncStorage.setItem('user', JSON.stringify(data.user));

        if (data.role === 'delivery') {
            navigation.replace('DeliveryMain' as any);
        } else {
            if (targetPath) {
              navigation.navigate('Main', { screen: targetPath } as any);
            } else {
              navigation.replace('Main');
            }
        }
      } else {
        showToast(data.message || 'Failed to login', 'error');
      }
    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'Unable to connect to server', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 18 : 32,
      paddingBottom: 30,
    },
    header: { marginBottom: 30 },
    topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
    backButton: {
      width: 44, height: 44, borderRadius: 14,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.07)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    },
    brandContainer: { marginLeft: 14 },
    brand: { fontSize: 13, fontFamily: FONT_FAMILY.bold, letterSpacing: 2, color: colors.primaryLight, textTransform: 'uppercase' },
    brandSubtext: { fontSize: 11, fontFamily: FONT_FAMILY.regular, color: colors.muted, marginTop: 3 },
    title: { fontSize: 20, lineHeight: 37, fontFamily: FONT_FAMILY.bold, color: colors.text, letterSpacing: -0.6 },
    titleAccent: { color: colors.primaryLight },
    subtitle: { marginTop: 9, fontSize: 14, lineHeight: 21, fontFamily: FONT_FAMILY.regular, color: colors.muted, maxWidth: 330 },
    formCard: {
      borderRadius: 16, padding: 20, backgroundColor: colors.card,
      borderWidth: 1, borderColor: colors.border,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
    sectionIcon: {
      width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(106,4,9,0.18)', marginRight: 12,
    },
    sectionTitle: { fontSize: 17, fontFamily: FONT_FAMILY.bold, color: colors.text },
    sectionSubtitle: { fontSize: 11, fontFamily: FONT_FAMILY.regular, color: colors.muted, marginTop: 3 },
    loginButton: { width: '100%', marginBottom: 15, marginTop: 10 },
    forgotPasswordText: { color: colors.primary, fontSize: 13, fontFamily: FONT_FAMILY.semiBold, textAlign: 'center', marginBottom: 20 },
    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { color: colors.muted, paddingHorizontal: 10, fontSize: 12, fontFamily: FONT_FAMILY.semiBold },
    otpButton: { width: '100%', marginBottom: 15 },
    signupContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 5 },
    signupText: { fontFamily: FONT_FAMILY.regular, color: colors.muted, fontSize: 13 },
    signupLink: { color: colors.primaryLight, fontSize: 13, fontFamily: FONT_FAMILY.bold },
    ageNotice: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      marginTop: 18, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.035)',
    },
    ageIcon: { marginRight: 7 },
    ageText: { fontSize: 11, color: colors.muted, textAlign: 'center' },
  }), [colors]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <Animated.View entering={FadeInUp.duration(500)} style={styles.header}>
            <View style={styles.topRow}>
              <TouchableOpacity activeOpacity={0.75} onPress={() => navigation.goBack()} style={styles.backButton}>
                <MaterialIcons name="arrow-back-ios" size={18} color={colors.text} />
              </TouchableOpacity>
              <View style={styles.brandContainer}>
                <Text style={styles.brand}>DAARUDOOR</Text>
                <Text style={styles.brandSubtext}>Premium drinks delivered</Text>
              </View>
            </View>

            <Text style={styles.title}>
              Welcome to <Text style={styles.titleAccent}>DaaruDoor</Text>
            </Text>

            <Text style={styles.subtitle}>
              Enter your email to continue
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150).duration(650)} style={styles.formCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <MaterialIcons name="email" size={21} color={colors.primaryLight} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Sign in</Text>
                <Text style={styles.sectionSubtitle}>Email Address</Text>
              </View>
            </View>

            <Input
              label="Email Address"
              placeholder="yourname@gmail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Button
              title="Login"
              onPress={handleContinue}
              loading={isLoading}
              variant={isFormValid ? 'primary' : 'disabled'}
              style={styles.loginButton}
            />
            
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword' as any)}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              title="Login with OTP"
              onPress={() => navigation.navigate('LoginOTP' as any, { targetPath })}
              variant="secondary"
              style={styles.otpButton}
            />

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.signupLink}>Signup</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(350).duration(500)} style={styles.ageNotice}>
            <MaterialIcons name="verified-user" size={15} color={colors.primaryLight} style={styles.ageIcon} />
            <Text style={styles.ageText}>DaaruDoor is an age-restricted service. 18+ only.</Text>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

