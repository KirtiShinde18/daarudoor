import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../constants/theme';
import { Card, Button } from '../../components/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { setThemeMode, ThemeMode } from '../../store/slices/themeSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { requireAuth } from '../../utils/authGuard';
import { clearAuth } from '../../store/slices/authSlice';
import { clearCart } from '../../store/slices/cartSlice';
import { clearAddresses } from '../../store/slices/addressSlice';
import { getApiBaseUrl } from '../../config/api.config';

const ProfileScreen = () => {
  const { colors, isDark } = useAppTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  const userProfile = useSelector((state: any) => state.auth.user);

  const currentMode = useSelector((state: any) => state.theme.mode) as ThemeMode;

  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [loadingActiveOrders, setLoadingActiveOrders] = useState(false);

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const API_URL = getApiBaseUrl();

      const response = await fetch(`${API_URL}/api/auth/customer/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.user) {
        dispatch({ type: 'auth/updateUser', payload: data.user });
      } else if (response.status === 401 || response.status === 403) {
        dispatch(clearAuth());
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
      }
    } catch (e) {
      console.error('Failed to fetch profile', e);
    }
  };

  const fetchActiveOrders = async () => {
    try {
      setLoadingActiveOrders(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const API_URL = getApiBaseUrl();
      const response = await fetch(`${API_URL}/api/customer/orders/active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setActiveOrders(data.data);
      }
    } catch (e) {
      console.error("Failed to fetch active orders", e);
    } finally {
      setLoadingActiveOrders(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
      fetchActiveOrders();
    }, [])
  );

  const toggleTheme = async () => {
    const newMode: ThemeMode = isDark ? 'light' : 'dark';
    dispatch(setThemeMode(newMode));
    try {
      await AsyncStorage.setItem('@app_theme_mode', newMode);
    } catch (e) {
      console.error('Failed to save theme to AsyncStorage', e);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      dispatch(clearAuth());
      dispatch(clearCart());
      dispatch(clearAddresses());

      navigation.reset({
        index: 0,
        routes: [{ name: 'AuthSelection' }],
      });
    } catch (e) {
      console.error('Logout error', e);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 24,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    container: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingBottom: 120,
    },
    profileCard: {
      marginBottom: 32,
      alignItems: 'flex-start',
    },
    profileInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primaryDark,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    avatarText: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.white,
    },
    name: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    email: {
      fontSize: 14,
      color: colors.muted,
    },
    editBtn: {
      width: '100%',
      paddingVertical: 10,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.muted,
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    settingsGroup: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.card,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingText: {
      fontSize: 16,
      color: colors.text,
      marginLeft: 16,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginLeft: 56,
    },
    activeOrderBadge: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primaryLight,
      marginRight: 12,
    },
    logoutBtn: {
      borderColor: colors.border,
      marginTop: 16,
    }
  }), [colors]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile 👤</Text>
        </View>

        <Card style={styles.profileCard}>
          <View style={styles.profileInfo}>
            {userProfile?.profilePic ? (
              <Image source={{ uri: userProfile.profilePic }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {userProfile?.name ? userProfile.name.substring(0, 2).toUpperCase() : 'GD'}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{userProfile?.name || 'Customer'}</Text>
              <Text style={styles.email}>{userProfile?.email || ''}</Text>
              {userProfile?.mobile && (
                <Text style={styles.email}>{userProfile.mobile}</Text>
              )}
            </View>
          </View>
          <Button
            title="Edit Profile"
            variant="secondary"
            style={styles.editBtn}
            onPress={() => {
              navigation.navigate('EditProfile', { userProfile });
            }}
          />
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <View style={styles.settingsGroup}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="dark-mode" size={24} color={colors.primaryLight} />
                <Text style={styles.settingText}>Dark Mode</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={isDark ? colors.primary : colors.surface}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={styles.settingsGroup}>
            <TouchableOpacity style={styles.settingItem} onPress={() => {
              requireAuth(navigation, () => navigation.navigate('MyAddresses'), { targetPath: 'MyAddresses' });
            }}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="local-shipping" size={24} color={colors.primaryLight} />
                <Text style={styles.settingText}>Delivery Addresses</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="payment" size={24} color={colors.primaryLight} />
                <Text style={styles.settingText}>Payment Methods</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="notifications" size={24} color={colors.primaryLight} />
                <Text style={styles.settingText}>Notifications</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Orders</Text>
          <View style={styles.settingsGroup}>
            <TouchableOpacity style={styles.settingItem} onPress={() => {
              requireAuth(navigation, () => navigation.navigate('OrderHistory'), { targetPath: 'OrderHistory' });
            }}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="history" size={24} color={colors.text} />
                <Text style={styles.settingText}>Order History</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Track Active Orders</Text>
          {loadingActiveOrders ? (
            <View style={[styles.settingsGroup, { padding: 24, alignItems: 'center' }]}>
              <Text style={{ color: colors.muted }}>Loading active orders...</Text>
            </View>
          ) : activeOrders.length > 0 ? (
            activeOrders.map(order => (
              <View key={order._id} style={[styles.settingsGroup, { marginBottom: 16, padding: 16 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ fontWeight: 'bold', color: colors.text }}>Order #{order._id.slice(-6).toUpperCase()}</Text>
                  <Text style={{ fontSize: 12, color: colors.primary }}>{order.status}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 24, marginRight: 12 }}>🛵</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 14 }}>{order.products?.length || 0} items</Text>
                    <Text style={{ color: colors.muted, fontSize: 12 }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                {order.deliveryPartner && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, padding: 8, backgroundColor: colors.background, borderRadius: 8 }}>
                    <MaterialIcons name="person" size={16} color={colors.muted} style={{ marginRight: 8 }} />
                    <Text style={{ color: colors.text, fontSize: 12 }}>Partner: {order.deliveryPartner.name}</Text>
                  </View>
                )}
                <Button
                  title="Track Live Order"
                  onPress={() => navigation.navigate('TrackOrder', { orderId: order._id })}
                  style={{ marginTop: 8 }}
                />
              </View>
            ))
          ) : (
            <View style={[styles.settingsGroup, { padding: 24, alignItems: 'center' }]}>
              <Text style={{ fontSize: 24, marginBottom: 8 }}>🛵</Text>
              <Text style={{ color: colors.muted, marginBottom: 12 }}>No active deliveries right now</Text>
              <Button
                title="View Order History"
                variant="secondary"
                onPress={() => navigation.navigate('OrderHistory')}
              />
            </View>
          )}
        </View>

        <Button
          title="Log Out"
          variant="secondary"
          style={styles.logoutBtn}
          textStyle={{ color: colors.error }}
          onPress={handleLogout}
        />

      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
