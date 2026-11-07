import { useToast } from '../../providers/ToastProvider';
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Platform, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { setAuth, updateUser } from '../../store/slices/authSlice';
import { RootState } from '../../store';
import { RootStackParamList } from '../../navigation';
import { useAppTheme } from '../../constants/theme';
import { FONT_FAMILY } from '../../constants/typography';
import { Button } from '../../components/ui';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { getApiBaseUrl } from '../../config/api.config';

type GenderNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Gender'>;
type GenderRouteProp = RouteProp<RootStackParamList, 'Gender'>;

const GenderScreen = () => {
  const { showToast } = useToast();
  const navigation = useNavigation<GenderNavigationProp>();
  const route = useRoute<GenderRouteProp>();
  const { colors } = useAppTheme();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);

  const [selectedGender, setSelectedGender] = useState<'Male' | 'Female' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const targetPath = route.params?.targetPath;
  const birthYear = (route.params as any)?.birthYear;

  const handleContinue = async () => {
    if (!selectedGender) return;
    
    setIsLoading(true);
    try {
      const API_URL = getApiBaseUrl();
      
      const response = await fetch(`${API_URL}/api/auth/customer/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          birthYear,
          gender: selectedGender
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Update local user state
        dispatch(updateUser(data.user));
        const oldUser = await AsyncStorage.getItem('user');
        if (oldUser) {
          const parsed = JSON.parse(oldUser);
          await AsyncStorage.setItem('user', JSON.stringify({ ...parsed, ...data.user }));
        }
        
        if (targetPath) {
          if (['Home', 'Search', 'Cart', 'Profile'].includes(targetPath)) {
            navigation.navigate('Main', { screen: targetPath } as any);
          } else {
            navigation.navigate(targetPath as any);
          }
        } else {
          navigation.replace('Main');
        }
      } else {
        showToast(data.message || 'Failed to complete onboarding', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'transparent' },
    bottomSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      padding: 24,
      paddingTop: 32,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -10 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 20,
      minHeight: '50%',
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.05)',
    },
    title: { fontSize: 24, fontFamily: FONT_FAMILY.bold, color: colors.text, marginBottom: 30, textAlign: 'center' },
    genderOptions: { flexDirection: 'row', gap: 12, marginBottom: 30 },
    genderOption: {
      flex: 1,
      minHeight: 80,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: 'rgba(255,255,255,0.035)',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    genderOptionActive: {
      borderColor: colors.primary,
      backgroundColor: 'rgba(106,4,9,0.22)',
    },
    genderIcon: { opacity: 0.8 },
    genderText: { color: colors.muted, fontSize: 16, fontFamily: FONT_FAMILY.semiBold },
    genderTextActive: { color: colors.white },
    continueButton: { width: '100%', marginBottom: Platform.OS === 'ios' ? 20 : 0 },
  }), [colors]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.overlay}>
        <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.bottomSheet}>
          <Text style={styles.title}>What's your gender?</Text>

          <View style={styles.genderOptions}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.genderOption, selectedGender === 'Male' && styles.genderOptionActive]}
              onPress={() => setSelectedGender('Male')}
            >
              <MaterialIcons
                name="male"
                size={32}
                color={selectedGender === 'Male' ? colors.primaryLight : colors.muted}
                style={styles.genderIcon}
              />
              <Text style={[styles.genderText, selectedGender === 'Male' && styles.genderTextActive]}>Male</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.genderOption, selectedGender === 'Female' && styles.genderOptionActive]}
              onPress={() => setSelectedGender('Female')}
            >
              <MaterialIcons
                name="female"
                size={32}
                color={selectedGender === 'Female' ? colors.primaryLight : colors.muted}
                style={styles.genderIcon}
              />
              <Text style={[styles.genderText, selectedGender === 'Female' && styles.genderTextActive]}>Female</Text>
            </TouchableOpacity>
          </View>

          <Button 
            title="Continue" 
            onPress={handleContinue}
            loading={isLoading}
            variant={selectedGender ? 'primary' : 'disabled'}
            style={styles.continueButton}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

export default GenderScreen;
