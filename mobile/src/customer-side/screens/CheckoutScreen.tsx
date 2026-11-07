import { useToast } from '../../providers/ToastProvider';
import { getApiBaseUrl } from '../../config/api.config';
import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../constants/theme';
import { Button } from '../../components/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { clearCart } from '../../store/slices/cartSlice';
import { fetchAddresses } from '../../store/slices/addressSlice';
import { openRazorpayCheckout } from '../../services/razorpayService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const CheckoutScreen = ({ navigation }: any) => {
  const { showToast } = useToast();
  const items = useSelector((state: RootState) => state.cart.items);
  const user = useSelector((state: any) => state.auth.user);
  const { selectedCheckoutAddress, loading: addressLoading } = useSelector((state: RootState) => state.address);
  const dispatch = useDispatch<AppDispatch>();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Razorpay'>('COD');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchAddresses());
  }, [dispatch]);

  const appliedOffer = useSelector((state: RootState) => state.cart.appliedOffer);

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const delivery = 4.99;
  const finalDiscount = appliedOffer ? appliedOffer.discountAmount : 0;
  const total = subtotal + delivery - finalDiscount;

  const handlePlaceOrder = async () => {
    if (!selectedCheckoutAddress) {
      showToast("Please provide a valid delivery address.", 'info');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      const BASE_URL = getApiBaseUrl();

      // 1. Create Order Backend Call
      const createRes = await fetch(`${BASE_URL}/api/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: items.map(i => ({ product: i.id, quantity: i.quantity })),
          deliveryAddress: {
            fullName: selectedCheckoutAddress.fullName,
            mobile: selectedCheckoutAddress.mobile,
            houseNo: selectedCheckoutAddress.houseNo,
            building: selectedCheckoutAddress.building,
            area: selectedCheckoutAddress.area,
            landmark: selectedCheckoutAddress.landmark,
            city: selectedCheckoutAddress.city,
            state: selectedCheckoutAddress.state,
            pincode: selectedCheckoutAddress.pincode,
            addressType: selectedCheckoutAddress.addressType,
          },
          paymentMethod,
          offerCode: appliedOffer ? appliedOffer.code : undefined
        }),
      });

      const createData = await createRes.json();
      
      if (!createRes.ok || !createData.success) {
        if (createRes.status === 401 || createRes.status === 403 || createData.message === "Invalid or expired token" || createData.isInvalid) {
          await AsyncStorage.multiRemove(['userToken', 'token', 'userData', 'user', 'userRole']);
          navigation.reset({ index: 0, routes: [{ name: 'AuthSelection' as never }] });
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(createData.message || 'Failed to create order');
      }

      if (paymentMethod === 'COD') {
        dispatch(clearCart());
        navigation.reset({ 
          index: 0, 
          routes: [{ 
            name: 'OrderSuccess', 
            params: { 
              orderId: createData.orderId, 
              amount: total, 
              method: 'COD',
              deliveryAddress: selectedCheckoutAddress
            } 
          }] 
        });
      } else {
        // Razorpay Flow
        const options = {
          description: 'DaaruDoor Order',
          image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
          currency: createData.currency,
          key: createData.keyId,
          amount: createData.amount,
          name: 'DaaruDoor',
          order_id: createData.razorpayOrderId,
          theme: { color: colors.primary },
          prefill: {
            email: user?.email || '',
            contact: selectedCheckoutAddress.mobile || user?.mobile || '',
            name: selectedCheckoutAddress.fullName || user?.name || ''
          }
        };

        openRazorpayCheckout(options).then(async (data: any) => {
          // Verify on backend
          const verifyRes = await fetch(`${BASE_URL}/api/payments/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              razorpay_order_id: data.razorpay_order_id,
              razorpay_payment_id: data.razorpay_payment_id,
              razorpay_signature: data.razorpay_signature,
              orderId: createData.orderId
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            dispatch(clearCart());
            navigation.reset({ index: 0, routes: [{ name: 'OrderSuccess', params: { orderId: createData.orderId, amount: total, method: 'Razorpay' } }] });
          } else {
            showToast('Verification failed on server.', 'error');
          }
        }).catch((error: any) => {
          console.error(error);
          showToast('Your cart is saved. You can try again.', 'info');
        });
      }
    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 20, paddingTop: insets.top + 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border },
    headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginLeft: 16 },
    content: { flex: 1 },
    section: { padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 },
    addressCard: { backgroundColor: colors.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    addressText: { color: colors.muted, fontSize: 14, lineHeight: 20 },
    changeBtn: { alignSelf: 'flex-end', marginTop: 8 },
    changeText: { color: colors.primary, fontWeight: '600' },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    itemMain: { flex: 1 },
    itemName: { fontSize: 14, color: colors.text, fontWeight: '500' },
    itemQty: { fontSize: 12, color: colors.muted, marginTop: 4 },
    itemPrice: { fontSize: 14, fontWeight: '600', color: colors.text },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    summaryLabel: { color: colors.muted, fontSize: 14 },
    summaryValue: { color: colors.text, fontSize: 14, fontWeight: '500' },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
    totalLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
    totalValue: { fontSize: 18, fontWeight: '800', color: colors.primary },
    paymentOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 12, backgroundColor: colors.surface },
    paymentOptionSelected: { borderColor: colors.primary, backgroundColor: `${colors.primary}10` },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.muted, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
    radioSelected: { borderColor: colors.primary },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
    paymentTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
    paymentSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
    bottomArea: { padding: 20, paddingBottom: insets.bottom + 20, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
    typeTag: { backgroundColor: colors.border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 8 },
    typeText: { fontSize: 12, fontWeight: '600', color: colors.text },
    noAddressCard: { padding: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
    noAddressText: { color: colors.muted, marginBottom: 12 },
  }), [colors, insets]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          {addressLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : selectedCheckoutAddress ? (
            <View style={styles.addressCard}>
              <View style={styles.typeTag}>
                <Text style={styles.typeText}>{selectedCheckoutAddress.addressType}</Text>
              </View>
              <Text style={[styles.addressText, { fontWeight: '600', color: colors.text, marginBottom: 4 }]}>{selectedCheckoutAddress.fullName}</Text>
              <Text style={styles.addressText}>{selectedCheckoutAddress.houseNo}{selectedCheckoutAddress.building ? `, ${selectedCheckoutAddress.building}` : ''}, {selectedCheckoutAddress.area}</Text>
              <Text style={styles.addressText}>{selectedCheckoutAddress.city}, {selectedCheckoutAddress.state} - {selectedCheckoutAddress.pincode}</Text>
              <Text style={styles.addressText}>Mobile: {selectedCheckoutAddress.mobile}</Text>
              <TouchableOpacity style={styles.changeBtn} onPress={() => navigation.navigate('MyAddresses', { selectMode: true })}>
                <Text style={styles.changeText}>Change Address</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noAddressCard}>
              <Text style={styles.noAddressText}>No delivery address added yet.</Text>
              <Button title="+ Add New Address" onPress={() => navigation.navigate('AddEditAddress', { isSelectMode: true })} />
            </View>
          )}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {items.map(item => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemMain}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>₹{delivery.toFixed(2)}</Text>
          </View>
          {appliedOffer && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount ({appliedOffer.code})</Text>
              <Text style={[styles.summaryValue, { color: 'green' }]}>-₹{finalDiscount.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <TouchableOpacity style={[styles.paymentOption, paymentMethod === 'COD' && styles.paymentOptionSelected]} onPress={() => setPaymentMethod('COD')}>
            <View style={[styles.radio, paymentMethod === 'COD' && styles.radioSelected]}>
              {paymentMethod === 'COD' && <View style={styles.radioInner} />}
            </View>
            <View>
              <Text style={styles.paymentTitle}>Cash on Delivery</Text>
              <Text style={styles.paymentSub}>Pay when your order arrives</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.paymentOption, paymentMethod === 'Razorpay' && styles.paymentOptionSelected]} onPress={() => setPaymentMethod('Razorpay')}>
            <View style={[styles.radio, paymentMethod === 'Razorpay' && styles.radioSelected]}>
              {paymentMethod === 'Razorpay' && <View style={styles.radioInner} />}
            </View>
            <View>
              <Text style={styles.paymentTitle}>Pay Online</Text>
              <Text style={styles.paymentSub}>Secure payment via Razorpay</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <View style={styles.bottomArea}>
        <Button 
          title={paymentMethod === 'COD' ? 'Place Order' : `Pay ₹${total.toFixed(2)}`} 
          onPress={handlePlaceOrder} 
          disabled={loading || !selectedCheckoutAddress}
        />
      </View>
    </View>
  );
};
export default CheckoutScreen;
