import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform, Image, Modal, ScrollView, Animated, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { OrderStatusBadge } from '../../components/ui';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getApiBaseUrl } from '../../config/api.config';

const BASE_URL = getApiBaseUrl();

type TabType = 'orders' | 'replacements';

const FILTER_OPTIONS = [
  'Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days',
  'This Month', 'Last Month', 'Last 3 Months', 'This Year',
  'Custom Date Range'
];

const getDateRange = (filter: string | null, customStart?: Date, customEnd?: Date) => {
  if (!filter) return { fromDate: null, toDate: null };
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let fromDate = null;
  let toDate = null;

  switch (filter) {
    case 'Today':
      fromDate = new Date(today);
      toDate = new Date(today);
      toDate.setHours(23, 59, 59, 999);
      break;
    case 'Yesterday':
      fromDate = new Date(today);
      fromDate.setDate(fromDate.getDate() - 1);
      toDate = new Date(fromDate);
      toDate.setHours(23, 59, 59, 999);
      break;
    case 'Last 7 Days':
      fromDate = new Date(today);
      fromDate.setDate(fromDate.getDate() - 6);
      toDate = new Date(today);
      toDate.setHours(23, 59, 59, 999);
      break;
    case 'Last 30 Days':
      fromDate = new Date(today);
      fromDate.setDate(fromDate.getDate() - 29);
      toDate = new Date(today);
      toDate.setHours(23, 59, 59, 999);
      break;
    case 'This Month':
      fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
      toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case 'Last Month':
      fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      toDate = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
      break;
    case 'Last 3 Months':
      fromDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
      toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case 'This Year':
      fromDate = new Date(today.getFullYear(), 0, 1);
      toDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    case 'Custom Date Range':
      if (customStart && customEnd) {
        fromDate = new Date(customStart);
        fromDate.setHours(0, 0, 0, 0);
        toDate = new Date(customEnd);
        toDate.setHours(23, 59, 59, 999);
      }
      break;
  }
  return { fromDate, toDate };
};

const OrderHistoryScreen = ({ navigation }: any) => {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabType>('orders');

  const [orders, setOrders] = useState<any[]>([]);
  const [replacements, setReplacements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [ordersFilter, setOrdersFilter] = useState<string | null>(null);
  const [ordersCustomStart, setOrdersCustomStart] = useState<Date>(new Date());
  const [ordersCustomEnd, setOrdersCustomEnd] = useState<Date>(new Date());

  const [repFilter, setRepFilter] = useState<string | null>(null);
  const [repCustomStart, setRepCustomStart] = useState<Date>(new Date());
  const [repCustomEnd, setRepCustomEnd] = useState<Date>(new Date());

  // Modal State
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  // Tracking state
  const [trackingOrder, setTrackingOrder] = useState<any>(null);
  const [isTrackingModalVisible, setIsTrackingModalVisible] = useState(false);
  const carAnim = React.useRef(new Animated.Value(0)).current;

  // Stages mapped to backend status
  const TRACKING_STAGES = [
    { label: 'Order Placed', status: 'PENDING' },
    { label: 'Confirmed', status: 'CONFIRMED' },
    { label: 'Preparing', status: 'PROCESSING' },
    { label: 'Out for Delivery', status: 'OUT_FOR_DELIVERY' },
    { label: 'Delivered', status: 'DELIVERED' }
  ];

  const getStageIndex = (status: string) => {
    if (status === 'CANCELLED' || status === 'RETURNED') return -1;
    const index = TRACKING_STAGES.findIndex(s => s.status === status);
    return index >= 0 ? index : 0; // Default to pending if unknown
  };

  const openTracking = (order: any) => {
    setTrackingOrder(order);
    setIsTrackingModalVisible(true);

    // Animate car to correct position
    const stageIndex = getStageIndex(order.status);
    if (stageIndex >= 0) {
      Animated.timing(carAnim, {
        toValue: stageIndex,
        duration: 800,
        useNativeDriver: false,
      }).start();
    } else {
      carAnim.setValue(0);
    }
  };
  const [tempFilter, setTempFilter] = useState<string | null>(null);
  const [tempStart, setTempStart] = useState<Date>(new Date());
  const [tempEnd, setTempEnd] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);

  const fetchOrders = async (filterObj: { fromDate?: string; toDate?: string } = {}) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('token');
      let url = `${BASE_URL}/api/customer/orders`;
      const queryParams = new URLSearchParams();
      if (filterObj.fromDate) queryParams.append('fromDate', filterObj.fromDate);
      if (filterObj.toDate) queryParams.append('toDate', filterObj.toDate);
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReplacements = async (filterObj: { fromDate?: string; toDate?: string } = {}) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('token');
      let url = `${BASE_URL}/api/customer/replacements`;
      const queryParams = new URLSearchParams();
      if (filterObj.fromDate) queryParams.append('fromDate', filterObj.fromDate);
      if (filterObj.toDate) queryParams.append('toDate', filterObj.toDate);
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setReplacements(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch replacements:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'orders') {
        const { fromDate, toDate } = getDateRange(ordersFilter, ordersCustomStart, ordersCustomEnd);
        fetchOrders({
          fromDate: fromDate?.toISOString(),
          toDate: toDate?.toISOString(),
        });
      } else {
        const { fromDate, toDate } = getDateRange(repFilter, repCustomStart, repCustomEnd);
        fetchReplacements({
          fromDate: fromDate?.toISOString(),
          toDate: toDate?.toISOString(),
        });
      }
    }, [activeTab, ordersFilter, ordersCustomStart, ordersCustomEnd, repFilter, repCustomStart, repCustomEnd])
  );

  const openFilterModal = () => {
    if (activeTab === 'orders') {
      setTempFilter(ordersFilter);
      setTempStart(ordersCustomStart);
      setTempEnd(ordersCustomEnd);
    } else {
      setTempFilter(repFilter);
      setTempStart(repCustomStart);
      setTempEnd(repCustomEnd);
    }
    setIsFilterModalVisible(true);
  };

  const applyFilter = () => {
    if (activeTab === 'orders') {
      setOrdersFilter(tempFilter);
      setOrdersCustomStart(tempStart);
      setOrdersCustomEnd(tempEnd);
    } else {
      setRepFilter(tempFilter);
      setRepCustomStart(tempStart);
      setRepCustomEnd(tempEnd);
    }
    setIsFilterModalVisible(false);
  };

  const clearFilter = () => {
    setTempFilter(null);
    if (activeTab === 'orders') {
      setOrdersFilter(null);
    } else {
      setRepFilter(null);
    }
    setIsFilterModalVisible(false);
  };

  const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 20, paddingTop: insets.top + 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
    headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginLeft: 16 },
    tabsContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
    tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
    activeTab: { borderBottomWidth: 2, borderBottomColor: colors.primary },
    tabText: { fontSize: 16, fontWeight: '600', color: colors.muted },
    activeTabText: { color: colors.primary },
    filterBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    filterText: { fontSize: 14, color: colors.text, fontWeight: '500' },
    filterBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
    filterBtnText: { marginLeft: 4, fontSize: 14, color: colors.text },
    list: { padding: 20 },
    card: { backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 8 },
    orderId: { fontSize: 16, fontWeight: '700', color: colors.text },
    date: { fontSize: 14, color: colors.muted },
    cardBody: { marginBottom: 16 },
    productsText: { fontSize: 14, color: colors.text, marginBottom: 4 },
    totalText: { fontSize: 16, fontWeight: '600', color: colors.primary, marginBottom: 4 },
    methodText: { fontSize: 14, color: colors.muted, marginBottom: 4 },
    statusText: { fontSize: 14, fontWeight: '500', color: colors.text },
    detailsBtn: { alignSelf: 'flex-start', backgroundColor: `${colors.primary}15`, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    detailsBtnText: { color: colors.primary, fontWeight: '600' },
    empty: { textAlign: 'center', color: colors.muted, marginTop: 40, fontSize: 16 },
    productItemRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-start' },
    productImage: { width: 50, height: 50, borderRadius: 8, backgroundColor: colors.border, marginRight: 12 },
    productDetails: { flex: 1 },
    productName: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 2 },
    productSubtext: { fontSize: 12, color: colors.muted, marginBottom: 2 },
    productPrice: { fontSize: 14, fontWeight: '600', color: colors.primary },

    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    filterOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    filterOptionActive: { backgroundColor: `${colors.primary}10` },
    filterOptionText: { fontSize: 16, color: colors.text },
    filterOptionTextActive: { color: colors.primary, fontWeight: '700' },
    datePickerContainer: { marginTop: 16, padding: 12, backgroundColor: colors.background, borderRadius: 8 },
    dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
    dateBtn: { backgroundColor: colors.surface, padding: 8, borderRadius: 6, borderWidth: 1, borderColor: colors.border, flex: 1, marginLeft: 8, alignItems: 'center' },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
    actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginHorizontal: 6 },
    clearBtn: { backgroundColor: colors.border },
    applyBtn: { backgroundColor: colors.primary },
    actionBtnText: { fontSize: 16, fontWeight: '700', color: colors.text },
    applyBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    detailsBtnFlex: { flex: 1, backgroundColor: colors.surface, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginRight: 8, borderWidth: 1, borderColor: colors.border },
    detailsBtnTextFlex: { fontSize: 14, fontWeight: '600', color: colors.text },
    trackBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginLeft: 8 },
    trackBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF8E7' },
    trackingModalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 24,
      backgroundColor: 'rgba(12, 3, 8, 0.72)',
    },
    trackingModalCard: {
      width: '100%',
      maxWidth: 480,
      maxHeight: '88%',
      borderRadius: 28,
      paddingHorizontal: 20,
      paddingTop: 22,
      paddingBottom: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(212,175,114,0.42)',
      backgroundColor: '#310014',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.32,
      shadowRadius: 28,
      elevation: 18,
    },
    trackingGlowTop: {
      position: 'absolute',
      top: -95,
      right: -70,
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: 'rgba(166,77,101,0.18)',
    },
    trackingGlowBottom: {
      position: 'absolute',
      bottom: -100,
      left: -80,
      width: 210,
      height: 210,
      borderRadius: 105,
      backgroundColor: 'rgba(212,175,114,0.08)',
    },
    trackingHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 18,
    },
    trackingHeaderLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingRight: 10,
    },
    trackingHeaderIcon: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(212,175,114,0.13)',
      borderWidth: 1,
      borderColor: 'rgba(212,175,114,0.25)',
      marginRight: 12,
    },
    trackingEyebrow: {
      color: '#D4AF72',
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1.6,
      marginBottom: 4,
    },
    trackingTitle: {
      color: '#FFF9F0',
      fontSize: 21,
      fontWeight: '800',
      letterSpacing: -0.4,
    },
    trackingOrderId: {
      color: 'rgba(255,249,240,0.62)',
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 1,
      marginTop: 5,
    },
    trackingCloseButton: {
      width: 36,
      height: 36,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    trackingHeaderDivider: {
      height: 1,
      backgroundColor: 'rgba(212,175,114,0.2)',
      marginBottom: 18,
    },
    trackingStatusCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.065)',
      borderWidth: 1,
      borderColor: 'rgba(212,175,114,0.22)',
      marginBottom: 12,
    },
    trackingStatusIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(212,175,114,0.13)',
      marginRight: 12,
    },
    trackingStatusLabel: {
      fontSize: 9,
      letterSpacing: 1.4,
      fontWeight: '800',
      color: 'rgba(255,249,240,0.58)',
      marginBottom: 5,
    },
    trackingStatusValue: {
      fontSize: 15,
      fontWeight: '800',
      color: '#FFF9F0',
    },
    trackingLiveBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: 'rgba(74,222,128,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(74,222,128,0.22)',
      marginLeft: 6,
    },
    trackingLiveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#4ADE80',
      marginRight: 5,
    },
    trackingLiveText: {
      fontSize: 8,
      letterSpacing: 0.5,
      fontWeight: '800',
      color: '#86EFAC',
    },
    trackingTimelineScroll: {
      flexGrow: 0,
      flexShrink: 1,
    },
    trackingTimelineContent: {
      paddingTop: 2,
      paddingBottom: 2,
    },
    timelineContainer: {
      position: 'relative',
      paddingLeft: 46,
      paddingTop: 0,
      paddingBottom: 0,
      marginTop: 2,
    },
    timelineLine: {
      position: 'absolute',
      left: 19,
      top: 36,
      bottom: 36,
      width: 2,
      borderRadius: 2,
      backgroundColor: 'rgba(212,175,114,0.2)',
    },
    timelineLineActive: {
      position: 'absolute',
      left: 19,
      top: 36,
      width: 2,
      borderRadius: 2,
      backgroundColor: '#D4AF72',
    },
    deliveryCar: {
      position: 'absolute',
      left: 5,
      top: 22,
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
      shadowColor: '#D4AF72',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 7,
      elevation: 5,
    },
    deliveryCarGradient: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#FFF0C9',
    },
    stageRow: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 72,
      position: 'relative',
    },
    stageDot: {
      position: 'absolute',
      left: -32,
      top: 29,
      width: 14,
      height: 14,
      borderRadius: 7,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#4B2636',
      borderWidth: 1.5,
      borderColor: 'rgba(212,175,114,0.45)',
      zIndex: 2,
    },
    stageDotActive: {
      backgroundColor: '#D4AF72',
      borderColor: '#F8E3AE',
    },
    stageDotCurrent: {
      width: 19,
      height: 19,
      borderRadius: 10,
      left: -34.5,
      top: 26.5,
      borderWidth: 2,
      borderColor: '#F8E3AE',
      backgroundColor: '#D4AF72',
    },
    stageTextContainer: {
      flex: 1,
      paddingRight: 5,
    },
    stageText: {
      fontSize: 14,
      fontWeight: '700',
      color: 'rgba(255,249,240,0.42)',
    },
    stageTextActive: {
      color: '#FFF9F0',
    },
    stageDescription: {
      marginTop: 4,
      fontSize: 11,
      lineHeight: 15,
      color: 'rgba(255,249,240,0.35)',
    },
    stageDescriptionActive: {
      color: 'rgba(255,249,240,0.64)',
    },
    currentStageBadge: {
      paddingHorizontal: 7,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: 'rgba(212,175,114,0.14)',
      borderWidth: 1,
      borderColor: 'rgba(212,175,114,0.3)',
      marginLeft: 4,
    },
    currentStageBadgeText: {
      color: '#E8C98E',
      fontSize: 8,
      fontWeight: '900',
      letterSpacing: 0.4,
    },
    cancelledBox: {
      backgroundColor: 'rgba(239,68,68,0.09)',
      paddingHorizontal: 18,
      paddingVertical: 26,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(248,113,113,0.28)',
      alignItems: 'center',
      marginVertical: 12,
    },
    cancelledIconWrap: {
      width: 66,
      height: 66,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(248,113,113,0.1)',
      marginBottom: 14,
    },
    cancelledText: {
      color: '#FCA5A5',
      fontWeight: '800',
      fontSize: 17,
      textAlign: 'center',
    },
    cancelledSubtext: {
      color: 'rgba(255,249,240,0.62)',
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'center',
      marginTop: 7,
    },
    trackingFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: 'rgba(212,175,114,0.18)',
      paddingTop: 14,
      marginTop: 12,
    },
    trackingFooterText: {
      color: 'rgba(255,249,240,0.58)',
      fontSize: 10,
      fontWeight: '600',
      marginLeft: 7,
      flex: 1,
    },
    trackingDoneButton: {
      paddingHorizontal: 19,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: '#D4AF72',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 70,
    },
    trackingDoneText: {
      color: '#4A001F',
      fontSize: 12,
      fontWeight: '900',
      letterSpacing: 0.3,
    },
  });

  const renderOrder = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>Order #{item._id.toString().slice(-6).toUpperCase()}</Text>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>

      <View style={styles.cardBody}>
        {item.products?.map((prod: any, index: number) => (
          <TouchableOpacity
            key={index}
            style={styles.productItemRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ProductDetails', { productId: prod.product })}
          >
            {prod.image ? (
              <Image source={{ uri: prod.image }} style={styles.productImage} />
            ) : (
              <View style={[styles.productImage, { alignItems: 'center', justifyContent: 'center' }]}>
                <MaterialIcons name="local-drink" size={24} color={colors.muted} />
              </View>
            )}
            <View style={styles.productDetails}>
              <Text style={styles.productName}>{prod.name}</Text>
              {prod.volume && <Text style={styles.productSubtext}>Volume: {prod.volume}</Text>}
              <Text style={styles.productSubtext}>Qty: {prod.quantity} × ₹{prod.price?.toFixed(2)}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 }}>
          <View>
            <Text style={styles.methodText}>Paid via {item.paymentMethod}</Text>
            <Text style={styles.totalText}>Total: ₹{item.totalAmount?.toFixed(2)}</Text>
          </View>
          <OrderStatusBadge status={item.status} />
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.detailsBtnFlex}
          onPress={() => navigation.navigate('OrderDetails', { orderId: item._id })}
        >
          <Text style={styles.detailsBtnTextFlex}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flex: 1, marginLeft: 8 }}
          onPress={() => {
            const isLive = ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'ACCEPTED', 'OUT_FOR_DELIVERY', 'ARRIVED'].includes(item.status);
            if (isLive) {
              navigation.navigate('TrackOrder', { orderId: item._id });
            } else {
              openTracking(item);
            }
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#A64D65', '#722F37']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.trackBtn}
          >
            <Text style={styles.trackBtnText}>
              {['ACCEPTED', 'OUT_FOR_DELIVERY', 'ARRIVED'].includes(item.status) ? '⚡ Live Track' : 'Track Order'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReplacement = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>Replacement #{item._id.toString().slice(-6).toUpperCase()}</Text>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>

      <View style={styles.cardBody}>
        <TouchableOpacity
          style={styles.productItemRow}
          activeOpacity={0.7}
        >
          {item.originalItemImage ? (
            <Image source={{ uri: item.originalItemImage }} style={styles.productImage} />
          ) : (
            <View style={[styles.productImage, { alignItems: 'center', justifyContent: 'center' }]}>
              <MaterialIcons name="local-drink" size={24} color={colors.muted} />
            </View>
          )}
          <View style={styles.productDetails}>
            <Text style={styles.productName}>{item.originalItemName}</Text>
            <Text style={styles.productSubtext}>Order ID: #{item.order.toString().slice(-6).toUpperCase()}</Text>
            <Text style={styles.productSubtext}>Qty: {item.quantity}</Text>
          </View>
        </TouchableOpacity>

        <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 }}>
          <Text style={styles.productsText}>Reason: {item.reason}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={styles.methodText}>Status:</Text>
            <OrderStatusBadge status={item.status} />
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>Order History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'replacements' && styles.activeTab]}
          onPress={() => setActiveTab('replacements')}
        >
          <Text style={[styles.tabText, activeTab === 'replacements' && styles.activeTabText]}>Replacement History</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterBar}>
        <Text style={styles.filterText}>
          {activeTab === 'orders'
            ? (ordersFilter || 'All Time')
            : (repFilter || 'All Time')}
        </Text>
        <TouchableOpacity style={styles.filterBtn} onPress={openFilterModal}>
          <MaterialIcons name="filter-list" size={20} color={colors.text} />
          <Text style={styles.filterBtnText}>Filter</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'orders' ? orders : replacements}
          keyExtractor={(item) => item._id}
          renderItem={activeTab === 'orders' ? renderOrder : renderReplacement}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No records found for the selected period.</Text>}
        />
      )}

      {/* Filter Modal */}
      <Modal visible={isFilterModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date Range</Text>
              <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {FILTER_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.filterOption, tempFilter === opt && styles.filterOptionActive]}
                  onPress={() => setTempFilter(opt)}
                >
                  <Text style={[styles.filterOptionText, tempFilter === opt && styles.filterOptionTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}

              {tempFilter === 'Custom Date Range' && (
                <View style={styles.datePickerContainer}>
                  <View style={styles.dateRow}>
                    <Text style={{ color: colors.text }}>From:</Text>
                    <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker('start')}>
                      <Text style={{ color: colors.text }}>{tempStart.toLocaleDateString()}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.dateRow}>
                    <Text style={{ color: colors.text }}>To:</Text>
                    <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker('end')}>
                      <Text style={{ color: colors.text }}>{tempEnd.toLocaleDateString()}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.actionBtn, styles.clearBtn]} onPress={clearFilter}>
                <Text style={styles.actionBtnText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.applyBtn]} onPress={applyFilter}>
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {showPicker && (
        <DateTimePicker
          value={showPicker === 'start' ? tempStart : tempEnd}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowPicker(null);
            if (date) {
              if (showPicker === 'start') setTempStart(date);
              else setTempEnd(date);
            }
          }}
        />
      )}

      {/* Tracking Modal */}
      {/* <Modal visible={isTrackingModalVisible} transparent animationType="slide">
        <View style={styles.trackingModalOverlay}>
          <BlurView intensity={20} tint="dark" style={styles.trackingModalContent}>
            <LinearGradient
              colors={['rgba(74, 0, 31, 0.95)', 'rgba(49, 0, 20, 0.98)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.trackingHeader}>
              <Text style={styles.trackingTitle}>Track Order #{trackingOrder?._id.toString().slice(-6).toUpperCase()}</Text>
              <TouchableOpacity onPress={() => setIsTrackingModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#D4AF72" />
              </TouchableOpacity>
            </View>

            {trackingOrder?.status === 'CANCELLED' || trackingOrder?.status === 'RETURNED' ? (
              <View style={styles.cancelledBox}>
                <MaterialIcons name="cancel" size={48} color="#EF4444" style={{ marginBottom: 8 }} />
                <Text style={styles.cancelledText}>Order {trackingOrder.status}</Text>
              </View>
            ) : (
              <View style={styles.timelineContainer}>
                <View style={styles.timelineLine} />
                <Animated.View style={[
                  styles.timelineLineActive,
                  {
                    height: carAnim.interpolate({
                      inputRange: [0, TRACKING_STAGES.length - 1],
                      outputRange: ['0%', '100%']
                    })
                  }
                ]} />
                
                <Animated.View style={[
                  styles.deliveryCar,
                  {
                    top: carAnim.interpolate({
                      inputRange: [0, TRACKING_STAGES.length - 1],
                      outputRange: [30, (TRACKING_STAGES.length - 1) * 60 + 30] // 60 is row height, 30 is center of the first row
                    }),
                    transform: [{ translateY: -12 }]
                  }
                ]}>
                  <MaterialIcons name="local-shipping" size={14} color="#D4AF72" />
                </Animated.View>

                {TRACKING_STAGES.map((stage, index) => {
                  const currentStageIndex = getStageIndex(trackingOrder?.status);
                  const isCompleted = index <= currentStageIndex;
                  return (
                    <View key={stage.status} style={styles.stageRow}>
                      <View style={[styles.stageDot, isCompleted && styles.stageDotActive]}>
                        {isCompleted && <MaterialIcons name="check" size={8} color="#4A001F" style={{ left: 0, top: 0 }} />}
                      </View>
                      <Text style={[styles.stageText, isCompleted && styles.stageTextActive]}>
                        {stage.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </BlurView>
        </View>
      </Modal> */}

      <Modal
        visible={isTrackingModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setIsTrackingModalVisible(false)}
      >
        <View style={styles.trackingModalOverlay}>
          <BlurView
            intensity={35}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />

          <Animated.View
            style={styles.trackingModalCard}
          >
            <LinearGradient
              colors={['#4A001F', '#310014', '#21000E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Decorative glow */}
            <View style={styles.trackingGlowTop} />
            <View style={styles.trackingGlowBottom} />

            {/* Header */}
            <View style={styles.trackingHeader}>
              <View style={styles.trackingHeaderLeft}>
                <View style={styles.trackingHeaderIcon}>
                  <MaterialIcons
                    name="local-shipping"
                    size={22}
                    color="#D4AF72"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.trackingEyebrow}>
                    LIVE ORDER TRACKING
                  </Text>

                  <Text style={styles.trackingTitle}>
                    Track your order
                  </Text>

                  <Text style={styles.trackingOrderId}>
                    ORDER #
                    {trackingOrder?._id
                      ? trackingOrder._id.toString().slice(-6).toUpperCase()
                      : '------'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setIsTrackingModalVisible(false)}
                style={styles.trackingCloseButton}
              >
                <MaterialIcons name="close" size={21} color="#F8E9D0" />
              </TouchableOpacity>
            </View>

            <View style={styles.trackingHeaderDivider} />

            {trackingOrder?.status === 'CANCELLED' ||
              trackingOrder?.status === 'RETURNED' ? (
              <View style={styles.cancelledBox}>
                <View style={styles.cancelledIconWrap}>
                  <MaterialIcons
                    name={
                      trackingOrder.status === 'CANCELLED'
                        ? 'cancel'
                        : 'assignment-return'
                    }
                    size={36}
                    color="#F87171"
                  />
                </View>

                <Text style={styles.cancelledText}>
                  {trackingOrder.status === 'CANCELLED'
                    ? 'Order Cancelled'
                    : 'Order Returned'}
                </Text>

                <Text style={styles.cancelledSubtext}>
                  {trackingOrder.status === 'CANCELLED'
                    ? 'This order has been cancelled.'
                    : 'This order has been marked as returned.'}
                </Text>
              </View>
            ) : (
              <>
                {/* Current status */}
                <View style={styles.trackingStatusCard}>
                  <View style={styles.trackingStatusIcon}>
                    <MaterialIcons
                      name="route"
                      size={25}
                      color="#D4AF72"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.trackingStatusLabel}>
                      CURRENT STATUS
                    </Text>

                    <Text style={styles.trackingStatusValue}>
                      {TRACKING_STAGES[
                        Math.max(
                          0,
                          Math.min(
                            getStageIndex(trackingOrder?.status),
                            TRACKING_STAGES.length - 1,
                          ),
                        )
                      ]?.label ?? 'Processing'}
                    </Text>
                  </View>

                  <View style={styles.trackingLiveBadge}>
                    <View style={styles.trackingLiveDot} />
                    <Text style={styles.trackingLiveText}>TRACKING</Text>
                  </View>
                </View>

                {/* Timeline */}
                <ScrollView
                  style={styles.trackingTimelineScroll}
                  contentContainerStyle={styles.trackingTimelineContent}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  <View style={styles.timelineContainer}>
                    <View style={styles.timelineLine} />

                    <Animated.View
                      style={[
                        styles.timelineLineActive,
                        {
                          height: carAnim.interpolate({
                            inputRange: [
                              0,
                              Math.max(1, TRACKING_STAGES.length - 1),
                            ],
                            outputRange: [
                              0,
                              (TRACKING_STAGES.length - 1) * 72,
                            ],
                            extrapolate: 'clamp',
                          }),
                        },
                      ]}
                    />

                    <Animated.View
                      style={[
                        styles.deliveryCar,
                        {
                          top: carAnim.interpolate({
                            inputRange: [
                              0,
                              Math.max(1, TRACKING_STAGES.length - 1),
                            ],
                            outputRange: [
                              22,
                              Math.max(22, (TRACKING_STAGES.length - 1) * 72 + 22),
                            ],
                            extrapolate: 'clamp',
                          }),
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={['#F8E3AE', '#D4AF72']}
                        style={styles.deliveryCarGradient}
                      >
                        <MaterialIcons
                          name="local-shipping"
                          size={17}
                          color="#4A001F"
                        />
                      </LinearGradient>
                    </Animated.View>

                    {TRACKING_STAGES.map((stage, index) => {
                      const currentStageIndex = getStageIndex(
                        trackingOrder?.status,
                      );

                      const isCompleted = index <= currentStageIndex;
                      const isCurrent = index === currentStageIndex;

                      return (
                        <View key={stage.status} style={styles.stageRow}>
                          <View
                            style={[
                              styles.stageDot,
                              isCompleted && styles.stageDotActive,
                              isCurrent && styles.stageDotCurrent,
                            ]}
                          >
                            {isCompleted && (
                              <MaterialIcons
                                name="check"
                                size={13}
                                color="#4A001F"
                              />
                            )}
                          </View>

                          <View style={styles.stageTextContainer}>
                            <Text
                              style={[
                                styles.stageText,
                                isCompleted && styles.stageTextActive,
                              ]}
                            >
                              {stage.label}
                            </Text>

                            <Text
                              style={[
                                styles.stageDescription,
                                isCompleted && styles.stageDescriptionActive,
                              ]}
                            >
                              {isCurrent
                                ? 'Your order is at this stage'
                                : isCompleted
                                  ? 'Successfully completed'
                                  : 'Waiting for this step'}
                            </Text>
                          </View>

                          {isCurrent && (
                            <View style={styles.currentStageBadge}>
                              <Text style={styles.currentStageBadgeText}>
                                CURRENT
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </>
            )}

            {/* Footer */}
            <View style={styles.trackingFooter}>
              <MaterialIcons
                name="verified-user"
                size={16}
                color="#D4AF72"
              />

              <Text style={styles.trackingFooterText}>
                DaaruDoor • Delivery updates
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsTrackingModalVisible(false)}
                style={styles.trackingDoneButton}
              >
                <Text style={styles.trackingDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

    </View>
  );
};

export default OrderHistoryScreen;
