
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Modal,
  Pressable,
  Keyboard,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';

import { getAssignedOrders } from '../../api/delivery.api';
import { useAppTheme } from '../../constants/theme';
import { FONT_FAMILY } from '../../constants/typography';
import { OrderStatusBadge } from '../../components/ui';

type DateFilter = 'ALL' | 'TODAY' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM';
type PickerTarget = 'start' | 'end';

const DATE_FILTERS: {
  label: string;
  value: DateFilter;
  icon: keyof typeof MaterialIcons.glyphMap;
}[] = [
    { label: 'All Time', value: 'ALL', icon: 'history' },
    { label: 'Today', value: 'TODAY', icon: 'today' },
    { label: 'This Month', value: 'THIS_MONTH', icon: 'calendar-month' },
    { label: 'Last Month', value: 'LAST_MONTH', icon: 'event' },
    { label: 'Custom Range', value: 'CUSTOM', icon: 'date-range' },
  ];

const HISTORY_STATUSES = ['DELIVERED', 'CANCELLED', 'RETURNED'];

const pad = (value: number) => String(value).padStart(2, '0');

const formatDate = (date: Date) =>
  `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const endOfDay = (date: Date) =>
  new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );

const getAddressText = (address: any): string => {
  if (!address) return 'Address unavailable';

  if (typeof address === 'string') {
    return address.trim() || 'Address unavailable';
  }

  if (typeof address === 'object') {
    return (
      [
        address.building,
        address.area,
        address.city,
        address.state,
        address.pincode || address.zipCode,
      ]
        .filter(
          (part) =>
            part !== null &&
            part !== undefined &&
            String(part).trim().length > 0,
        )
        .join(', ') || 'Address unavailable'
    );
  }

  return 'Address unavailable';
};

export default function DeliveryHistoryScreen() {
  const { colors } = useAppTheme();
  const isFocused = useIsFocused();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL');

  const [startDate, setStartDate] = useState(startOfDay(new Date()));
  const [endDate, setEndDate] = useState(startOfDay(new Date()));

  const [showPicker, setShowPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>('start');

  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const hasActiveFilters = search.trim().length > 0 || dateFilter !== 'ALL';

  const selectedDateFilter =
    DATE_FILTERS.find((filter) => filter.value === dateFilter) ??
    DATE_FILTERS[0];

  const fetchOrders = useCallback(async () => {
    setLoading(true);

    try {
      const response = await getAssignedOrders();

      if (response?.success && Array.isArray(response.data)) {
        setOrders(
          response.data.filter((order: any) =>
            HISTORY_STATUSES.includes(
              String(order?.status ?? '').toUpperCase(),
            ),
          ),
        );
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Failed to fetch delivery history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      fetchOrders();
    }
  }, [isFocused, fetchOrders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    const now = new Date();

    let rangeStart: Date | null = null;
    let rangeEnd: Date | null = null;

    switch (dateFilter) {
      case 'TODAY':
        rangeStart = startOfDay(now);
        rangeEnd = endOfDay(now);
        break;

      case 'THIS_MONTH':
        rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
        rangeEnd = endOfDay(now);
        break;

      case 'LAST_MONTH':
        rangeStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        rangeEnd = endOfDay(
          new Date(now.getFullYear(), now.getMonth(), 0),
        );
        break;

      case 'CUSTOM':
        rangeStart = startOfDay(startDate);
        rangeEnd = endOfDay(endDate);
        break;

      default:
        break;
    }

    return orders.filter((order: any) => {
      const customerName = String(
        order?.customer?.name ?? '',
      ).toLowerCase();

      const orderId = String(order?._id ?? '').toLowerCase();
      const shortOrderId = orderId.slice(-6);

      const matchesSearch =
        !query ||
        customerName.includes(query) ||
        orderId.includes(query) ||
        shortOrderId.includes(query);

      if (!matchesSearch) return false;

      if (rangeStart && rangeEnd) {
        const createdAt = order?.createdAt
          ? new Date(order.createdAt)
          : null;

        if (
          !createdAt ||
          Number.isNaN(createdAt.getTime()) ||
          createdAt < rangeStart ||
          createdAt > rangeEnd
        ) {
          return false;
        }
      }

      return true;
    });
  }, [orders, search, dateFilter, startDate, endDate]);

  const openDatePicker = useCallback((target: PickerTarget) => {
    Keyboard.dismiss();
    setPickerTarget(target);
    setShowPicker(true);
  }, []);

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (event.type === 'dismissed' || !selectedDate) return;

    const selected = startOfDay(selectedDate);

    if (pickerTarget === 'start') {
      setStartDate(selected);

      if (selected > endDate) {
        setEndDate(selected);
      }
    } else {
      setEndDate(selected);

      if (selected < startDate) {
        setStartDate(selected);
      }
    }
  };

  const selectDateFilter = (value: DateFilter) => {
    setDateFilter(value);
    setShowDateDropdown(false);
    setShowPicker(false);

    if (value === 'CUSTOM') {
      const today = startOfDay(new Date());
      setStartDate(today);
      setEndDate(today);
      setPickerTarget('start');
      setShowPicker(true);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setDateFilter('ALL');

    const today = startOfDay(new Date());
    setStartDate(today);
    setEndDate(today);

    setShowPicker(false);
    setShowDateDropdown(false);
    setShowFilterMenu(false);
    Keyboard.dismiss();
  };

  const renderItem = ({ item }: { item: any }) => {
    const orderId = item?._id
      ? String(item._id).slice(-6).toUpperCase()
      : 'N/A';

    const customerName = item?.customer?.name || 'Customer';
    const address = getAddressText(item?.deliveryAddress);

    const createdDate = item?.createdAt
      ? new Date(item.createdAt)
      : null;

    const validDate =
      createdDate && !Number.isNaN(createdDate.getTime());

    const paymentMethod = String(item?.paymentMethod || 'N/A');
    const amount = Number(item?.totalAmount);

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.orderHeaderLeft}>
            <Text style={[styles.orderId, { color: colors.text }]}>
              #{orderId}
            </Text>
            <OrderStatusBadge status={item?.status} />
          </View>

          <Text style={[styles.date, { color: colors.muted }]}>
            {validDate ? createdDate.toLocaleDateString() : 'Date N/A'}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.infoRow}>
          <MaterialIcons
            name="person-outline"
            size={19}
            color={colors.muted}
          />
          <Text
            style={[styles.infoText, { color: colors.text }]}
            numberOfLines={2}
          >
            {customerName}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialIcons
            name="location-on"
            size={19}
            color={colors.muted}
          />
          <Text
            style={[styles.infoText, { color: colors.text }]}
            numberOfLines={3}
          >
            {address}
          </Text>
        </View>

        <View
          style={[styles.paymentRow, { borderTopColor: colors.border }]}
        >
          <View style={styles.paymentMethodContainer}>
            <MaterialIcons
              name="payment"
              size={19}
              color={colors.muted}
            />
            <Text
              style={[styles.paymentMethod, { color: colors.text }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {paymentMethod}
            </Text>
          </View>

          <Text
            style={[styles.amount, { color: colors.primary }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            ₹{Number.isFinite(amount) ? amount.toLocaleString('en-IN') : '0'}
          </Text>
        </View>
      </View>
    );
  };

  const renderDateDropdown = () => (
    <Modal
      visible={showDateDropdown}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => setShowDateDropdown(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setShowDateDropdown(false)}
      >
        <Pressable
          style={[
            styles.dateDropdown,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
          onPress={() => { }}
        >
          <View style={styles.dropdownHeader}>
            <View
              style={[
                styles.dropdownIconContainer,
                { backgroundColor: colors.background },
              ]}
            >
              <MaterialIcons
                name="date-range"
                size={22}
                color={colors.primary}
              />
            </View>

            <View style={styles.dropdownTitleContainer}>
              <Text style={[styles.dropdownTitle, { color: colors.text }]}>
                Select Date Range
              </Text>
              <Text
                style={[styles.dropdownSubtitle, { color: colors.muted }]}
              >
                Filter your delivery history
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setShowDateDropdown(false)}
              style={styles.dropdownCloseButton}
              accessibilityLabel="Close date range dropdown"
            >
              <MaterialIcons name="close" size={21} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.dropdownDivider,
              { backgroundColor: colors.border },
            ]}
          />

          {DATE_FILTERS.map((filter) => {
            const selected = dateFilter === filter.value;

            return (
              <TouchableOpacity
                key={filter.value}
                activeOpacity={0.7}
                onPress={() => selectDateFilter(filter.value)}
                style={[
                  styles.dateDropdownItem,
                  {
                    backgroundColor: selected
                      ? `${colors.primary}14`
                      : 'transparent',
                    borderColor: selected ? colors.primary : 'transparent',
                  },
                ]}
              >
                <View
                  style={[
                    styles.dateOptionIcon,
                    {
                      backgroundColor: selected
                        ? `${colors.primary}20`
                        : colors.background,
                    },
                  ]}
                >
                  <MaterialIcons
                    name={filter.icon}
                    size={20}
                    color={selected ? colors.primary : colors.muted}
                  />
                </View>

                <Text
                  style={[
                    styles.dateOptionText,
                    {
                      color: selected ? colors.primary : colors.text,
                      fontFamily: selected
                        ? FONT_FAMILY.bold
                        : FONT_FAMILY.medium,
                    },
                  ]}
                >
                  {filter.label}
                </Text>

                <View style={styles.optionTrailing}>
                  {selected && (
                    <MaterialIcons
                      name="check-circle"
                      size={21}
                      color={colors.primary}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[
              styles.dropdownCloseAction,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setShowDateDropdown(false)}
          >
            <Text style={[styles.dropdownCloseText, { color: colors.text }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );

  const renderFilterOptionsModal = () => (
    <Modal
      visible={showFilterMenu}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => setShowFilterMenu(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setShowFilterMenu(false)}
      >
        <Pressable
          style={[
            styles.filterDropdown,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
          onPress={() => { }}
        >
          <View style={styles.dropdownHeader}>
            <View
              style={[
                styles.dropdownIconContainer,
                { backgroundColor: colors.background },
              ]}
            >
              <MaterialIcons name="tune" size={21} color={colors.primary} />
            </View>

            <View style={styles.dropdownTitleContainer}>
              <Text style={[styles.dropdownTitle, { color: colors.text }]}>
                Filter Options
              </Text>
              <Text
                style={[styles.dropdownSubtitle, { color: colors.muted }]}
              >
                Manage your history filters
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setShowFilterMenu(false)}
              style={styles.dropdownCloseButton}
              accessibilityLabel="Close filter options"
            >
              <MaterialIcons name="close" size={21} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.dropdownDivider,
              { backgroundColor: colors.border },
            ]}
          />

          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={resetFilters}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.dropdownItemIcon,
                { backgroundColor: colors.background },
              ]}
            >
              <MaterialIcons
                name="restart-alt"
                size={21}
                color={colors.primary}
              />
            </View>

            <View style={styles.dropdownItemTextContainer}>
              <Text
                style={[styles.dropdownItemTitle, { color: colors.text }]}
              >
                Reset Filters
              </Text>
              <Text
                style={[
                  styles.dropdownItemSubtitle,
                  { color: colors.muted },
                ]}
              >
                Clear search and date selection
              </Text>
            </View>

            <MaterialIcons
              name="chevron-right"
              size={22}
              color={colors.muted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.dropdownCloseAction,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setShowFilterMenu(false)}
          >
            <Text style={[styles.dropdownCloseText, { color: colors.text }]}>
              Close
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );

  const renderFilters = () => (
    <View style={styles.filterContainer}>
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <MaterialIcons name="search" size={22} color={colors.muted} />

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by customer name or order ID..."
          placeholderTextColor={colors.muted}
          style={[styles.searchInput, { color: colors.text }]}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          blurOnSubmit={false}
          returnKeyType="search"
          accessibilityLabel="Search delivery history"
          accessibilityHint="Search by customer name or full or shortened order ID"
          onSubmitEditing={Keyboard.dismiss}
          underlineColorAndroid="transparent"
        />

        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearch('')}
            accessibilityLabel="Clear search"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="cancel" size={20} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Date Range
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
            Choose when your deliveries were completed
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            Keyboard.dismiss();
            setShowFilterMenu(true);
          }}
          activeOpacity={0.75}
          style={[
            styles.filterMenuButton,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
          accessibilityLabel="Open filter options"
        >
          <MaterialIcons name="tune" size={18} color={colors.primary} />
          <Text style={[styles.filterMenuButtonText, { color: colors.text }]}>
            Filters
          </Text>

          {hasActiveFilters && (
            <View
              style={[
                styles.activeFilterDot,
                { backgroundColor: colors.primary },
              ]}
            />
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => {
          Keyboard.dismiss();
          setShowDateDropdown(true);
        }}
        activeOpacity={0.75}
        style={[
          styles.dateSelector,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Selected date range: ${selectedDateFilter.label}`}
      >
        <View
          style={[
            styles.dateSelectorIcon,
            { backgroundColor: `${colors.primary}15` },
          ]}
        >
          <MaterialIcons
            name={selectedDateFilter.icon}
            size={22}
            color={colors.primary}
          />
        </View>

        <View style={styles.dateSelectorTextContainer}>
          <Text style={[styles.dateSelectorLabel, { color: colors.muted }]}>
            Selected range
          </Text>
          <Text
            style={[styles.dateSelectorValue, { color: colors.text }]}
            numberOfLines={1}
          >
            {selectedDateFilter.label}
          </Text>

          {dateFilter === 'CUSTOM' && (
            <Text
              style={[styles.dateSelectorCustomText, { color: colors.muted }]}
            >
              {formatDate(startDate)} – {formatDate(endDate)}
            </Text>
          )}
        </View>

        <MaterialIcons
          name="keyboard-arrow-down"
          size={25}
          color={colors.muted}
        />
      </TouchableOpacity>

      {dateFilter === 'CUSTOM' && (
        <View
          style={[
            styles.customDateCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.customDateHeader}>
            <MaterialIcons
              name="date-range"
              size={19}
              color={colors.primary}
            />
            <Text style={[styles.customDateTitle, { color: colors.text }]}>
              Custom Date Range
            </Text>
          </View>

          <View style={styles.dateButtonsRow}>
            <TouchableOpacity
              style={[
                styles.dateButton,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => openDatePicker('start')}
              activeOpacity={0.75}
            >
              <MaterialIcons
                name="calendar-today"
                size={19}
                color={colors.primary}
              />

              <View style={styles.dateButtonTextContainer}>
                <Text style={[styles.dateLabel, { color: colors.muted }]}>
                  Start Date
                </Text>
                <Text style={[styles.dateValue, { color: colors.text }]}>
                  {formatDate(startDate)}
                </Text>
              </View>

              <MaterialIcons
                name="edit-calendar"
                size={17}
                color={colors.muted}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.dateButton,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => openDatePicker('end')}
              activeOpacity={0.75}
            >
              <MaterialIcons name="event" size={19} color={colors.primary} />

              <View style={styles.dateButtonTextContainer}>
                <Text style={[styles.dateLabel, { color: colors.muted }]}>
                  End Date
                </Text>
                <Text style={[styles.dateValue, { color: colors.text }]}>
                  {formatDate(endDate)}
                </Text>
              </View>

              <MaterialIcons
                name="edit-calendar"
                size={17}
                color={colors.muted}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showPicker && (
        <View
          style={[
            styles.pickerContainer,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {Platform.OS === 'ios' && (
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>
                Select {pickerTarget === 'start' ? 'Start' : 'End'} Date
              </Text>

              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={[styles.doneText, { color: colors.primary }]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <DateTimePicker
            value={pickerTarget === 'start' ? startDate : endDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={pickerTarget === 'start' ? endDate : undefined}
            minimumDate={pickerTarget === 'end' ? startDate : undefined}
            onChange={handleDateChange}
          />
        </View>
      )}

      <View style={styles.resultsRow}>
        <View>
          <Text style={[styles.resultsTitle, { color: colors.text }]}>
            {dateFilter === 'ALL' ? 'All History' : 'Filtered History'}
          </Text>
          <Text style={[styles.resultsSubtitle, { color: colors.muted }]}>
            {filteredOrders.length} of {orders.length} orders
          </Text>
        </View>

        <MaterialIcons name="history" size={23} color={colors.primary} />
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={styles.headerContainer}>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            Delivery History
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            View and search your past deliveries
          </Text>
        </View>

        <TouchableOpacity
          onPress={fetchOrders}
          disabled={loading}
          style={[
            styles.refreshButton,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: loading ? 0.6 : 1,
            },
          ]}
          accessibilityLabel="Refresh delivery history"
        >
          <MaterialIcons name="refresh" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item, index) =>
          String(item?._id ?? `history-${index}`)
        }
        renderItem={renderItem}
        // IMPORTANT: Render the header as an element, not a component type.
        // This prevents the search TextInput from remounting on each keystroke.
        ListHeaderComponent={renderFilters()}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchOrders}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <>
                <View
                  style={[
                    styles.emptyIconContainer,
                    { backgroundColor: colors.card },
                  ]}
                >
                  <MaterialIcons
                    name={search.trim() ? 'search-off' : 'history'}
                    size={45}
                    color={colors.muted}
                  />
                </View>

                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {orders.length === 0
                    ? 'No delivery history yet'
                    : 'No matching orders'}
                </Text>

                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  {orders.length === 0
                    ? 'Your completed deliveries will appear here.'
                    : 'No orders match your search or selected date range.'}
                </Text>

                {hasActiveFilters && (
                  <TouchableOpacity
                    onPress={resetFilters}
                    style={[
                      styles.emptyResetButton,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text style={styles.emptyResetText}>Clear Filters</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        }
      />

      {renderDateDropdown()}
      {renderFilterOptionsModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 0,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 20,
    fontFamily: FONT_FAMILY.bold,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
    marginTop: 4,
  },
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    flexGrow: 1,
  },
  filterContainer: {
    paddingBottom: 10,
    minWidth: 0,
  },
  searchContainer: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 20,
    minWidth: 0,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontFamily: FONT_FAMILY.regular,
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitleContainer: {
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.bold,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    marginTop: 3,
    lineHeight: 16,
  },
  filterMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: 11,
    borderWidth: 1,
    flexShrink: 0,
  },
  filterMenuButtonText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.medium,
  },
  activeFilterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dateSelector: {
    minHeight: 76,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  dateSelectorIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateSelectorTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  dateSelectorLabel: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.regular,
    marginBottom: 4,
  },
  dateSelectorValue: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.bold,
  },
  dateSelectorCustomText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    marginTop: 4,
  },
  customDateCard: {
    borderWidth: 1,
    borderRadius: 15,
    padding: 13,
    marginBottom: 15,
    minWidth: 0,
  },
  customDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  customDateTitle: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
  },
  dateButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 57,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 11,
    padding: 9,
  },
  dateButtonTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  dateLabel: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.regular,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.bold,
  },
  pickerContainer: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    marginBottom: 15,
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  pickerTitle: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.medium,
  },
  doneText: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
  },
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 13,
  },
  resultsTitle: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.bold,
  },
  resultsSubtitle: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    marginTop: 3,
  },
  card: {
    width: '100%',
    minWidth: 0,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    width: '100%',
    minWidth: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  orderHeaderLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  orderId: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
  },
  date: {
    flexShrink: 1,
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    marginVertical: 13,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 11,
    gap: 8,
    minWidth: 0,
  },
  infoText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontFamily: FONT_FAMILY.regular,
    lineHeight: 19,
  },
  paymentRow: {
    width: '100%',
    minWidth: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 2,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  paymentMethodContainer: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentMethod: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
  },
  amount: {
    flexShrink: 1,
    maxWidth: '48%',
    fontSize: 15,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'right',
    includeFontPadding: false,
  },
  emptyContainer: {
    flex: 1,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingTop: 30,
    paddingBottom: 40,
  },
  emptyIconContainer: {
    width: 82,
    height: 82,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 17,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.bold,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
  },
  emptyResetButton: {
    marginTop: 17,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 11,
  },
  emptyResetText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dateDropdown: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 21,
    borderWidth: 1,
    padding: 17,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 10,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  dropdownIconContainer: {
    width: 43,
    height: 43,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownTitleContainer: {
    flex: 1,
    minWidth: 0,
  },
  dropdownTitle: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.bold,
  },
  dropdownSubtitle: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    marginTop: 4,
  },
  dropdownCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
  },
  dateDropdownItem: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 7,
  },
  dateOptionIcon: {
    width: 37,
    height: 37,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateOptionText: {
    flex: 1,
    fontSize: 13,
  },
  optionTrailing: {
    width: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownCloseAction: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownCloseText: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
  },
  filterDropdown: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 10,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 8,
  },
  dropdownItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownItemTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  dropdownItemTitle: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
  },
  dropdownItemSubtitle: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    marginTop: 4,
  },
});