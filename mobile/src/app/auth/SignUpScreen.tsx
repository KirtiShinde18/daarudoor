import { useToast } from '../../providers/ToastProvider';

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';

import { RootStackParamList } from '../../navigation';
import { useAppTheme } from '../../constants/theme';
import { Button, Input } from '../../components/ui';
import { getApiBaseUrl } from '../../config/api.config';

type SignUpScreenProp = NativeStackNavigationProp<
  RootStackParamList,
  'SignUp'
>;

const SignUpScreen = () => {
  const { showToast } = useToast();
  const navigation = useNavigation<SignUpScreenProp>();
  const { colors } = useAppTheme();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | null>(null);
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isFormValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    email.includes('@') &&
    mobile.length === 10 &&
    /^[6-9]\d{9}$/.test(mobile) &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password) &&
    password === confirmPassword &&
    agreeTerms;

  const handleSignUp = async () => {
    if (isLoading) return;
    
    if (firstName.trim().length === 0) {
      showToast('Please enter your first name');
      return;
    }
    if (lastName.trim().length === 0) {
      showToast('Please enter your last name');
      return;
    }
    if (!email.includes('@')) {
      showToast('Please enter a valid email address');
      return;
    }
    if (mobile.length !== 10 || !/^[6-9]\d{9}$/.test(mobile)) {
      showToast('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      showToast('Password must be at least 8 characters, include one uppercase letter, one lowercase letter, one number, and one special character.');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match');
      return;
    }
    if (!agreeTerms) {
      showToast('Please agree to the Terms & Conditions and Privacy Policy');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const API_URL = getApiBaseUrl();

      console.log("[REGISTER] API Base URL:", API_URL);
      console.log("[REGISTER] Register endpoint:", `${API_URL}/api/auth/customer/register`);

      const response = await fetch(
        `${API_URL}/api/auth/customer/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: `${firstName} ${lastName}`.trim(),
            email,
            mobile,
            password,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        showToast('Customer registered successfully', 'success');
        navigation.replace('Login');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err: any) {
      setError('Network error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: colors.background,
        },

        container: {
          flex: 1,
        },

        scrollContent: {
          paddingHorizontal: 20,

          // Proper spacing from the top of the phone
          paddingTop: Platform.OS === 'ios' ? 18 : 32,

          paddingBottom: 45,
        },

        /* =========================
           HEADER
        ========================= */

        header: {
          marginBottom: 26,
        },

        topRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 28,
        },

        backButton: {
          width: 44,
          height: 44,
          borderRadius: 14,

          alignItems: 'center',
          justifyContent: 'center',

          backgroundColor: 'rgba(255,255,255,0.07)',

          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.10)',
        },

        brandContainer: {
          marginLeft: 14,
        },

        brand: {
          fontSize: 13,
          fontWeight: '800',
          letterSpacing: 2,

          color: colors.primaryLight,

          textTransform: 'uppercase',
        },

        brandSubtext: {
          fontSize: 11,
          color: colors.muted,
          marginTop: 3,
        },

        title: {
          fontSize: 20,
          lineHeight: 34,
          fontWeight: '800',

          color: colors.text,

          letterSpacing: -0.5,
          marginTop: -10,
        },

        titleAccent: {
          color: colors.primaryLight,
        },

        subtitle: {
          marginTop: 9,

          fontSize: 14,
          lineHeight: 21,

          color: colors.muted,

          maxWidth: 340,
        },

        /* =========================
           FORM CARD
        ========================= */

        formCard: {
          borderRadius: 26,

          padding: 20,

          backgroundColor: colors.card,

          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',

          shadowColor: '#000',

          shadowOffset: {
            width: 0,
            height: 12,
          },

          shadowOpacity: 0.22,
          shadowRadius: 24,

          elevation: 8,
        },

        sectionHeader: {
          flexDirection: 'row',
          alignItems: 'center',

          marginBottom: 18,
        },

        sectionIcon: {
          width: 38,
          height: 38,

          borderRadius: 12,

          alignItems: 'center',
          justifyContent: 'center',

          backgroundColor: 'rgba(106,4,9,0.18)',

          marginRight: 11,
        },

        sectionTitle: {
          fontSize: 16,
          fontWeight: '700',

          color: colors.text,
        },

        sectionSubtitle: {
          fontSize: 11,

          color: colors.muted,

          marginTop: 2,
        },

        /* =========================
           NAME ROW
        ========================= */

        row: {
          flexDirection: 'row',
          gap: 12,
        },

        halfInput: {
          flex: 1,
        },

        /* =========================
           GENDER
        ========================= */

        genderContainer: {
          marginTop: 3,
          marginBottom: 17,
        },

        label: {
          fontSize: 13,
          fontWeight: '700',

          color: colors.text,

          marginBottom: 9,
        },

        genderOptions: {
          flexDirection: 'row',
          gap: 12,
        },

        genderOption: {
          flex: 1,

          minHeight: 52,

          borderRadius: 14,

          borderWidth: 1,
          borderColor: colors.border,

          backgroundColor: 'rgba(255,255,255,0.035)',

          flexDirection: 'row',

          alignItems: 'center',
          justifyContent: 'center',

          gap: 8,
        },

        genderOptionActive: {
          borderColor: colors.primary,

          backgroundColor: 'rgba(106,4,9,0.22)',
        },

        genderIcon: {
          opacity: 0.65,
        },

        genderText: {
          color: colors.muted,

          fontSize: 14,

          fontWeight: '600',
        },

        genderTextActive: {
          color: colors.white,
        },

        /* =========================
           PASSWORD
        ========================= */

        passwordContainer: {
          position: 'relative',
        },

        eyeIcon: {
          position: 'absolute',

          right: 15,
          top: 39,

          width: 38,
          height: 38,

          alignItems: 'center',
          justifyContent: 'center',

          zIndex: 10,
        },

        /* =========================
           TERMS
        ========================= */

        checkboxContainer: {
          flexDirection: 'row',

          alignItems: 'flex-start',

          marginTop: 5,
          marginBottom: 22,
        },

        checkbox: {
          width: 22,
          height: 22,

          borderRadius: 7,

          borderWidth: 1,
          borderColor: colors.border,

          backgroundColor: 'rgba(255,255,255,0.035)',

          marginRight: 10,
          marginTop: 1,

          alignItems: 'center',
          justifyContent: 'center',
        },

        checkboxActive: {
          backgroundColor: colors.primary,

          borderColor: colors.primary,
        },

        termsText: {
          flex: 1,

          fontSize: 12,
          lineHeight: 19,

          color: colors.muted,
        },

        linkText: {
          color: colors.primaryLight,

          fontWeight: '700',
        },

        /* =========================
           ERROR
        ========================= */

        errorBox: {
          flexDirection: 'row',

          alignItems: 'center',

          paddingHorizontal: 12,
          paddingVertical: 11,

          borderRadius: 12,

          backgroundColor: 'rgba(190,18,60,0.10)',

          borderWidth: 1,
          borderColor: 'rgba(190,18,60,0.22)',

          marginBottom: 16,
        },

        errorText: {
          flex: 1,

          color: colors.error,

          fontSize: 12,
          lineHeight: 17,

          marginLeft: 8,
        },

        /* =========================
           SIGN UP
        ========================= */

        signUpButton: {
          marginBottom: 18,
        },

        /* =========================
           FOOTER
        ========================= */

        footer: {
          alignItems: 'center',

          justifyContent: 'center',

          flexDirection: 'row',
        },

        footerText: {
          color: colors.muted,

          fontSize: 13,
        },

        footerLink: {
          color: colors.primaryLight,

          fontSize: 13,

          fontWeight: '800',
        },

        /* =========================
           AGE NOTICE
        ========================= */

        ageNotice: {
          flexDirection: 'row',

          alignItems: 'center',

          justifyContent: 'center',

          marginTop: 20,

          paddingHorizontal: 12,
          paddingVertical: 10,

          borderRadius: 12,

          backgroundColor: 'rgba(255,255,255,0.035)',
        },

        ageIcon: {
          marginRight: 7,
        },

        ageText: {
          fontSize: 11,

          color: colors.muted,

          textAlign: 'center',
        },
      }),
    [colors]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* =========================
              HEADER
          ========================= */}

          <Animated.View
            entering={FadeInUp.duration(500)}
            style={styles.header}
          >
            <View style={styles.topRow}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <MaterialIcons
                  name="arrow-back-ios"
                  size={18}
                  color={colors.text}
                />
              </TouchableOpacity>

              <View style={styles.brandContainer}>
                <Text style={styles.brand}>
                  DAARUDOOR
                </Text>

                <Text style={styles.brandSubtext}>
                  Premium drinks delivered
                </Text>
              </View>
            </View>

            <Text style={styles.title}>
              Create your{' '}
              <Text style={styles.titleAccent}>
                account.
              </Text>
            </Text>

            <Text style={styles.subtitle}>
              Join DaaruDoor and discover your favorite
              drinks, delivered right to your doorstep.
            </Text>
          </Animated.View>

          {/* =========================
              FORM
          ========================= */}

          <Animated.View
            entering={FadeInDown.delay(150).duration(650)}
            style={styles.formCard}
          >
            {/* SECTION HEADER */}

            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <MaterialIcons
                  name="person-outline"
                  size={20}
                  color={colors.primaryLight}
                />
              </View>

              <View>
                <Text style={styles.sectionTitle}>
                  Personal details
                </Text>

                <Text style={styles.sectionSubtitle}>
                  Tell us a little about yourself
                </Text>
              </View>
            </View>

            {/* NAME */}

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Input
                  label="First Name"
                  placeholder="First name"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>

              <View style={styles.halfInput}>
                <Input
                  label="Last Name"
                  placeholder="Last name"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            {/* EMAIL */}

            <Input
              label="Email Address"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />

            {/* MOBILE */}

            <Input
              label="Mobile Number"
              placeholder="Enter 10 digit mobile number"
              keyboardType="phone-pad"
              value={mobile}
              onChangeText={setMobile}
              error={
                mobile.length > 0 && 
                (!/^[6-9]\d{9}$/.test(mobile) || mobile.length !== 10)
                  ? 'Must be a valid 10-digit Indian mobile number'
                  : undefined
              }
            />

            {/* PASSWORD */}

            <View style={styles.passwordContainer}>
              <Input
                label="Password"
                placeholder="Create a password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                error={
                  password.length > 0 && 
                  (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password) || password.length < 8)
                    ? 'Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char'
                    : undefined
                }
              />
            </View>

            <View style={styles.passwordContainer}>
              <Input
                label="Confirm Password"
                placeholder="Re-enter your password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                error={
                  confirmPassword.length > 0 &&
                    confirmPassword !== password
                    ? 'Passwords do not match'
                    : undefined
                }
              />
            </View>

            {/* ERROR */}

            {error ? (
              <View style={styles.errorBox}>
                <MaterialIcons
                  name="error-outline"
                  size={18}
                  color={colors.error}
                />

                <Text style={styles.errorText}>
                  {error}
                </Text>
              </View>
            ) : null}

            {/* TERMS */}

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.checkboxContainer}
              onPress={() =>
                setAgreeTerms(!agreeTerms)
              }
            >
              <View
                style={[
                  styles.checkbox,

                  agreeTerms &&
                  styles.checkboxActive,
                ]}
              >
                {agreeTerms && (
                  <MaterialIcons
                    name="check"
                    size={15}
                    color={colors.white}
                  />
                )}
              </View>

              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text style={styles.linkText}>
                  Terms & Conditions
                </Text>{' '}
                and{' '}
                <Text style={styles.linkText}>
                  Privacy Policy
                </Text>
              </Text>
            </TouchableOpacity>

            {/* SIGN UP BUTTON */}

            <Button
              title="Create Account"
              onPress={handleSignUp}
              loading={isLoading}
              variant={
                isFormValid
                  ? 'primary'
                  : 'disabled'
              }
              style={styles.signUpButton}
            />

            {/* LOGIN */}

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Already have an account?{' '}
              </Text>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate('Login')
                }
              >
                <Text style={styles.footerLink}>
                  Login
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* =========================
              18+ NOTICE
          ========================= */}

          <Animated.View
            entering={FadeInDown
              .delay(350)
              .duration(500)}
            style={styles.ageNotice}
          >
            <MaterialIcons
              name="verified-user"
              size={15}
              color={colors.primaryLight}
              style={styles.ageIcon}
            />

            <Text style={styles.ageText}>
              DaaruDoor is an age-restricted service.
              18+ only.
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUpScreen;
