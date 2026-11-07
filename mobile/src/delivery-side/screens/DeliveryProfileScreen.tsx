import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { getDeliveryProfile } from '../../api/delivery.api';
import { logoutUser } from '../../api/auth.api';
import { useAppTheme } from '../../constants/theme';
import { FONT_FAMILY } from '../../constants/typography';
import { store } from '../../store';
import { clearAuth } from '../../store/slices/authSlice';
import { ConfirmationModal } from '../../components/ui';
import { useToast } from '../../providers/ToastProvider';

export default function DeliveryProfileScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation<any>();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchProfile = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await getDeliveryProfile();
      if (response?.success && response?.data) {
        setProfile(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleConfirmLogout = async () => {
    try {
      setLoggingOut(true);
      await logoutUser();
    } catch (e) {
      console.warn('Logout error ignored:', e);
    } finally {
      setLoggingOut(false);
      setLogoutModalVisible(false);
      store.dispatch(clearAuth());
      showToast('Logged out successfully', 'info');
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  };

  const SettingRow = ({ icon, title, subtitle, onPress, destructive = false }: any) => (
    <TouchableOpacity onPress={onPress} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 16 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <MaterialIcons name={icon} size={24} color={destructive ? '#EF4444' : colors.primary} />
        <View style={{ marginLeft: 16, flex: 1 }}>
          <Text style={{ fontSize: 16, fontFamily: FONT_FAMILY.bold, color: destructive ? '#EF4444' : colors.text }}>{title}</Text>
          <Text style={{ fontSize: 12, fontFamily: FONT_FAMILY.regular, color: colors.muted, marginTop: 2 }}>{subtitle}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: colors.text }]}>Profile & Settings ⚙️</Text>
        <Text style={{ color: colors.muted }}>Manage your account</Text>
      </View>

      {loading && !profile ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchProfile(true)} tintColor={colors.primary} />}>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, alignItems: 'center', paddingVertical: 32 }]}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(106, 4, 9, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <MaterialIcons name="person" size={40} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 18, fontFamily: FONT_FAMILY.bold, color: colors.text }}>{profile?.name || 'Delivery Partner'}</Text>
            <Text style={{ fontSize: 14, fontFamily: FONT_FAMILY.regular, color: colors.muted, marginTop: 4 }}>{profile?.email || 'No email'}</Text>
            <Text style={{ fontSize: 14, fontFamily: FONT_FAMILY.regular, color: colors.muted, marginTop: 4 }}>{profile?.mobile || 'No phone'}</Text>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>
          <SettingRow
            icon="notifications"
            title="Notifications"
            subtitle="Manage alerts and updates"
            onPress={() => showToast('Notification settings will be available in the next update.', 'info')}
          />
          <SettingRow
            icon="language"
            title="Language"
            subtitle="Change app language"
            onPress={() => showToast('Language selection will be available in the next update.', 'info')}
          />
          <SettingRow
            icon="security"
            title="Security"
            subtitle="Password & privacy"
            onPress={() => showToast('Security settings will be available in the next update.', 'info')}
          />

          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>Account</Text>
          <SettingRow
            icon="logout"
            title="Logout"
            subtitle="Sign out of your account"
            onPress={() => setLogoutModalVisible(true)}
            destructive
          />

        </ScrollView>
      )}

      <ConfirmationModal
        visible={logoutModalVisible}
        title="Log Out?"
        description="Are you sure you want to log out of your delivery partner account? You will need to sign in again to receive orders."
        confirmText="Log Out"
        cancelText="Cancel"
        confirmVariant="danger"
        icon="logout"
        loading={loggingOut}
        disableBackdropDismiss={loggingOut}
        onConfirm={handleConfirmLogout}
        onCancel={() => {
          if (!loggingOut) {
            setLogoutModalVisible(false);
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  title: { fontSize: 20, fontFamily: FONT_FAMILY.bold },
  scroll: { padding: 20, paddingBottom: 100 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 18, fontFamily: FONT_FAMILY.bold, marginBottom: 16, marginLeft: 4 }
});
