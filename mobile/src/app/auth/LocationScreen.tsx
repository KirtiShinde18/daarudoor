import { useToast } from '../../providers/ToastProvider';
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useAppTheme } from '../../constants/theme';
import { FONT_FAMILY } from '../../constants/typography';
import { Button, Card, Input } from '../../components/ui';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

import * as Location from 'expo-location';

type LocationScreenProp = NativeStackNavigationProp<RootStackParamList, 'Location'>;

const LocationScreen = () => {
  const { showToast } = useToast();
  const navigation = useNavigation<LocationScreenProp>();
  const [isDetecting, setIsDetecting] = useState(false);
  const [address, setAddress] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const { colors } = useAppTheme();

  const detectLocation = async () => {
    setIsDetecting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast('Permission to access location was denied');
        setIsDetecting(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      const [geocodedAddress] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (geocodedAddress) {
        const formatted = `${geocodedAddress.street || geocodedAddress.name || ''}, ${geocodedAddress.city || ''}, ${geocodedAddress.region || ''}`;
        setAddress(formatted);
      } else {
        setAddress(`${latitude}, ${longitude}`);
      }
    } catch (error) {
      console.log(error);
      showToast('Failed to get current location. Please try again or enter manually.');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleManualSubmit = () => {
    if (manualAddress.trim().length > 5) {
      setAddress(manualAddress);
      setShowManualInput(false);
    }
  };

  const handleContinue = () => {
    if (address) {
      navigation.replace('SignUp');
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      padding: 24,
    },
    header: {
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 40,
    },
    iconContainer: {
      marginBottom: 20,
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    glow: {
      position: 'absolute',
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.primary,
      opacity: 0.5,
      shadowColor: colors.primaryDark,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 30,
      elevation: 10,
    },
    title: {
      fontSize: 26,
      fontFamily: FONT_FAMILY.bold,
      color: colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    subtitle: {
      fontSize: 15,
      fontFamily: FONT_FAMILY.regular,
      color: colors.muted,
      textAlign: 'center',
      lineHeight: 22,
    },
    content: {
      flex: 1,
    },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    optionIconBg: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    optionTextContainer: {
      flex: 1,
    },
    optionTitle: {
      color: colors.text,
      fontSize: 16,
      fontFamily: FONT_FAMILY.semiBold,
      marginBottom: 4,
    },
    optionSubtitle: {
      color: colors.muted,
      fontSize: 13,
      fontFamily: FONT_FAMILY.regular,
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 24,
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      color: colors.muted,
      paddingHorizontal: 16,
      fontSize: 12,
      fontFamily: FONT_FAMILY.semiBold,
    },
    manualInputContainer: {
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectedLocationCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.primaryDark,
      borderRadius: 12,
      padding: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    selectedRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      flex: 1,
    },
    addressInfo: {
      marginLeft: 12,
      flex: 1,
    },
    addressLabel: {
      color: colors.muted,
      fontSize: 12,
      marginBottom: 4,
    },
    addressText: {
      color: colors.text,
      fontSize: 15,
      fontFamily: FONT_FAMILY.medium,
      lineHeight: 22,
    },
    changeText: {
      color: colors.primaryLight,
      fontSize: 14,
      fontFamily: FONT_FAMILY.semiBold,
    },
    footer: {
      paddingTop: 16,
    }
  }), [colors]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Header / Welcome */}
        <Animated.View entering={FadeInUp.delay(100).duration(800)} style={styles.header}>
          <View style={styles.iconContainer}>
            <View style={styles.glow} />
            <MaterialCommunityIcons name="map-marker-radius" size={48} color={colors.text} />
          </View>
          <Text style={styles.title}>Where should we deliver?</Text>
          <Text style={styles.subtitle}>Enter your location to discover your favorite drinks available near you.</Text>
        </Animated.View>

        {/* Location Selection */}
        <View style={styles.content}>
          {address ? (
            <Animated.View entering={FadeInUp.duration(600)} style={styles.selectedLocationCard}>
              <View style={styles.selectedRow}>
                <MaterialIcons name="location-on" size={24} color={colors.primary} />
                <View style={styles.addressInfo}>
                  <Text style={styles.addressLabel}>Delivery Location</Text>
                  <Text style={styles.addressText}>{address}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => { setAddress(''); setManualAddress(''); }}>
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInUp.delay(300).duration(800)}>
              
              <TouchableOpacity 
                style={styles.optionCard}
                onPress={detectLocation}
                disabled={isDetecting}
              >
                <View style={styles.optionIconBg}>
                  <MaterialIcons name="my-location" size={24} color={colors.primary} />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Use Current Location</Text>
                  <Text style={styles.optionSubtitle}>Allow access to your current location</Text>
                </View>
                {isDetecting && <ActivityIndicator color={colors.primary} size="small" />}
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.divider} />
              </View>

              {!showManualInput ? (
                <TouchableOpacity 
                  style={styles.optionCard}
                  onPress={() => setShowManualInput(true)}
                >
                  <View style={styles.optionIconBg}>
                    <MaterialIcons name="search" size={24} color={colors.text} />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>Enter your address</Text>
                    <Text style={styles.optionSubtitle}>Search area, street, building or landmark</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <Animated.View entering={FadeInUp.duration(400)} style={styles.manualInputContainer}>
                  <Input 
                    placeholder="Search area, street..."
                    value={manualAddress}
                    onChangeText={setManualAddress}
                    autoFocus
                  />
                  <Button 
                    title="Confirm Address" 
                    onPress={handleManualSubmit}
                    variant={manualAddress.trim().length > 5 ? 'primary' : 'disabled'}
                  />
                </Animated.View>
              )}
            </Animated.View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Button 
            title="Continue" 
            onPress={handleContinue}
            variant={address ? 'primary' : 'disabled'}
          />
        </View>

      </View>
    </SafeAreaView>
  );
};

export default LocationScreen;
