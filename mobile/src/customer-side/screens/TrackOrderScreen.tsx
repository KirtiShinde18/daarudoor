import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Animated,
  Linking,
  Platform,
  Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, EdgePadding } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../constants/theme';
import apiClient from '../../services/apiClient';
import socketClient from '../../services/socketClient';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.035;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const BRAND = {
  primary: '#6A0409',
  dark: '#370617',
  cream: '#FFF9F0',
  gold: '#D4AF72',
  pink: '#FCE7E9',
  green: '#22C55E',
  blue: '#3B82F6',
  amber: '#D97706',
};

// Calculate Haversine distance in kilometers
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function TrackOrderScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  const { orderId } = route.params;

  const mapRef = useRef<MapView>(null);
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<any>(null);
  const [customerLocation, setCustomerLocation] = useState<any>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [lastPingTime, setLastPingTime] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState<number>(0);

  const pollingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondsTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const slideAnim = useRef(new Animated.Value(300)).current;

  // Fetch full tracking details from backend
  const fetchTrackingDetails = useCallback(async () => {
    try {
      const response = await apiClient.get(`/customer/orders/${orderId}/location`);
      if (response.data?.success) {
        const data = response.data.data;
        setOrderData(data);

        if (data.currentLocation?.latitude && data.currentLocation?.longitude) {
          const newLoc = {
            latitude: Number(data.currentLocation.latitude),
            longitude: Number(data.currentLocation.longitude),
            heading: Number(data.currentLocation.heading) || 0,
          };
          setDeliveryLocation(newLoc);
          setLastPingTime(new Date(data.lastLocationUpdate || Date.now()));
          setRouteCoordinates((prev) => {
            const last = prev[prev.length - 1];
            if (!last || last.latitude !== newLoc.latitude || last.longitude !== newLoc.longitude) {
              return [...prev, newLoc];
            }
            return prev;
          });
        }

        if (data.customerLocation?.latitude && data.customerLocation?.longitude) {
          setCustomerLocation({
            latitude: Number(data.customerLocation.latitude),
            longitude: Number(data.customerLocation.longitude),
          });
        }
      }
    } catch (err: any) {
      console.error('Fetch tracking error:', err?.message || err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Connect to Socket.IO for instant live location push
  useEffect(() => {
    let isMounted = true;

    fetchTrackingDetails().then(() => {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    });

    socketClient.connect().then((socket) => {
      if (!isMounted) return;
      if (socket) {
        setIsLiveConnected(true);

        socketClient.joinOrder(orderId, (initData) => {
          if (!isMounted) return;
          if (initData?.currentLocation) {
            const loc = {
              latitude: Number(initData.currentLocation.latitude),
              longitude: Number(initData.currentLocation.longitude),
              heading: Number(initData.currentLocation.heading) || 0,
            };
            setDeliveryLocation(loc);
            setLastPingTime(new Date());
          }
          if (initData?.status) {
            setOrderData((prev: any) => ({ ...prev, status: initData.status }));
          }
        });

        // Listen for live delivery movement
        socketClient.onLocationUpdate((payload) => {
          if (!isMounted) return;
          if (payload?.orderId === orderId && payload.currentLocation) {
            const newLoc = {
              latitude: Number(payload.currentLocation.latitude),
              longitude: Number(payload.currentLocation.longitude),
              heading: Number(payload.currentLocation.heading) || 0,
            };

            setDeliveryLocation(newLoc);
            setLastPingTime(new Date());
            setRouteCoordinates((prev) => [...prev, newLoc]);

            if (payload.status) {
              setOrderData((prev: any) => ({ ...prev, status: payload.status }));
            }
          }
        });

        // Listen for status changes
        socketClient.onStatusUpdate((payload) => {
          if (!isMounted) return;
          if (payload?.orderId === orderId) {
            setOrderData((prev: any) => ({
              ...prev,
              status: payload.status,
              timestamps: { ...prev?.timestamps, ...payload.timestamps },
            }));
          }
        });
      }
    });

    // Solid Polling Fallback (every 6 seconds) to ensure synchronization
    pollingTimer.current = setInterval(fetchTrackingDetails, 6000);

    // Freshness timer ticking every second
    secondsTimer.current = setInterval(() => {
      setLastPingTime((prevTime) => {
        if (prevTime) {
          const diff = Math.max(0, Math.round((Date.now() - prevTime.getTime()) / 1000));
          setSecondsAgo(diff);
        }
        return prevTime;
      });
    }, 1000);

    return () => {
      isMounted = false;
      socketClient.leaveOrder(orderId);
      if (pollingTimer.current) clearInterval(pollingTimer.current);
      if (secondsTimer.current) clearInterval(secondsTimer.current);
    };
  }, [orderId, fetchTrackingDetails]);

  // Recenter map camera to show both markers
  const handleRecenter = useCallback(() => {
    if (!mapRef.current) return;

    if (deliveryLocation && customerLocation) {
      const coordinates = [deliveryLocation, customerLocation];
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 120, right: 60, bottom: 280, left: 60 } as EdgePadding,
        animated: true,
      });
    } else if (deliveryLocation) {
      mapRef.current.animateToRegion({
        ...deliveryLocation,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      }, 800);
    } else if (customerLocation) {
      mapRef.current.animateToRegion({
        ...customerLocation,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      }, 800);
    }
  }, [deliveryLocation, customerLocation]);

  // Call delivery partner
  const handleCallPartner = () => {
    const phone = orderData?.deliveryPartner?.mobile;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  // Status-specific Swiggy/Zomato message copy
  const getDeliveryStatusCopy = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          title: 'Order Placed',
          desc: 'Waiting for restaurant confirmation.',
          icon: 'receipt',
          color: BRAND.gold,
        };
      case 'CONFIRMED':
      case 'PROCESSING':
        return {
          title: 'Preparing Your Order',
          desc: 'Your items are being packed with care.',
          icon: 'dinner-dining',
          color: BRAND.blue,
        };
      case 'READY_FOR_PICKUP':
        return {
          title: 'Order Assigned',
          desc: 'Your order has been assigned to a delivery partner.',
          icon: 'assignment-ind',
          color: '#0D9488',
        };
      case 'ACCEPTED':
        return {
          title: 'Delivery Partner Assigned',
          desc: 'Your delivery partner has accepted your order.',
          icon: 'thumb-up',
          color: '#10B981',
        };
      case 'OUT_FOR_DELIVERY':
        return {
          title: 'Delivery Partner on the Way',
          desc: 'Your delivery partner is on the way.',
          icon: 'two-wheeler',
          color: BRAND.primary,
        };
      case 'ARRIVED':
        return {
          title: 'Partner Arrived at Location',
          desc: 'Your delivery partner has arrived at your doorstep.',
          icon: 'place',
          color: BRAND.primary,
        };
      case 'DELIVERED':
        return {
          title: 'Order Delivered 🎉',
          desc: 'Your order has been delivered. Enjoy your drinks responsibly!',
          icon: 'verified',
          color: BRAND.green,
        };
      case 'CANCELLED':
        return {
          title: 'Order Cancelled',
          desc: 'This order has been cancelled.',
          icon: 'cancel',
          color: '#EF4444',
        };
      default:
        return {
          title: 'Tracking Order',
          desc: 'Connecting with live satellites...',
          icon: 'gps-fixed',
          color: BRAND.primary,
        };
    }
  };

  // Calculate real distance & ETA
  const calculateETAInfo = () => {
    if (!deliveryLocation || !customerLocation) return null;
    const distanceKm = calculateDistanceKm(
      deliveryLocation.latitude,
      deliveryLocation.longitude,
      customerLocation.latitude,
      customerLocation.longitude
    );

    // Assume average city scooter speed of ~22 km/h + 2 mins traffic buffer
    const minutes = Math.max(1, Math.round((distanceKm / 22) * 60 + 2));
    const distText = distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`;

    return {
      distanceText: distText,
      etaText: minutes <= 1 ? '1 min' : `${minutes} mins`,
    };
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: BRAND.cream }]}>
        <ActivityIndicator size="large" color={BRAND.primary} />
        <Text style={styles.loadingLabel}>Connecting live satellite tracker...</Text>
      </View>
    );
  }

  const statusCopy = getDeliveryStatusCopy(orderData?.status);
  const etaInfo = calculateETAInfo();

  const initialRegion = deliveryLocation || customerLocation || {
    latitude: 19.8762,
    longitude: 75.3433,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  };

  // 5-stage timeline for customer
  const timelineStages = [
    { key: 'ASSIGNED', label: 'Order Assigned', isDone: true },
    {
      key: 'ACCEPTED',
      label: 'Accepted',
      isDone: ['ACCEPTED', 'OUT_FOR_DELIVERY', 'ARRIVED', 'DELIVERED'].includes(orderData?.status),
    },
    {
      key: 'OUT_FOR_DELIVERY',
      label: 'On the Way',
      isDone: ['OUT_FOR_DELIVERY', 'ARRIVED', 'DELIVERED'].includes(orderData?.status),
    },
    {
      key: 'ARRIVED',
      label: 'Arrived',
      isDone: ['ARRIVED', 'DELIVERED'].includes(orderData?.status),
    },
    {
      key: 'DELIVERED',
      label: 'Delivered',
      isDone: orderData?.status === 'DELIVERED',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          ...initialRegion,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }}
        showsUserLocation={false}
        mapType="standard"
      >
        {/* Route Trail */}
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={BRAND.primary}
            strokeWidth={4}
            lineDashPattern={[0]}
          />
        )}

        {/* Straight connecting guide if route has not loaded many points */}
        {deliveryLocation && customerLocation && routeCoordinates.length <= 1 && (
          <Polyline
            coordinates={[deliveryLocation, customerLocation]}
            strokeColor="rgba(106, 4, 9, 0.4)"
            strokeWidth={3}
            lineDashPattern={[6, 4]}
          />
        )}

        {/* Customer Destination Marker */}
        {customerLocation && (
          <Marker
            coordinate={customerLocation}
            title="Delivery Destination"
            description={orderData?.deliveryAddress?.houseNo ? `Flat/House ${orderData.deliveryAddress.houseNo}` : 'Customer Address'}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.destinationPinWrap}>
              <View style={styles.destinationPin}>
                <MaterialIcons name="home" size={22} color="#FFF" />
              </View>
              <View style={styles.destinationPinTail} />
            </View>
          </Marker>
        )}

        {/* Delivery Partner Scooter Marker */}
        {deliveryLocation && (
          <Marker
            coordinate={deliveryLocation}
            title="Delivery Partner"
            description={orderData?.deliveryPartner?.name || 'On the move'}
            rotation={deliveryLocation.heading || 0}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.scooterMarkerWrap}>
              <View style={styles.scooterCircle}>
                <Text style={{ fontSize: 26 }}>🛵</Text>
              </View>
              <View style={styles.scooterPulse} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Top Floating Header & Controls */}
      <LinearGradient
        colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.15)', 'transparent']}
        style={[styles.headerOverlay, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
          <MaterialIcons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Live Delivery Tracking</Text>
          <View style={styles.liveIndicatorRow}>
            <View style={[styles.liveDot, { backgroundColor: isLiveConnected ? BRAND.green : BRAND.amber }]} />
            <Text style={styles.liveIndicatorText}>
              {isLiveConnected ? 'REAL-TIME GPS' : 'POLLING LIVE'}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleRecenter} style={styles.recenterBtn} activeOpacity={0.8}>
          <MaterialIcons name="my-location" size={22} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* ETA & Distance Floating Pill */}
      {etaInfo && ['ACCEPTED', 'OUT_FOR_DELIVERY', 'ARRIVED'].includes(orderData?.status) && (
        <View style={[styles.floatingEtaCard, { top: insets.top + 70 }]}>
          <View style={styles.etaIconCircle}>
            <MaterialIcons name="delivery-dining" size={20} color={BRAND.primary} />
          </View>
          <View>
            <Text style={styles.etaTimeText}>Arriving in {etaInfo.etaText}</Text>
            <Text style={styles.etaDistText}>{etaInfo.distanceText} remaining</Text>
          </View>
        </View>
      )}

      {/* Bottom Swiggy/Zomato Tracking Card */}
      <Animated.ScrollView
        style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sheetHandle} />

        {/* 1. Status Headline */}
        <View style={styles.statusRow}>
          <View style={[styles.statusIconWrap, { backgroundColor: `${statusCopy.color}15` }]}>
            <MaterialIcons name={statusCopy.icon as any} size={28} color={statusCopy.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusHeadline, { color: BRAND.dark }]}>{statusCopy.title}</Text>
            <Text style={styles.statusDescText}>{statusCopy.desc}</Text>
            {lastPingTime && (
              <Text style={styles.freshnessText}>
                {secondsAgo < 5
                  ? 'Updated just now'
                  : `GPS updated ${secondsAgo}s ago`}
              </Text>
            )}
          </View>
        </View>

        {/* 2. Delivery Partner Card */}
        {orderData?.deliveryPartner && (
          <View style={styles.partnerCard}>
            <View style={styles.partnerAvatarCircle}>
              {orderData.deliveryPartner.profilePic ? (
                <Image
                  source={{ uri: orderData.deliveryPartner.profilePic }}
                  style={styles.partnerAvatarImg}
                />
              ) : (
                <MaterialIcons name="two-wheeler" size={26} color={BRAND.primary} />
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.partnerName}>{orderData.deliveryPartner.name}</Text>
              <Text style={styles.partnerRole}>Your Delivery Partner</Text>
            </View>
            <TouchableOpacity onPress={handleCallPartner} style={styles.callPartnerBtn} activeOpacity={0.8}>
              <MaterialIcons name="call" size={18} color="#FFF" />
              <Text style={styles.callPartnerBtnText}>Call</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.divider} />

        {/* 3. Delivery Journey Timeline */}
        <Text style={styles.sectionHeading}>Delivery Journey</Text>
        <View style={styles.timelineWrapper}>
          {timelineStages.map((stg, idx) => {
            const isCurrent =
              stg.isDone &&
              (idx === timelineStages.length - 1 || !timelineStages[idx + 1].isDone);

            return (
              <View key={stg.key} style={styles.timelineRow}>
                <View style={styles.timelineDotCol}>
                  <View
                    style={[
                      styles.timelineDot,
                      stg.isDone && styles.timelineDotDone,
                      isCurrent && styles.timelineDotCurrent,
                    ]}
                  >
                    {stg.isDone && <MaterialIcons name="check" size={12} color="#FFF" />}
                  </View>
                  {idx < timelineStages.length - 1 && (
                    <View
                      style={[
                        styles.timelineLine,
                        timelineStages[idx + 1].isDone && styles.timelineLineDone,
                      ]}
                    />
                  )}
                </View>
                <View style={styles.timelineTextCol}>
                  <Text
                    style={[
                      styles.timelineStageLabel,
                      stg.isDone && styles.timelineStageLabelDone,
                    ]}
                  >
                    {stg.label}
                  </Text>
                  {isCurrent && (
                    <Text style={styles.timelineLiveText}>In progress...</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.divider} />

        {/* 4. Delivery Address & Order Info */}
        <View style={styles.orderMetaRow}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Order ID</Text>
            <Text style={styles.metaValue}>#{orderId.slice(-6).toUpperCase()}</Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Total Paid</Text>
            <Text style={[styles.metaValue, { color: BRAND.primary }]}>
              ₹{orderData?.totalAmount ? Number(orderData.totalAmount).toFixed(2) : '--'}
            </Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Method</Text>
            <Text style={styles.metaValue}>{orderData?.paymentMethod || 'COD'}</Text>
          </View>
        </View>

        {orderData?.deliveryAddress && (
          <View style={styles.addressBox}>
            <MaterialIcons name="place" size={18} color={BRAND.primary} style={{ marginTop: 2 }} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.addressTitle}>Delivery Address</Text>
              <Text style={styles.addressContent}>
                {typeof orderData.deliveryAddress === 'string'
                  ? orderData.deliveryAddress
                  : [
                      orderData.deliveryAddress.houseNo,
                      orderData.deliveryAddress.building,
                      orderData.deliveryAddress.area,
                      orderData.deliveryAddress.city,
                      orderData.deliveryAddress.pincode ? `PIN: ${orderData.deliveryAddress.pincode}` : '',
                    ]
                      .filter(Boolean)
                      .join(', ')}
              </Text>
            </View>
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND.cream },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingLabel: { marginTop: 14, fontSize: 15, fontWeight: '600', color: BRAND.dark },

  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 24,
    zIndex: 10,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  liveIndicatorText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.8,
  },
  recenterBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  floatingEtaCard: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 11,
  },
  etaIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: BRAND.pink,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  etaTimeText: {
    fontSize: 15,
    fontWeight: '800',
    color: BRAND.dark,
  },
  etaDistText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },

  destinationPinWrap: {
    alignItems: 'center',
  },
  destinationPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  destinationPinTail: {
    width: 4,
    height: 8,
    backgroundColor: '#EF4444',
  },

  scooterMarkerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 52,
  },
  scooterCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BRAND.primary,
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  scooterPulse: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: 'rgba(106, 4, 9, 0.4)',
  },

  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: height * 0.52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 20,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 16,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  statusIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  statusHeadline: {
    fontSize: 17,
    fontWeight: '800',
  },
  statusDescText: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 2,
    lineHeight: 18,
  },
  freshnessText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '600',
  },

  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 14,
  },
  partnerAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND.pink,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  partnerAvatarImg: {
    width: '100%',
    height: '100%',
  },
  partnerName: {
    fontSize: 15,
    fontWeight: '700',
    color: BRAND.dark,
  },
  partnerRole: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  callPartnerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.green,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  callPartnerBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },

  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 14,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },

  timelineWrapper: {
    paddingLeft: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 38,
  },
  timelineDotCol: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineDotDone: {
    backgroundColor: BRAND.green,
  },
  timelineDotCurrent: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: BRAND.pink,
    backgroundColor: BRAND.primary,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginTop: -2,
    marginBottom: -2,
    zIndex: 1,
  },
  timelineLineDone: {
    backgroundColor: BRAND.green,
  },
  timelineTextCol: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 14,
  },
  timelineStageLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  timelineStageLabelDone: {
    color: BRAND.dark,
  },
  timelineLiveText: {
    fontSize: 11,
    color: BRAND.primary,
    fontWeight: '700',
    marginTop: 2,
  },

  orderMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  metaCol: {
    flex: 1,
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '800',
    color: BRAND.dark,
  },
  verticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },

  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(106, 4, 9, 0.04)',
  },
  addressTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: BRAND.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressContent: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 2,
    lineHeight: 16,
  },
});
