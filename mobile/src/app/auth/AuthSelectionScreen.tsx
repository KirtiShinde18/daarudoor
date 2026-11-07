import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useAppTheme } from '../../constants/theme';
import { FONT_FAMILY } from '../../constants/typography';
import { Button } from '../../components/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

type AuthSelectionProp = NativeStackNavigationProp<RootStackParamList, 'AuthSelection'>;

const AuthSelectionScreen = () => {
  const navigation = useNavigation<AuthSelectionProp>();
  const { colors } = useAppTheme();

  const styles = useMemo(() => StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      paddingHorizontal: 24,
      justifyContent: 'center',
    },
    heroSection: {
      alignItems: 'center',
      marginBottom: 60,
    },
    iconContainer: {
      marginBottom: 32,
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    glow: {
      position: 'absolute',
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      opacity: 0.4,
      shadowColor: colors.primaryDark,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 40,
      elevation: 20,
    },
    title: {
      fontSize: 32,
      fontFamily: FONT_FAMILY.bold,
      color: colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: FONT_FAMILY.regular,
      color: colors.muted,
      textAlign: 'center',
      lineHeight: 24,
      paddingHorizontal: 20,
    },
    buttonContainer: {
      width: '100%',
    },
    card: {
      backgroundColor: colors.card,
      padding: 24,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 16,
      fontFamily: FONT_FAMILY.semiBold,
      marginBottom: 16,
      textAlign: 'center',
    },
    button: {
      width: '100%',
    },
    dividerContainer: {
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
    },
    divider: {
      height: 32,
      width: 1,
      backgroundColor: colors.border,
    }
  }), [colors]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        <View style={styles.heroSection}>
          <Animated.View entering={FadeInUp.delay(100).duration(800)} style={styles.iconContainer}>
            <View style={styles.glow} />
            <MaterialCommunityIcons name="bottle-wine" size={64} color={colors.text} />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300).duration(800)}>
            <Text style={styles.title}>Welcome to DaaruDoor</Text>
            <Text style={styles.subtitle}>Create an account or login to continue your order.</Text>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInUp.delay(600).duration(800)} style={styles.buttonContainer}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>New Customer?</Text>
            <Button
              title="Sign Up"
              onPress={() => navigation.navigate('SignUp')}
              style={styles.button}
            />
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Existing Customer?</Text>
            <Button
              title="Login"
              variant="secondary"
              onPress={() => navigation.navigate('Login')}
              style={styles.button}
            />
          </View>
        </Animated.View>

      </View>
    </SafeAreaView>
  );
};

export default AuthSelectionScreen;
