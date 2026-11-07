
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import {
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { getDeliveryDashboardStats } from '../../api/delivery.api';
import { useAppTheme } from '../../constants/theme';
import { FONT_FAMILY } from '../../constants/typography';
import { ConfirmationModal } from '../../components/ui';
import { useToast } from '../../providers/ToastProvider';

const BRAND = {
  primary: '#6A0409',
  dark: '#370617',
  green: '#16A34A',
  gold: '#D4AF72',
  blue: '#2563EB',
  purple: '#9333EA',
  red: '#DC2626',
};

const SCREEN_WIDTH = Dimensions.get('window').width;

type DashboardStats = {
  todayDeliveries?: number;
  outForDelivery?: number;
  pendingDeliveries?: number;
  totalAssigned?: number;
};

type StatCardProps = {
  title: string;
  value: number;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  color: string;
  colors: any;
  subtitle: string;
  onPress: () => void;
};

function StatCard({
  title,
  value,
  icon,
  color,
  colors,
  subtitle,
  onPress,
}: StatCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={onPress}
      accessibilityRole="button"
      style={[
        styles.statCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.statTopRow}>
        <View
          style={[
            styles.statIcon,
            { backgroundColor: `${color}15` },
          ]}
        >
          <MaterialIcons name={icon} size={23} color={color} />
        </View>

        {/* <MaterialIcons
          name="north-east"
          size={17}
          color={colors.muted}
        /> */}
      </View>

      <Text style={[styles.statValue, { color: colors.text }]}>
        {value}
      </Text>

      <Text style={[styles.statTitle, { color: colors.text }]}>
        {title}
      </Text>

      <Text style={[styles.statSubtitle, { color: colors.muted }]}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

export default function DeliveryDashboardScreen() {
  const { colors, isDark } = useAppTheme();
  const { showToast } = useToast();
  const isFocused = useIsFocused();
  const navigation = useNavigation<any>();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // This is only a local UI preference until a real availability
  // API is connected. Do not treat it as server-confirmed status.
  const [isOnline, setIsOnline] = useState(true);
  const [confirmOnlineModal, setConfirmOnlineModal] = useState(false);

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await getDeliveryDashboardStats();

      if (response?.success && response?.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch delivery dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      fetchStats();
    }
  }, [isFocused, fetchStats]);

  const toggleAvailability = () => {
    setConfirmOnlineModal(true);
  };

  const delivered = stats?.todayDeliveries ?? 0;
  const active = stats?.outForDelivery ?? 0;
  const pending = stats?.pendingDeliveries ?? 0;
  const assigned = stats?.totalAssigned ?? 0;

  const openShipments = () => {
    // Change "Shipments" only if your navigator uses a different route name.
    navigation.navigate('Shipments');
  };

  type ShipmentFilter = 'assigned' | 'pending' | 'active' | 'delivered';

  const openDeliveryCategory = (filter: ShipmentFilter) => {
    navigation.navigate('Shipments', { filter });
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
      edges={['top']}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={BRAND.dark}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchStats(true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.greeting, { color: colors.muted }]}>
              WELCOME BACK
            </Text>

            <Text style={[styles.title, { color: colors.text }]}>
              Dashboard
            </Text>

            <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
              Your delivery overview
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleAvailability}
            style={[
              styles.availabilityButton,
              {
                backgroundColor: colors.card,
                borderColor: isOnline ? '#86EFAC' : colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isOnline
                    ? BRAND.green
                    : colors.muted,
                },
              ]}
            />

            <Text
              style={[
                styles.statusText,
                { color: isOnline ? BRAND.green : colors.muted },
              ]}
            >
              {isOnline ? 'Online' : 'Offline'}
            </Text>

            <MaterialIcons
              name="keyboard-arrow-down"
              size={17}
              color={colors.muted}
            />
          </TouchableOpacity>
        </View>

        {/* Availability warning */}
        {!isOnline && (
          <View
            style={[
              styles.offlineBanner,
              {
                backgroundColor: isDark ? '#3B1719' : '#FEF2F2',
                borderColor: isDark ? '#7F1D1D' : '#FECACA',
              },
            ]}
          >
            <View style={styles.offlineIcon}>
              <MaterialIcons
                name="cloud-off"
                size={21}
                color={BRAND.red}
              />
            </View>

            <View style={styles.bannerContent}>
              <Text style={styles.offlineTitle}>
                You are offline
              </Text>
              <Text style={styles.offlineText}>
                You may not receive new delivery assignments.
              </Text>
            </View>
          </View>
        )}

        {/* Performance hero */}
        <LinearGradient
          colors={[BRAND.primary, '#50040A', BRAND.dark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.performanceCard}
        >
          <View style={styles.decorCircleOne} />
          <View style={styles.decorCircleTwo} />

          <View style={styles.performanceHeader}>
            <View>
              <View style={styles.performanceEyebrow}>
                <MaterialIcons
                  name="insights"
                  size={15}
                  color="#FFFFFF"
                />
                <Text style={styles.performanceEyebrowText}>
                  YOUR PERFORMANCE
                </Text>
              </View>

              <Text style={styles.performanceTitle}>
                Today's Activity
              </Text>

              <Text style={styles.performanceSubtitle}>
                Keep up the great work!
              </Text>
            </View>

            <View style={styles.performanceBadge}>
              <MaterialIcons
                name="local-shipping"
                size={24}
                color="#FFFFFF"
              />
            </View>
          </View>

          <View style={styles.performanceDivider} />

          {loading && !stats ? (
            <ActivityIndicator
              color="#FFFFFF"
              size="large"
              style={styles.performanceLoader}
            />
          ) : (
            <View style={styles.performanceStats}>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceValue}>{delivered}</Text>
                <View style={styles.performanceLabelRow}>
                  <MaterialIcons
                    name="check-circle"
                    size={13}
                    color="#86EFAC"
                  />
                  <Text style={styles.performanceLabel}>
                    Delivered
                  </Text>
                </View>
              </View>

              <View style={styles.performanceSeparator} />

              <View style={styles.performanceItem}>
                <Text style={styles.performanceValue}>{active}</Text>
                <View style={styles.performanceLabelRow}>
                  <MaterialIcons
                    name="local-shipping"
                    size={13}
                    color="#FDE68A"
                  />
                  <Text style={styles.performanceLabel}>
                    Active
                  </Text>
                </View>
              </View>

              <View style={styles.performanceSeparator} />

              <View style={styles.performanceItem}>
                <Text style={styles.performanceValue}>{pending}</Text>
                <View style={styles.performanceLabelRow}>
                  <MaterialIcons
                    name="schedule"
                    size={13}
                    color="#FDBA74"
                  />
                  <Text style={styles.performanceLabel}>
                    Pending
                  </Text>
                </View>
              </View>
            </View>
          )}
        </LinearGradient>

        {/* Overview section */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Delivery Overview
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
              Track your current workload
            </Text>
          </View>

          <View style={styles.overviewIcon}>
            <MaterialIcons
              name="dashboard"
              size={21}
              color={BRAND.primary}
            />
          </View>
        </View>

        {loading && !stats ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BRAND.primary} />
            <Text style={[styles.loadingText, { color: colors.muted }]}>
              Loading delivery statistics...
            </Text>
          </View>
        ) : (
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Assigned"
              value={assigned}
              icon="assignment"
              color={BRAND.blue}
              colors={colors}
              subtitle="All assigned orders"
              onPress={() => navigation.navigate('DeliveryOrders')}
            />

            <StatCard
              title="Pending"
              value={pending}
              icon="pending-actions"
              color={BRAND.gold}
              colors={colors}
              subtitle="Awaiting completion"
              onPress={() => openDeliveryCategory('pending')}
            />

            <StatCard
              title="Out for Delivery"
              value={active}
              icon="local-shipping"
              color={BRAND.purple}
              colors={colors}
              subtitle="Currently in transit"
              onPress={() => openDeliveryCategory('active')}
            />

            <StatCard
              title="Delivered Today"
              value={delivered}
              icon="task-alt"
              color={BRAND.green}
              colors={colors}
              subtitle="Completed today"
              onPress={() => openDeliveryCategory('delivered')}
            />
          </View>
        )}

        {/* Active shipment CTA */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={openShipments}
          style={styles.shipmentButton}
        >
          <LinearGradient
            colors={[BRAND.primary, BRAND.dark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shipmentGradient}
          >
            <View style={styles.shipmentIcon}>
              <MaterialIcons
                name="route"
                size={25}
                color="#FFFFFF"
              />
            </View>

            <View style={styles.shipmentTextWrap}>
              <Text style={styles.shipmentTitle}>
                Manage Deliveries
              </Text>
              <Text style={styles.shipmentSubtitle}>
                View shipments and track orders
              </Text>
            </View>

            <MaterialIcons
              name="arrow-forward"
              size={22}
              color="#FFFFFF"
            />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.footer}>
          <MaterialIcons
            name="local-shipping"
            size={17}
            color={colors.muted}
          />
          <Text style={[styles.footerText, { color: colors.muted }]}>
            DaaruDoor Delivery Partner
          </Text>
        </View>
      </ScrollView>

      <ConfirmationModal
        visible={confirmOnlineModal}
        title={!isOnline ? 'Go Online?' : 'Go Offline?'}
        description={
          !isOnline
            ? 'You will become available for new delivery assignments in real time.'
            : 'You will stop receiving new delivery assignments until you go online again.'
        }
        confirmText={!isOnline ? 'Yes, Go Online' : 'Go Offline'}
        cancelText="Cancel"
        confirmVariant={!isOnline ? 'primary' : 'secondary'}
        icon={!isOnline ? 'cloud-done' : 'cloud-off'}
        onConfirm={() => {
          const next = !isOnline;
          setIsOnline(next);
          setConfirmOnlineModal(false);
          showToast(next ? 'You are now Online and available for orders.' : 'You are now Offline.', 'info');
        }}
        onCancel={() => setConfirmOnlineModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scroll: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 120,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
    gap: 10,
  },

  headerText: {
    flex: 1,
  },

  greeting: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bold,
    letterSpacing: 1.6,
    marginBottom: 6,
  },

  title: {
    fontSize: 20,
    fontFamily: FONT_FAMILY.bold,
    letterSpacing: -0.8,
  },

  headerSubtitle: {
    fontSize: 12,
    marginTop: 5,
  },

  availabilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  statusText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
  },

  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    borderRadius: 17,
    borderWidth: 1,
    marginBottom: 20,
  },

  offlineIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  bannerContent: {
    flex: 1,
  },

  offlineTitle: {
    color: BRAND.red,
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
    marginBottom: 4,
  },

  offlineText: {
    color: BRAND.red,
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    lineHeight: 16,
  },

  performanceCard: {
    borderRadius: 27,
    padding: 22,
    marginBottom: 29,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
  },

  decorCircleOne: {
    position: 'absolute',
    top: -65,
    right: -35,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  decorCircleTwo: {
    position: 'absolute',
    bottom: -95,
    left: 65,
    width: 175,
    height: 175,
    borderRadius: 88,
    borderWidth: 24,
    borderColor: 'rgba(255,255,255,0.035)',
  },

  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  performanceEyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },

  performanceEyebrowText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 9,
    fontFamily: FONT_FAMILY.bold,
    letterSpacing: 1.2,
  },

  performanceTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: FONT_FAMILY.bold,
    letterSpacing: -0.5,
  },

  performanceSubtitle: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
    marginTop: 6,
  },

  performanceBadge: {
    width: 49,
    height: 49,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.13)',
  },

  performanceDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.17)',
    marginVertical: 22,
  },

  performanceLoader: {
    marginVertical: 14,
  },

  performanceStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  performanceItem: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
  },

  performanceValue: {
    color: '#FFFFFF',
    fontSize: SCREEN_WIDTH < 360 ? 25 : 30,
    fontFamily: FONT_FAMILY.bold,
    marginBottom: 8,
  },

  performanceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  performanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontFamily: FONT_FAMILY.bold,
  },

  performanceSeparator: {
    width: 1,
    height: 42,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 5,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 17,
  },

  sectionTitle: {
    fontSize: 18,
    fontFamily: FONT_FAMILY.bold,
    letterSpacing: -0.4,
  },

  sectionSubtitle: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
    marginTop: 5,
  },

  overviewIcon: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: '#FCE7E9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  statCard: {
    width: '48.2%',
    padding: 15,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 13,
    minHeight: 165,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },

  statTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 17,
  },

  statIcon: {
    width: 43,
    height: 43,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statValue: {
    fontSize: 28,
    fontFamily: FONT_FAMILY.bold,
    marginBottom: 5,
  },

  statTitle: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
    lineHeight: 17,
  },

  statSubtitle: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.regular,
    marginTop: 5,
    lineHeight: 14,
  },

  loadingContainer: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
  },

  shipmentButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 10,
    elevation: 5,
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },

  shipmentGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 17,
  },

  shipmentIcon: {
    width: 47,
    height: 47,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  shipmentTextWrap: {
    flex: 1,
  },

  shipmentTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONT_FAMILY.bold,
  },

  shipmentSubtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 10,
    fontFamily: FONT_FAMILY.regular,
    marginTop: 5,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    marginTop: 24,
  },

  footerText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.semiBold,
  },
});
