import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { getAssignedOrders } from '../../api/delivery.api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../constants/theme';
import { FONT_FAMILY } from '../../constants/typography';
import { MaterialIcons } from '@expo/vector-icons';
import { Button, OrderStatusBadge } from '../../components/ui';
import { useNavigation, useIsFocused } from '@react-navigation/native';

export default function DeliveryActiveOrdersScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getAssignedOrders();
      if (data.success) {
        const activeOrders = data.data.filter((o: any) =>
          ['ACCEPTED', 'OUT_FOR_DELIVERY', 'ARRIVED'].includes(o.status)
        );
        setOrders(activeOrders);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) fetchOrders();
  }, [isFocused]);

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.orderId, { color: colors.text }]}>#{item._id.slice(-6).toUpperCase()}</Text>
          <View style={{ marginLeft: 8 }}>
            <OrderStatusBadge status={item.status} />
          </View>
        </View>
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

      <View style={styles.actionContainer}>
        <Button
          title="View & Complete"
          onPress={() => navigation.navigate('DeliveryOrderDetails', { orderId: item._id })}
          style={styles.actionButton}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: colors.text }]}>Active Shipments</Text>
        <Text style={{ color: colors.muted }}>{orders.length} currently delivering</Text>
      </View>
      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchOrders} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="local-shipping" size={64} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>No active shipments right now</Text>
          </View>
        }
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
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { marginLeft: 8, fontSize: 14, flex: 1, fontFamily: FONT_FAMILY.regular },
  actionContainer: { marginTop: 16 },
  actionButton: { width: '100%', borderRadius: 12 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, fontFamily: FONT_FAMILY.medium },
});
