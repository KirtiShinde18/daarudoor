import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Platform, Modal, TouchableWithoutFeedback } from 'react-native';
import { getAssignedOrders } from '../../api/delivery.api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../constants/theme';
import { FONT_FAMILY } from '../../constants/typography';
import { MaterialIcons } from '@expo/vector-icons';
import { Button, OrderStatusBadge } from '../../components/ui';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function DeliveryOrdersScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation<any>();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterType, setFilterType] = useState<'today' | 'this_month' | 'last_month' | 'custom' | 'all'>('today');
  const [customStart, setCustomStart] = useState(new Date());
  const [customEnd, setCustomEnd] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const filterOptions = [
    { label: 'Today', type: 'today' },
    { label: 'This Month', type: 'this_month' },
    { label: 'Last Month', type: 'last_month' },
    { label: 'All Time', type: 'all' },
    { label: 'Custom Date Range', type: 'custom' }
  ];

  const selectedFilterLabel = filterOptions.find(o => o.type === filterType)?.label || 'Today';

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let startDateStr, endDateStr;
      const today = new Date();
      if (filterType === 'today') {
        const start = new Date(today.setHours(0, 0, 0, 0));
        const end = new Date(today.setHours(23, 59, 59, 999));
        startDateStr = start.toISOString();
        endDateStr = end.toISOString();
      } else if (filterType === 'this_month') {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        startDateStr = start.toISOString();
      } else if (filterType === 'last_month') {
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
        startDateStr = start.toISOString();
        endDateStr = end.toISOString();
      } else if (filterType === 'custom') {
        const start = new Date(customStart);
        start.setHours(0, 0, 0, 0);
        const end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
        startDateStr = start.toISOString();
        endDateStr = end.toISOString();
      }

      const data = await getAssignedOrders(startDateStr, endDateStr);
      if (data.success) {
        setOrders(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filterType, customStart, customEnd]);

  // Removed FilterPill

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.orderId, { color: colors.text }]}>#{item._id.slice(-6).toUpperCase()}</Text>
          <OrderStatusBadge status={item.status} />
        </View>
        <Text style={[styles.date, { color: colors.muted }]}>
          {new Date(item.assignedAt || item.createdAt).toLocaleDateString()}
        </Text>
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
          title="View Details"
          onPress={() => navigation.navigate('DeliveryOrderDetails', { orderId: item._id })}
          style={styles.actionButton}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 10 }}>
          <MaterialIcons name="arrow-back" size={23} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Assigned Orders 📦</Text>
          <Text style={{ color: colors.muted }}>{orders.length} total orders found</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
        <TouchableOpacity
          style={[styles.dropdownButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setShowDropdown(true)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialIcons name="calendar-today" size={20} color="#6A0409" style={{ marginRight: 10 }} />
            <Text style={{ color: colors.text, fontSize: 15, fontFamily: FONT_FAMILY.semiBold }}>{selectedFilterLabel}</Text>
          </View>
          <MaterialIcons name="keyboard-arrow-down" size={24} color={colors.text} />
        </TouchableOpacity>

        <Modal visible={showDropdown} transparent animationType="fade">
          <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.dropdownMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {filterOptions.map((item, index) => (
                    <TouchableOpacity
                      key={item.type}
                      style={[
                        styles.dropdownItem,
                        index < filterOptions.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                      ]}
                      onPress={() => {
                        setFilterType(item.type as any);
                        setShowDropdown(false);
                      }}
                    >
                      <Text style={{
                        color: filterType === item.type ? '#6A0409' : colors.text,
                        fontFamily: filterType === item.type ? FONT_FAMILY.bold : FONT_FAMILY.medium,
                        fontSize: 15
                      }}>
                        {item.label}
                      </Text>
                      {filterType === item.type && (
                        <MaterialIcons name="check-circle" size={20} color="#6A0409" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {filterType === 'custom' && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, marginBottom: 10, backgroundColor: colors.card, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
            <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onPress={() => setShowStartPicker(true)}>
              <MaterialIcons name="event" size={20} color="#6A0409" style={{ marginRight: 8 }} />
              <View>
                <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 2 }}>Start Date</Text>
                <Text style={{ color: colors.text, fontFamily: FONT_FAMILY.bold, fontSize: 14 }}>{customStart.toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>
            <View style={{ width: 1, height: 30, backgroundColor: colors.border, marginHorizontal: 12 }} />
            <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onPress={() => setShowEndPicker(true)}>
              <MaterialIcons name="event" size={20} color="#6A0409" style={{ marginRight: 8 }} />
              <View>
                <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 2 }}>End Date</Text>
                <Text style={{ color: colors.text, fontFamily: FONT_FAMILY.bold, fontSize: 14 }}>{customEnd.toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {showStartPicker && (
        <DateTimePicker
          value={customStart}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowStartPicker(false);
            if (date) {
              if (date > customEnd) setCustomEnd(date);
              setCustomStart(date);
            }
          }}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={customEnd}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowEndPicker(false);
            if (date) {
              if (date < customStart) setCustomStart(date);
              setCustomEnd(date);
            }
          }}
        />
      )}

      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchOrders} tintColor={'#6A0409'} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="event-note" size={64} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>No assigned orders found for this date range.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15, flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 20, fontFamily: FONT_FAMILY.bold },
  list: { padding: 20, paddingBottom: 100 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  orderId: { fontSize: 16, fontFamily: FONT_FAMILY.bold, marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 10, fontFamily: FONT_FAMILY.bold },
  date: { fontSize: 12, fontFamily: FONT_FAMILY.semiBold },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { fontSize: 14, marginLeft: 8, fontFamily: FONT_FAMILY.regular },
  actionContainer: { marginTop: 16 },
  actionButton: { paddingVertical: 12 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 16, fontSize: 16, fontFamily: FONT_FAMILY.medium },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownMenu: {
    width: '85%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 10,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  }
});
