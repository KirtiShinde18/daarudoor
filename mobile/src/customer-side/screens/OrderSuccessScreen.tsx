import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../constants/theme';
import { Button } from '../../components/ui';
import { MaterialIcons } from '@expo/vector-icons';

const OrderSuccessScreen = ({ route, navigation }: any) => {
  const { colors } = useAppTheme();
  const { orderId, amount, method, deliveryAddress } = route.params || {};

  const styles = useMemo(() => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: `${colors.primary}20`, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 12 },
    subtitle: { fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 32 },
    detailsCard: { width: '100%', backgroundColor: colors.surface, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 32 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    label: { fontSize: 14, color: colors.muted },
    value: { fontSize: 14, fontWeight: '600', color: colors.text },
    addressContainer: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
    addressTitle: { fontSize: 14, color: colors.muted, marginBottom: 8 },
    addressText: { fontSize: 13, color: colors.text, lineHeight: 18 },
    bottomArea: { padding: 20, width: '100%' },
    button: { marginBottom: 12 },
    secondaryButton: { padding: 16, alignItems: 'center' },
    secondaryText: { color: colors.primary, fontSize: 16, fontWeight: '600' }
  }), [colors]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="check" size={40} color={colors.primary} />
        </View>
        <Text style={styles.title}>Order Placed!</Text>
        <Text style={styles.subtitle}>Your order has been placed successfully.</Text>
        
        <View style={styles.detailsCard}>
          <View style={styles.row}>
            <Text style={styles.label}>Order ID</Text>
            <Text style={styles.value}>{orderId || 'DD-XXXXXXXX'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.value}>₹{amount?.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment</Text>
            <Text style={styles.value}>{method === 'COD' ? 'Cash on Delivery' : 'Razorpay (Paid)'}</Text>
          </View>
          
          {deliveryAddress && (
            <View style={styles.addressContainer}>
              <Text style={styles.addressTitle}>Delivery Address</Text>
              <Text style={styles.addressText} numberOfLines={1}>{deliveryAddress.fullName}</Text>
              <Text style={styles.addressText} numberOfLines={2}>
                {deliveryAddress.houseNo}{deliveryAddress.building ? `, ${deliveryAddress.building}` : ''}, {deliveryAddress.area}, {deliveryAddress.city}, {deliveryAddress.state} - {deliveryAddress.pincode}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.bottomArea}>
        <Button 
          title="View My Order" 
          style={styles.button}
          onPress={() => navigation.reset({ index: 1, routes: [{ name: 'Main' }, { name: 'OrderDetails', params: { orderId } }] })}
        />
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}>
          <Text style={styles.secondaryText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
export default OrderSuccessScreen;
