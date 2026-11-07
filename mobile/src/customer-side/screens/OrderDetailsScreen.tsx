import { useToast } from '../../providers/ToastProvider';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OrderStatusBadge, ConfirmationModal } from '../../components/ui';
import { Modal, TextInput } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, SlideInDown, SlideInUp } from 'react-native-reanimated';
import { getApiBaseUrl } from '../../config/api.config';

const BASE_URL = getApiBaseUrl();

const OrderDetailsScreen = ({ navigation, route }: any) => {
  const { showToast } = useToast();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { orderId } = route.params;
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replacements, setReplacements] = useState<any[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  
  // Rating Modal
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  
  // Replacement Modal
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [replacementProduct, setReplacementProduct] = useState<any>(null);
  const [replacementReason, setReplacementReason] = useState('');
  const [replacementDescription, setReplacementDescription] = useState('');
  
  const [unratedProducts, setUnratedProducts] = useState<any[]>([]);
  const [currentRatingIndex, setCurrentRatingIndex] = useState(0);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/api/customer/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setOrder(data.data);
          
          if (data.data.status === 'DELIVERED') {
            const products = data.data.products || [];
            const unrated = [];
            for (const p of products) {
              try {
                const eligRes = await fetch(`${BASE_URL}/api/customer/products/${p.product}/can-review`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                const eligData = await eligRes.json();
                if (eligData.success && eligData.eligible) {
                  unrated.push(p);
                }
              } catch (e) {
                console.error("Error checking eligibility for", p.name);
              }
            }
            if (unrated.length > 0) {
              setUnratedProducts(unrated);
              setCurrentRatingIndex(0);
              setShowRatingModal(true);
            }
          }
        }
        
        // Fetch replacements
        const repResponse = await fetch(`${BASE_URL}/api/customer/orders/${orderId}/replacements`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const repData = await repResponse.json();
        if (repData.success) {
          setReplacements(repData.data);
        }
      } catch (error) {
        console.error('Failed to fetch order details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [orderId]);

  const handleConfirmCancelOrder = async () => {
    try {
      setCancelLoading(true);
      const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/customer/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setOrder(data.data);
        showToast("Order cancelled successfully", 'success');
        setShowCancelModal(false);
      } else {
        showToast(data.message || "Failed to cancel order", 'error');
      }
    } catch (error) {
      showToast("Network error while cancelling order", 'error');
    } finally {
      setCancelLoading(false);
    }
  };

  
  const submitRating = async (isDismissed = false) => {
    if (isDismissed) {
      setShowRatingModal(false);
      return;
    }
    
    if (rating === 0) {
      showToast("Please select a rating", "error");
      return;
    }

    if (!review.trim()) {
      showToast("Please enter a review comment", "error");
      return;
    }

    const currentProduct = unratedProducts[currentRatingIndex];
    if (!currentProduct) return;

    try {
      const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/customer/products/${currentProduct.product}/reviews`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ rating, comment: review })
      });
      const data = await response.json();
      if (data.success) {
        showToast(`Thank you for reviewing ${currentProduct.name}!`, 'success');
        
        if (currentRatingIndex < unratedProducts.length - 1) {
          setCurrentRatingIndex(prev => prev + 1);
          setRating(0);
          setReview('');
        } else {
          setShowRatingModal(false);
        }
      } else {
        showToast(data.message || "Failed to submit rating", 'error');
      }
    } catch (error) {
      showToast("Failed to submit rating", 'error');
    }
  };

  const submitReplacement = async () => {
    if (!replacementReason.trim()) {
      showToast("Please enter a reason", "error");
      return;
    }
    
    try {
      const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/customer/orders/${orderId}/replacement`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          productId: replacementProduct.product,
          reason: replacementReason,
          description: replacementDescription
        })
      });
      const data = await response.json();
      if (data.success) {
        setShowReplacementModal(false);
        showToast("Replacement request submitted successfully.", 'success');
        setReplacements([data.data, ...replacements]);
        setReplacementReason('');
        setReplacementDescription('');
      } else {
        showToast(data.message || "Failed to submit request", "error");
      }
    } catch (error) {
      showToast("Failed to submit request", "error");
    }
  };

  const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 20, paddingTop: insets.top + 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
    headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginLeft: 16 },
    content: { padding: 20 },
    section: { backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    label: { fontSize: 14, color: colors.muted },
    value: { fontSize: 14, fontWeight: '600', color: colors.text },
    itemRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'center' },
    itemImage: { width: 50, height: 50, borderRadius: 8, backgroundColor: colors.border, marginRight: 12 },
    itemMain: { flex: 1 },
    itemName: { fontSize: 14, fontWeight: '500', color: colors.text },
    itemQty: { fontSize: 12, color: colors.muted, marginTop: 4 },
    itemPrice: { fontSize: 14, fontWeight: '600', color: colors.text },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
    totalValue: { fontSize: 16, fontWeight: '700', color: colors.primary },
    addressText: { fontSize: 14, color: colors.text, lineHeight: 20 },
    cancelBtn: {
      backgroundColor: '#EF4444',
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 32,
    },
    cancelBtnText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600'
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 24,
      width: '100%',
      maxWidth: 400,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 10,
    },
    starsRow: { flexDirection: 'row', justifyContent: 'center', marginVertical: 20, gap: 8 },
    textInput: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      color: colors.text,
      minHeight: 100,
      textAlignVertical: 'top',
      marginBottom: 20,
    },
    textInputSmall: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      color: colors.text,
      marginBottom: 12,
    },
    btnPrimary: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 12,
    },
    btnPrimaryText: { color: 'white', fontWeight: '700', fontSize: 16 },
    btnGhost: { paddingVertical: 14, alignItems: 'center' },
    btnGhostText: { color: colors.muted, fontWeight: '600', fontSize: 14 },
    repStatusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginTop: 8,
      alignSelf: 'flex-start',
    }
  });

  if (loading) {
    return (
      <View style={[styles.root, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
        </View>
        <Text style={{ textAlign: 'center', marginTop: 40, color: colors.muted }}>Order not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order._id.toString().slice(-6).toUpperCase()}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Order Date</Text>
            <Text style={styles.value}>{new Date(order.createdAt).toLocaleString()}</Text>
          </View>
          <View style={[styles.row, { alignItems: 'center' }]}>
            <Text style={styles.label}>Status</Text>
            <OrderStatusBadge status={order.status} />
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Method</Text>
            <Text style={styles.value}>{order.paymentMethod}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Status</Text>
            <Text style={styles.value}>{order.paymentStatus}</Text>
          </View>
        </View>

        {order && ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'ACCEPTED', 'OUT_FOR_DELIVERY', 'ARRIVED'].includes(order.status) && (
          <TouchableOpacity
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1.5,
              borderColor: colors.primary,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 8,
              elevation: 4
            }}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('TrackOrder', { orderId: order._id })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: `${colors.primary}18`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12
              }}>
                <MaterialIcons name="two-wheeler" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>Live Delivery Tracking</Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                  {order.status === 'OUT_FOR_DELIVERY' ? 'Partner is on the way to your address' : 'View live partner movement & route'}
                </Text>
              </View>
            </View>
            <View style={{ backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }}>
              <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>Track Live</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Products</Text>
          {order.products?.map((item: any) => (
            <TouchableOpacity 
              key={item._id} 
              style={styles.itemRow}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ProductDetails', { productId: item.product })}
            >
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.itemImage} />
              ) : (
                <View style={[styles.itemImage, { alignItems: 'center', justifyContent: 'center' }]}>
                  <MaterialIcons name="local-drink" size={24} color={colors.muted} />
                </View>
              )}
              <View style={styles.itemMain}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.volume && <Text style={{ fontSize: 12, color: colors.muted }}>Volume: {item.volume}</Text>}
                <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                
                {replacements.find(r => r.product === item.product) ? (
                  <View style={[styles.repStatusBadge, { backgroundColor: colors.border }]}>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: colors.text }}>
                      Replacement: {replacements.find(r => r.product === item.product).status}
                    </Text>
                  </View>
                ) : order.status === 'DELIVERED' ? (
                  <TouchableOpacity 
                    style={{ marginTop: 8 }}
                    onPress={(e) => {
                      e.stopPropagation();
                      setReplacementProduct(item);
                      setShowReplacementModal(true);
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>Request Replacement</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Subtotal</Text>
            <Text style={styles.value}>₹{order.subtotal?.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Delivery Fee</Text>
            <Text style={styles.value}>₹{order.deliveryFee?.toFixed(2)}</Text>
          </View>
          {order.discount > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Discount</Text>
              <Text style={styles.value}>-₹{order.discount?.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={[styles.label, { fontWeight: '700', color: colors.text }]}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{order.totalAmount?.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          {typeof order.deliveryAddress === 'object' ? (
            <>
              <Text style={[styles.addressText, { fontWeight: '600' }]}>{order.deliveryAddress.fullName}</Text>
              <Text style={styles.addressText}>
                {order.deliveryAddress.houseNo}{order.deliveryAddress.building ? `, ${order.deliveryAddress.building}` : ''}, {order.deliveryAddress.area}
              </Text>
              <Text style={styles.addressText}>
                {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
              </Text>
              <Text style={styles.addressText}>Mobile: {order.deliveryAddress.mobile}</Text>
            </>
          ) : (
            <Text style={styles.addressText}>{order.deliveryAddress}</Text> // Fallback if string
          )}
        </View>

        {order && ['PENDING', 'CONFIRMED'].includes(order.status) && (
          <TouchableOpacity 
            style={styles.cancelBtn}
            onPress={() => setShowCancelModal(true)}
          >
            <Text style={styles.cancelBtnText}>Cancel Order</Text>
          </TouchableOpacity>
        )}

      </ScrollView>

      {/* Rating Modal */}
      <Modal visible={showRatingModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
          <Animated.View entering={SlideInDown.duration(400).springify()} style={styles.modalCard}>
            {unratedProducts[currentRatingIndex] && (
              <>
                <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 8 }}>
                  Rate {unratedProducts[currentRatingIndex].name}
                </Text>
                <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center' }}>
                  Product {currentRatingIndex + 1} of {unratedProducts.length}
                </Text>
              </>
            )}
            
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <MaterialIcons 
                    name={star <= rating ? "star" : "star-border"} 
                    size={40} 
                    color={star <= rating ? "#F59E0B" : colors.muted} 
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.textInput}
              placeholder="Write your review..."
              placeholderTextColor={colors.muted}
              multiline
              value={review}
              onChangeText={setReview}
            />

            <TouchableOpacity style={styles.btnPrimary} onPress={() => submitRating(false)}>
              <Text style={styles.btnPrimaryText}>Submit Rating</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnGhost} onPress={() => submitRating(true)}>
              <Text style={styles.btnGhostText}>Maybe Later</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Replacement Modal */}
      <Modal visible={showReplacementModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
          <Animated.View entering={SlideInUp.duration(300).springify()} style={styles.modalCard}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 16 }}>
              Request Replacement
            </Text>
            
            {replacementProduct && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <Image source={{ uri: replacementProduct.image }} style={{ width: 40, height: 40, borderRadius: 8, marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{replacementProduct.name}</Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>Qty: {replacementProduct.quantity}</Text>
                </View>
              </View>
            )}

            <TextInput
              style={styles.textInputSmall}
              placeholder="Reason for replacement *"
              placeholderTextColor={colors.muted}
              value={replacementReason}
              onChangeText={setReplacementReason}
            />

            <TextInput
              style={[styles.textInput, { minHeight: 80 }]}
              placeholder="Additional description (optional)"
              placeholderTextColor={colors.muted}
              multiline
              value={replacementDescription}
              onChangeText={setReplacementDescription}
            />

            <TouchableOpacity style={styles.btnPrimary} onPress={submitReplacement}>
              <Text style={styles.btnPrimaryText}>Submit Request</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnGhost} onPress={() => setShowReplacementModal(false)}>
              <Text style={styles.btnGhostText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      <ConfirmationModal
        visible={showCancelModal}
        title="Cancel Order?"
        description="Are you sure you want to cancel this order? This action cannot be undone."
        confirmText="Yes, Cancel Order"
        cancelText="Keep Order"
        confirmVariant="danger"
        icon="cancel"
        loading={cancelLoading}
        disableBackdropDismiss={cancelLoading}
        onConfirm={handleConfirmCancelOrder}
        onCancel={() => {
          if (!cancelLoading) {
            setShowCancelModal(false);
          }
        }}
      />
    </View>
  );
};

export default OrderDetailsScreen;
