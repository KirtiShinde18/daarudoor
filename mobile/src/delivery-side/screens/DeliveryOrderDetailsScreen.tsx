import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { getDeliveryOrderDetails, updateOrderStatus, updateOrderLocation } from '../../api/delivery.api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../constants/theme';
import { FONT_FAMILY } from '../../constants/typography';
import { MaterialIcons } from '@expo/vector-icons';
import { Button, OrderStatusBadge, ConfirmationModal } from '../../components/ui';
import { useRoute, useNavigation } from '@react-navigation/native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import socketClient from '../../services/socketClient';
import { useToast } from '../../providers/ToastProvider';

const BRAND = {
  primary: '#6A0409',
  dark: '#370617',
  cream: '#FFF9F0',
  gold: '#D4AF72',
  pink: '#FCE7E9',
  green: '#22C55E',
  blue: '#3B82F6',
};

interface ConfirmModalConfig {
  visible: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'secondary' | 'outline' | 'success' | 'danger';
  icon?: keyof typeof MaterialIcons.glyphMap;
  onConfirm: () => Promise<void>;
}

export default function DeliveryOrderDetailsScreen() {
  const { colors, isDark } = useAppTheme();
  const { showToast } = useToast();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { orderId } = route.params;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState<any>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalConfig | null>(null);

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const mapRef = useRef<MapView>(null);
  const lastLocationSentAt = useRef<number>(0);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await getDeliveryOrderDetails(orderId);
      if (res?.success && res.data) {
        setOrder(res.data);
      } else {
        showToast('Could not load order details.', 'error');
      }
    } catch (e: any) {
      console.error('fetchOrder error:', e);
      showToast(e?.response?.data?.message || 'Could not fetch order details.', 'error');
    } finally {
      setLoading(false);
    }
  }, [orderId, showToast]);

  // Request foreground permission and start tracking
  const startWatchingLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast('Location permission is required for live delivery tracking.', 'error');
        return;
      }

      setIsTrackingActive(true);

      // Clean up existing watcher if any
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        async (loc) => {
          const { latitude, longitude, heading, speed, accuracy } = loc.coords;
          const newLoc = { latitude, longitude, heading: heading || 0 };

          setDeliveryLocation(newLoc);
          setRouteCoordinates((prev) => [...prev, newLoc]);

          // Throttle network sending to once every 4 seconds to balance accuracy and battery
          const now = Date.now();
          if (now - lastLocationSentAt.current >= 4000) {
            lastLocationSentAt.current = now;

            // 1. Emit via authenticated Socket.IO for near-zero latency
            socketClient.emitDeliveryLocation({
              orderId,
              latitude,
              longitude,
              heading: heading || 0,
              speed: speed || 0,
              accuracy: accuracy || 0,
            });

            // 2. Persist to backend database via REST API
            try {
              await updateOrderLocation(
                orderId,
                latitude,
                longitude,
                heading || 0,
                speed || 0,
                accuracy || 0
              );
            } catch (err) {
              console.warn('REST location update silent error:', err);
            }
          }
        }
      );
    } catch (e) {
      console.error('Error starting location watcher:', e);
    }
  };

  const stopWatchingLocation = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    setIsTrackingActive(false);
  };

  useEffect(() => {
    fetchOrder();

    // Connect to Socket.IO and listen for room updates
    socketClient.connect().then(() => {
      socketClient.joinOrder(orderId, (initialData) => {
        if (initialData?.currentLocation) {
          setDeliveryLocation(initialData.currentLocation);
        }
      });
    });

    return () => {
      stopWatchingLocation();
      socketClient.leaveOrder(orderId);
    };
  }, [orderId, fetchOrder]);

  // Start tracking automatically if order is in active delivery state
  useEffect(() => {
    if (order) {
      const activeStates = ['ACCEPTED', 'OUT_FOR_DELIVERY', 'ARRIVED'];
      if (activeStates.includes(order.status) && !locationSubscription.current) {
        startWatchingLocation();
      } else if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
        stopWatchingLocation();
      }
    }
  }, [order?.status]);

  // Determine Customer coordinates
  const getCustomerCoordinates = () => {
    if (!order) return null;
    if (order.deliveryAddress?.latitude && order.deliveryAddress?.longitude) {
      return {
        latitude: Number(order.deliveryAddress.latitude),
        longitude: Number(order.deliveryAddress.longitude),
      };
    }
    if (order.customer?.location?.latitude && order.customer?.location?.longitude) {
      return {
        latitude: Number(order.customer.location.latitude),
        longitude: Number(order.customer.location.longitude),
      };
    }
    return null;
  };

  const customerCoords = getCustomerCoordinates();

  // Format full address string
  const getFormattedAddress = () => {
    if (!order) return 'Address unavailable';
    if (typeof order.deliveryAddress === 'string') return order.deliveryAddress;

    const addr = order.deliveryAddress || {};
    const parts = [
      addr.houseNo ? `House/Flat: ${addr.houseNo}` : '',
      addr.building ? addr.building : '',
      addr.area ? addr.area : '',
      addr.landmark ? `Near ${addr.landmark}` : '',
      addr.city ? addr.city : '',
      addr.state ? addr.state : '',
      addr.pincode ? `PIN: ${addr.pincode}` : '',
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : 'Address not specified';
  };

  // Launch Native Directions (Google Maps / Apple Maps)
  const handleNavigateToCustomer = () => {
    if (customerCoords) {
      const latLng = `${customerCoords.latitude},${customerCoords.longitude}`;
      const customerName = order.deliveryAddress?.fullName || order.customer?.name || 'Customer';
      const label = encodeURIComponent(`Customer Delivery: ${customerName}`);

      const url = Platform.select({
        ios: `maps:0,0?q=${label}@${latLng}`,
        android: `google.navigation:q=${latLng}`,
      });

      const webFallback = `https://www.google.com/maps/dir/?api=1&destination=${latLng}`;

      Linking.canOpenURL(url as string)
        .then((supported) => {
          if (supported) {
            return Linking.openURL(url as string);
          }
          return Linking.openURL(webFallback);
        })
        .catch(() => Linking.openURL(webFallback));
    } else {
      const fullAddress = getFormattedAddress();
      const encodedAddr = encodeURIComponent(fullAddress);
      const url = Platform.select({
        ios: `maps:0,0?q=${encodedAddr}`,
        android: `google.navigation:q=${encodedAddr}`,
      });
      const webFallback = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddr}`;
      Linking.openURL(url as string).catch(() => Linking.openURL(webFallback));
    }
  };

  const handleCallCustomer = () => {
    const phone = order.deliveryAddress?.mobile || order.customer?.mobile;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      showToast('Customer contact number is not provided.', 'info');
    }
  };

  // Status transitions via backend API
  const executeStatusUpdate = async (newStatus: string, successMessage: string) => {
    try {
      setActionLoading(true);
      const res = await updateOrderStatus(orderId, newStatus);
      if (res?.success && res.data) {
        setOrder(res.data);
        showToast(successMessage, 'success');
        if (newStatus === 'OUT_FOR_DELIVERY') {
          startWatchingLocation();
        } else if (newStatus === 'DELIVERED') {
          stopWatchingLocation();
        }
        setConfirmModal(null);
      } else {
        showToast(res?.message || 'Failed to update order status. Please try again.', 'error');
      }
    } catch (err: any) {
      console.error('Update status error:', err);
      showToast(err?.response?.data?.message || 'Failed to update order status. Please retry.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const promptAcceptOrder = () => {
    setConfirmModal({
      visible: true,
      title: 'Accept Order?',
      description: 'Do you want to accept this delivery assignment?',
      confirmText: 'Accept Order',
      confirmVariant: 'primary',
      icon: 'assignment-turned-in',
      onConfirm: () => executeStatusUpdate('ACCEPTED', 'Order accepted successfully!'),
    });
  };

  const promptStartDelivery = () => {
    setConfirmModal({
      visible: true,
      title: 'Start Delivery?',
      description: 'This will notify the customer that you are on the way and start live location tracking.',
      confirmText: 'Yes, Start Delivery',
      confirmVariant: 'primary',
      icon: 'two-wheeler',
      onConfirm: () => executeStatusUpdate('OUT_FOR_DELIVERY', 'Delivery started! Location tracking is active.'),
    });
  };

  const promptArrivedAtCustomer = () => {
    setConfirmModal({
      visible: true,
      title: 'Arrived at Customer Location?',
      description: "Please confirm that you have reached the customer's delivery address.",
      confirmText: "Yes, I've Arrived",
      cancelText: 'Cancel',
      confirmVariant: 'primary',
      icon: 'location-on',
      onConfirm: () => executeStatusUpdate('ARRIVED', "Customer has been notified that you've arrived!"),
    });
  };

  const promptMarkDelivered = () => {
    const isCodUnpaid = order.paymentMethod === 'COD' && order.paymentStatus !== 'PAID';
    setConfirmModal({
      visible: true,
      title: 'Confirm Delivery?',
      description: isCodUnpaid
        ? `Have you collected ₹${order.totalAmount?.toFixed(2)} cash from the customer and handed over the order?`
        : 'Please confirm that you have successfully delivered this order to the customer.',
      confirmText: 'Yes, Delivered',
      confirmVariant: 'success',
      icon: 'verified',
      onConfirm: () => executeStatusUpdate('DELIVERED', 'Order delivered successfully!'),
    });
  };

  if (loading || !order) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={BRAND.primary} />
        <Text style={[styles.loadingText, { color: colors.muted }]}>Loading order details...</Text>
      </View>
    );
  }

  // Define 5-stage delivery journey
  const stages = [
    { key: 'ASSIGNED', title: 'Order Assigned', completed: true, timestamp: order.assignedAt || order.createdAt },
    { key: 'ACCEPTED', title: 'Accepted', completed: ['ACCEPTED', 'OUT_FOR_DELIVERY', 'ARRIVED', 'DELIVERED'].includes(order.status), timestamp: order.acceptedAt },
    { key: 'OUT_FOR_DELIVERY', title: 'On the Way', completed: ['OUT_FOR_DELIVERY', 'ARRIVED', 'DELIVERED'].includes(order.status), timestamp: order.pickedUpAt },
    { key: 'ARRIVED', title: 'Arrived at Location', completed: ['ARRIVED', 'DELIVERED'].includes(order.status), timestamp: order.arrivedAt },
    { key: 'DELIVERED', title: 'Delivered', completed: order.status === 'DELIVERED', timestamp: order.deliveredAt },
  ];

  const mapInitialRegion = customerCoords
    ? {
        latitude: customerCoords.latitude,
        longitude: customerCoords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }
    : {
        latitude: 19.8762,
        longitude: 75.3433,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Header */}
      <View style={[styles.navHeader, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Order #{order._id.slice(-6).toUpperCase()}
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>
            Placed {new Date(order.createdAt).toLocaleDateString()} at{' '}
            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <OrderStatusBadge status={order.status} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Active GPS Indicator Bar */}
        {isTrackingActive && (
          <View style={styles.liveBanner}>
            <View style={styles.livePulse} />
            <Text style={styles.liveBannerText}>
              Live GPS Location Sharing Active — Customer can view your movement
            </Text>
          </View>
        )}

        {/* 1. Customer & Delivery Address Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Delivery Destination</Text>
            <TouchableOpacity onPress={handleCallCustomer} style={styles.callButton}>
              <MaterialIcons name="call" size={18} color="#FFF" />
              <Text style={styles.callButtonText}>Call Customer</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="person" size={20} color={BRAND.primary} />
            <Text style={[styles.customerName, { color: colors.text }]}>
              {order.deliveryAddress?.fullName || order.customer?.name || 'Customer'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="phone" size={18} color={colors.muted} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {order.deliveryAddress?.mobile || order.customer?.mobile || 'Not available'}
            </Text>
          </View>

          <View style={[styles.infoRow, { alignItems: 'flex-start' }]}>
            <MaterialIcons name="place" size={20} color="#EF4444" style={{ marginTop: 2 }} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={[styles.addressText, { color: colors.text }]}>{getFormattedAddress()}</Text>
              {order.deliveryAddress?.landmark ? (
                <Text style={styles.landmarkText}>Landmark: {order.deliveryAddress.landmark}</Text>
              ) : null}
            </View>
          </View>

          {/* Coordinates Display */}
          <View style={styles.coordsBox}>
            <MaterialIcons name="gps-fixed" size={16} color={BRAND.primary} />
            <Text style={styles.coordsText}>
              {customerCoords
                ? `Customer GPS: ${customerCoords.latitude.toFixed(6)}, ${customerCoords.longitude.toFixed(6)}`
                : 'Customer Coordinates: Using saved delivery address'}
            </Text>
          </View>

          {/* Prominent Navigate Button */}
          <TouchableOpacity
            style={styles.navigateButton}
            onPress={handleNavigateToCustomer}
            activeOpacity={0.85}
          >
            <MaterialIcons name="directions" size={22} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.navigateButtonText}>Navigate to Customer</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Customer Map View */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 0, overflow: 'hidden' }]}>
          <View style={styles.mapHeaderRow}>
            <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 0 }]}>
              Delivery Route Map
            </Text>
            <TouchableOpacity onPress={handleNavigateToCustomer} style={styles.openMapsBtn}>
              <MaterialIcons name="open-in-new" size={16} color={BRAND.primary} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: BRAND.primary, marginLeft: 4 }}>
                Maps App
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 260, width: '100%' }}>
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFill}
              initialRegion={mapInitialRegion}
              showsUserLocation={false}
            >
              {customerCoords && (
                <Marker coordinate={customerCoords} title="Customer Delivery Location">
                  <View style={styles.destinationPin}>
                    <MaterialIcons name="home" size={20} color="#FFF" />
                  </View>
                </Marker>
              )}

              {deliveryLocation && (
                <Marker
                  coordinate={deliveryLocation}
                  title="Your Current Location"
                  rotation={deliveryLocation.heading || 0}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <View style={styles.deliveryPin}>
                    <Text style={{ fontSize: 24 }}>🛵</Text>
                  </View>
                </Marker>
              )}

              {routeCoordinates.length > 0 && (
                <Polyline coordinates={routeCoordinates} strokeColor={BRAND.primary} strokeWidth={4} />
              )}
            </MapView>
          </View>
        </View>

        {/* 3. Delivery Journey Timeline */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Delivery Status Journey</Text>
          <View style={styles.timelineContainer}>
            {stages.map((stage, idx) => (
              <View key={stage.key} style={styles.timelineRow}>
                <View style={styles.timelineDotCol}>
                  <View
                    style={[
                      styles.timelineDot,
                      stage.completed ? styles.timelineDotCompleted : styles.timelineDotPending,
                    ]}
                  >
                    {stage.completed && <MaterialIcons name="check" size={12} color="#FFF" />}
                  </View>
                  {idx < stages.length - 1 && (
                    <View
                      style={[
                        styles.timelineLine,
                        stages[idx + 1].completed ? styles.timelineLineCompleted : styles.timelineLinePending,
                      ]}
                    />
                  )}
                </View>
                <View style={styles.timelineTextCol}>
                  <Text
                    style={[
                      styles.timelineStageTitle,
                      { color: stage.completed ? colors.text : colors.muted },
                      stage.completed && { fontWeight: '700' },
                    ]}
                  >
                    {stage.title}
                  </Text>
                  {stage.timestamp && (
                    <Text style={styles.timelineStageTime}>
                      {new Date(stage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 4. Order Items Summary & Payment */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Order Summary</Text>

          <View style={styles.detailRow}>
            <Text style={{ color: colors.muted }}>Payment Method</Text>
            <View style={[styles.methodBadge, order.paymentMethod === 'COD' ? styles.codBadge : styles.onlineBadge]}>
              <Text style={styles.methodBadgeText}>
                {order.paymentMethod} {order.paymentStatus === 'PAID' ? '(PAID)' : '(COLLECT CASH)'}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={{ color: colors.muted }}>Total Amount</Text>
            <Text style={[styles.amountValue, { color: BRAND.primary }]}>₹{order.totalAmount?.toFixed(2)}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={[styles.subTitle, { color: colors.text }]}>
            Items ({order.products?.length || 0})
          </Text>
          {order.products?.map((item: any, idx: number) => (
            <View key={item._id || idx} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                {item.volume ? <Text style={styles.itemSub}>{item.volume}</Text> : null}
              </View>
              <Text style={[styles.itemQty, { color: colors.muted }]}>x{item.quantity}</Text>
              <Text style={[styles.itemPrice, { color: colors.text }]}>
                ₹{(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* 5. Action Buttons based on delivery journey */}
        <View style={styles.actionSection}>
          {actionLoading && <ActivityIndicator size="small" color={BRAND.primary} style={{ marginBottom: 12 }} />}

          {/* Action: ACCEPT ORDER */}
          {['CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP'].includes(order.status) && (
            <Button
              title="Accept Order"
              onPress={promptAcceptOrder}
              variant="primary"
              disabled={actionLoading}
              style={styles.mainActionBtn}
            />
          )}

          {/* Action: START DELIVERY */}
          {order.status === 'ACCEPTED' && (
            <Button
              title="Start Delivery (On the Way)"
              onPress={promptStartDelivery}
              variant="primary"
              disabled={actionLoading}
              style={styles.mainActionBtn}
            />
          )}

          {/* Action: ARRIVED AT CUSTOMER LOCATION */}
          {order.status === 'OUT_FOR_DELIVERY' && (
            <Button
              title="I Have Arrived at Customer Location"
              onPress={promptArrivedAtCustomer}
              variant="primary"
              disabled={actionLoading}
              style={styles.mainActionBtn}
            />
          )}

          {/* Action: MARK AS DELIVERED */}
          {order.status === 'ARRIVED' && (
            <Button
              title="Mark as Delivered"
              onPress={promptMarkDelivered}
              variant="success"
              disabled={actionLoading}
              style={styles.mainActionBtn}
            />
          )}

          {/* Delivered Banner */}
          {order.status === 'DELIVERED' && (
            <View style={styles.completedBox}>
              <MaterialIcons name="verified" size={28} color={BRAND.green} />
              <Text style={styles.completedText}>Order Delivered Successfully</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Custom Confirmation Modal */}
      {confirmModal && (
        <ConfirmationModal
          visible={confirmModal.visible}
          title={confirmModal.title}
          description={confirmModal.description}
          confirmText={confirmModal.confirmText}
          cancelText={confirmModal.cancelText || 'Cancel'}
          confirmVariant={confirmModal.confirmVariant || 'primary'}
          icon={confirmModal.icon || 'help-outline'}
          loading={actionLoading}
          disableBackdropDismiss={actionLoading}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => {
            if (!actionLoading) {
              setConfirmModal(null);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, fontFamily: FONT_FAMILY.medium },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: { marginRight: 12, padding: 4 },
  headerTitle: { fontSize: 17, fontFamily: FONT_FAMILY.bold },
  scroll: { padding: 16, paddingBottom: 60 },

  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  livePulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    marginRight: 10,
  },
  liveBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },

  card: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.bold,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  callButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    marginLeft: 8,
    fontSize: 16,
    fontFamily: FONT_FAMILY.bold,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: FONT_FAMILY.regular,
  },
  addressText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONT_FAMILY.regular,
  },
  landmarkText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },

  coordsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(106, 4, 9, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 14,
  },
  coordsText: {
    fontSize: 12,
    color: BRAND.primary,
    fontWeight: '600',
    marginLeft: 6,
    flex: 1,
  },

  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.primary,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  navigateButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: FONT_FAMILY.bold,
    letterSpacing: 0.3,
  },

  mapHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  openMapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  destinationPin: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  deliveryPin: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  timelineContainer: {
    marginTop: 6,
    paddingLeft: 6,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 50,
  },
  timelineDotCol: {
    width: 28,
    alignItems: 'center',
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineDotCompleted: {
    backgroundColor: '#22C55E',
  },
  timelineDotPending: {
    backgroundColor: '#D1D5DB',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 2,
    zIndex: 1,
  },
  timelineLineCompleted: {
    backgroundColor: '#22C55E',
  },
  timelineLinePending: {
    backgroundColor: '#E5E7EB',
  },
  timelineTextCol: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  timelineStageTitle: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.regular,
  },
  timelineStageTime: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  methodBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  codBadge: {
    backgroundColor: 'rgba(234, 88, 12, 0.12)',
  },
  onlineBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  methodBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  amountValue: {
    fontSize: 18,
    fontFamily: FONT_FAMILY.bold,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: 12,
  },
  subTitle: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.medium,
  },
  itemSub: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  itemQty: {
    marginHorizontal: 12,
    fontSize: 13,
  },
  itemPrice: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.bold,
  },

  actionSection: {
    marginTop: 10,
    marginBottom: 30,
  },
  mainActionBtn: {
    borderRadius: 14,
    paddingVertical: 16,
  },
  completedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  completedText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#15803D',
    marginLeft: 8,
  },
});
