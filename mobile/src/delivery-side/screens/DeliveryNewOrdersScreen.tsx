import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { getAssignedOrders, updateOrderStatus } from '../../api/delivery.api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../constants/theme';
import { FONT_FAMILY } from '../../constants/typography';
import { MaterialIcons } from '@expo/vector-icons';
import { Button, ConfirmationModal } from '../../components/ui';
import { useNavigation } from '@react-navigation/native';
import { useToast } from '../../providers/ToastProvider';

export default function DeliveryNewOrdersScreen() {
  const { colors, isDark } = useAppTheme();
  const navigation = useNavigation<any>();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderForAccept, setSelectedOrderForAccept] = useState<any>(null);
  const [acceptingLoading, setAcceptingLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getAssignedOrders();
      if (data.success) {
        // Filter new assigned orders awaiting acceptance
        const newOrders = data.data.filter((o: any) =>
          ['CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP'].includes(o.status)
        );
        setOrders(newOrders);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleConfirmAccept = async () => {
    if (!selectedOrderForAccept) return;
    try {
      setAcceptingLoading(true);
      const res = await updateOrderStatus(selectedOrderForAccept._id, 'ACCEPTED');
      if (res.success) {
        showToast("Delivery accepted! You can now start delivery.", "success");
        const acceptedId = selectedOrderForAccept._id;
        setSelectedOrderForAccept(null);
        fetchOrders();
        navigation.navigate('DeliveryOrderDetails', { orderId: acceptedId });
      } else {
        showToast(res.message || "Failed to accept delivery", "error");
      }
    } catch (error: any) {
      showToast(error?.response?.data?.message || "Failed to accept delivery", "error");
    } finally {
      setAcceptingLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.orderId, { color: colors.text }]}>#{item._id.slice(-6).toUpperCase()}</Text>
          <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(212, 175, 114, 0.18)' : 'rgba(106, 4, 9, 0.08)' }]}>
            <Text style={[styles.badgeText, { color: isDark ? '#D4AF72' : colors.primary }]}>NEW</Text>
          </View>
        </View>
        <Text style={[styles.date, { color: colors.muted }]}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <MaterialIcons name="person" size={16} color={colors.muted} />
        <Text style={[styles.infoText, { color: colors.text }]}>{item.customer?.name}</Text>
      </View>

      <View style={styles.infoRow}>
        <MaterialIcons name="location-on" size={16} color={colors.muted} />
        <Text style={[styles.infoText, { color: colors.text }]}>
          {typeof item.deliveryAddress === 'object' ? `${item.deliveryAddress.building ? item.deliveryAddress.building + ', ' : ''}${item.deliveryAddress.area}, ${item.deliveryAddress.city}` : item.deliveryAddress}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <MaterialIcons name="payment" size={16} color={colors.muted} />
        <Text style={[styles.infoText, { color: colors.text }]}>
          {item.paymentMethod} - ₹{item.totalAmount}
        </Text>
      </View>

      <View style={styles.actionContainer}>
        <Button
          title="Accept Delivery"
          onPress={() => setSelectedOrderForAccept(item)}
          variant="primary"
          style={styles.acceptButton}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: colors.text }]}>New Assignments</Text>
        <Text style={{ color: colors.muted }}>{orders.length} incoming</Text>
      </View>
      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchOrders} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="inbox" size={64} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>No new delivery assignments</Text>
          </View>
        }
      />

      <ConfirmationModal
        visible={!!selectedOrderForAccept}
        title="Accept Order Assignment?"
        description={`Do you want to accept delivery for Order #${selectedOrderForAccept?._id?.slice(-6)?.toUpperCase()}? You will be assigned to pick up and deliver this order.`}
        confirmText="Accept Delivery"
        cancelText="Cancel"
        confirmVariant="primary"
        icon="assignment-turned-in"
        loading={acceptingLoading}
        disableBackdropDismiss={acceptingLoading}
        onConfirm={handleConfirmAccept}
        onCancel={() => {
          if (!acceptingLoading) {
            setSelectedOrderForAccept(null);
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
  list: { padding: 20, paddingBottom: 100 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  orderId: { fontFamily: FONT_FAMILY.bold, fontSize: 16 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
  badgeText: { fontSize: 10, fontFamily: FONT_FAMILY.bold },
  date: { fontSize: 12, fontFamily: FONT_FAMILY.regular },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { marginLeft: 8, fontSize: 14, flex: 1, fontFamily: FONT_FAMILY.regular },
  actionContainer: { marginTop: 16 },
  acceptButton: { width: '100%', borderRadius: 12 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, fontFamily: FONT_FAMILY.medium },
});
