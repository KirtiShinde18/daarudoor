import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Modal, FlatList, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useAppTheme } from '../../constants/theme';
import { FONT_FAMILY } from '../../constants/typography';
import { Button } from '../../components/ui';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

type AgeVerificationNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AgeVerification'>;
type AgeVerificationRouteProp = RouteProp<RootStackParamList, 'AgeVerification'>;

const AgeVerificationScreen = () => {
  const navigation = useNavigation<AgeVerificationNavigationProp>();
  const route = useRoute<AgeVerificationRouteProp>();
  const { colors } = useAppTheme();

  const currentYear = new Date().getFullYear();
  const minLegalAge = 18; // From instructions
  const maxEligibleYear = currentYear - minLegalAge;

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const years = Array.from({ length: 60 }, (_, i) => maxEligibleYear - i);

  const targetPath = route.params?.targetPath;

  const handleContinue = () => {
    if (selectedYear) {
      navigation.navigate('Gender', { targetPath, birthYear: selectedYear } as any);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, justifyContent: 'flex-end' }, // push to bottom
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
    title: { fontSize: 24, fontFamily: FONT_FAMILY.bold, color: colors.text, marginBottom: 8, textAlign: 'center' },
    subtitle: { fontSize: 14, fontFamily: FONT_FAMILY.regular, color: colors.muted, textAlign: 'center', marginBottom: 30 },
    dropdownButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 20,
      paddingVertical: 18,
      marginBottom: 30,
    },
    dropdownText: { fontSize: 16, color: colors.text, fontFamily: FONT_FAMILY.semiBold },
    dropdownTextPlaceholder: { fontSize: 16, fontFamily: FONT_FAMILY.regular, color: colors.muted },
    continueButton: { width: '100%', marginBottom: Platform.OS === 'ios' ? 20 : 0 },
    
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 20,
      width: '80%',
      maxHeight: '60%',
      overflow: 'hidden',
    },
    modalHeader: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      alignItems: 'center',
    },
    modalTitle: { fontSize: 18, fontFamily: FONT_FAMILY.bold, color: colors.text },
    yearItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.05)',
      alignItems: 'center',
    },
    yearText: { fontSize: 16, fontFamily: FONT_FAMILY.regular, color: colors.text },
  }), [colors]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.overlay}>
        <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.bottomSheet}>
          <Text style={styles.title}>What's your birth year?</Text>
          <Text style={styles.subtitle}>You must be at least {minLegalAge} to use DaaruDoor.</Text>

          <TouchableOpacity 
            style={styles.dropdownButton} 
            activeOpacity={0.7}
            onPress={() => setModalVisible(true)}
          >
            <Text style={selectedYear ? styles.dropdownText : styles.dropdownTextPlaceholder}>
              {selectedYear ? selectedYear.toString() : 'Select your birth year'}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color={colors.muted} />
          </TouchableOpacity>

          <Button 
            title="Continue" 
            onPress={handleContinue}
            variant={selectedYear ? 'primary' : 'disabled'}
            style={styles.continueButton}
          />
        </Animated.View>
      </View>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Year</Text>
            </View>
            <FlatList
              data={years}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.yearItem}
                  onPress={() => {
                    setSelectedYear(item);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.yearText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default AgeVerificationScreen;
