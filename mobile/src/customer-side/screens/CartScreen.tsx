import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../constants/theme';
import { Card, Button } from '../../components/ui';
import { MaterialIcons } from '@expo/vector-icons';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { updateQuantity, removeFromCart } from '../../store/slices/cartSlice';
import { requireAuth } from '../../utils/authGuard';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from '../../providers/ToastProvider';
import { getApiBaseUrl } from '../../config/api.config';

const CartScreen = () => {
  const items = useSelector((state: RootState) => state.cart.items);
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const delivery = 4.99;
  const appliedOffer = useSelector((state: RootState) => state.cart.appliedOffer);
  const finalDiscount = appliedOffer ? appliedOffer.discountAmount : 0;
  const total = subtotal + delivery - finalDiscount;

  const [offerCode, setOfferCode] = useState('');
  const [loadingOffer, setLoadingOffer] = useState(false);
  const { showToast } = useToast();

  const handleUpdateQuantity = (id: string, currentQuantity: number, delta: number) => {
    if (currentQuantity + delta <= 0) {
      dispatch(removeFromCart(id));
    } else {
      dispatch(updateQuantity({ id, quantity: currentQuantity + delta }));
    }
  };

  const handleApplyOffer = async () => {
    if (!offerCode.trim()) return;
    setLoadingOffer(true);
    try {
      const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('token');
      const API_URL = getApiBaseUrl();
      
      const response = await fetch(`${API_URL}/api/customer/offers/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: offerCode, cartTotal: subtotal })
      });
      const data = await response.json();
      if (data.success) {
        dispatch({ type: 'cart/applyOffer', payload: { code: data.data.offer.code, discountAmount: data.data.discount } });
        setOfferCode('');
        showToast('Offer applied successfully!', 'success');
      } else {
        showToast(data.message || 'Invalid offer code', 'error');
      }
    } catch (error) {
      showToast('Failed to apply offer', 'error');
    } finally {
      setLoadingOffer(false);
    }
  };

  const handleRemoveOffer = () => {
    dispatch({ type: 'cart/removeOffer' });
    showToast('Offer removed', 'info');
  };

  const styles = useMemo(() => StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: insets.top + 16,
      paddingBottom: 24,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.muted,
    },
    container: {
      flex: 1,
    },
    contentContainer: {
      paddingHorizontal: 20,
      paddingBottom: insets.bottom + 100, // accommodate bottom tab
    },
    cartItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      marginBottom: 16,
    },
    itemImage: {
      width: 70,
      height: 70,
      backgroundColor: colors.surface,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
      overflow: 'hidden',
      padding: 6,
    },
    itemDetails: {
      flex: 1,
    },
    itemBrand: {
      fontSize: 12,
      color: colors.muted,
      marginBottom: 2,
    },
    itemName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    itemPrice: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    quantityControls: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 4,
    },
    qBtn: {
      width: 28,
      height: 28,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 4,
    },
    qBtnActive: {
      width: 28,
      height: 28,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    qText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
      marginHorizontal: 12,
    },
    summarySection: {
      marginTop: 8,
      marginBottom: 24,
      backgroundColor: colors.card,
      padding: 20,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    summaryLabel: {
      color: colors.muted,
      fontSize: 14,
    },
    summaryValue: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '500',
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 12,
    },
    totalLabel: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
    },
    totalValue: {
      color: colors.primary,
      fontSize: 20,
      fontWeight: '800',
    },
    checkoutBtn: {
      width: '100%',
      borderRadius: 12,
      height: 56,
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      marginTop: 40,
    },
    emptyStateCard: {
      width: '100%',
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 32,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 2,
    },
    emptyIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.muted,
      textAlign: 'center',
      marginBottom: 32,
      lineHeight: 20,
    },
    startShoppingBtn: {
      width: '100%',
      borderRadius: 12,
      height: 50,
    }
  }), [colors, insets]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Cart</Text>
        {items.length > 0 && <Text style={styles.headerSubtitle}>{items.length} items</Text>}
      </View>

      {items.length === 0 ? (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateCard}>
              <View style={styles.emptyIconContainer}>
                <MaterialIcons name="shopping-bag" size={40} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Your cart is empty</Text>
              <Text style={styles.emptySubtitle}>
                Looks like you haven't added anything yet. Discover your favourite drinks and add them to your cart.
              </Text>
              <Button 
                title="Start Shopping" 
                style={styles.startShoppingBtn}
                onPress={() => navigation.navigate('Home')}
              />
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {items.map((item) => (
            <Card key={item.id} style={styles.cartItem}>
              <View style={styles.itemImage}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                ) : (
                  <MaterialIcons name="local-drink" size={24} color={colors.muted} />
                )}
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemBrand}>{item.category}{item.brand ? ` • ${item.brand}` : ''}</Text>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemPrice}>₹{item.price.toFixed(2)}</Text>
              </View>
              <View style={styles.quantityControls}>
                <TouchableOpacity 
                  style={styles.qBtn}
                  onPress={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                >
                  <MaterialIcons name="remove" size={16} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.qText}>{item.quantity}</Text>
                <TouchableOpacity 
                  style={styles.qBtnActive}
                  onPress={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                >
                  <MaterialIcons name="add" size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            </Card>
          ))}

          <View style={styles.summarySection}>
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
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.summaryValue, { color: 'green', marginRight: 8 }]}>-₹{finalDiscount.toFixed(2)}</Text>
                  <TouchableOpacity onPress={handleRemoveOffer}>
                    <MaterialIcons name="close" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
            </View>
          </View>

          {!appliedOffer && (
            <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginBottom: 24 }}>
              <TextInput 
                style={{ flex: 1, height: 48, backgroundColor: colors.surface, borderRadius: 8, paddingHorizontal: 16, color: colors.text, borderWidth: 1, borderColor: colors.border, marginRight: 12 }}
                placeholder="Enter Offer Code"
                placeholderTextColor={colors.muted}
                value={offerCode}
                onChangeText={setOfferCode}
              />
              <Button title="Apply" onPress={handleApplyOffer} disabled={loadingOffer} style={{ width: 90 }} />
            </View>
          )}

          <Button 
            title="Proceed to Checkout" 
            style={styles.checkoutBtn}
            icon={<MaterialIcons name="shopping-cart-checkout" size={20} color={colors.white} />}
            onPress={() => {
              requireAuth(navigation, () => {
                navigation.navigate('Checkout');
              }, { targetPath: 'Checkout' });
            }}
          />
        </ScrollView>
      )}
    </View>
  );
};

export default CartScreen;
