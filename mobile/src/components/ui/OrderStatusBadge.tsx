import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../constants/theme';

interface OrderStatusBadgeProps {
  status: string;
}

export const getOrderStatusConfig = (status: string) => {
  const normalized = status?.toUpperCase() || '';
  
  switch (normalized) {
    case 'PENDING':
      return { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', icon: 'schedule' as any, label: 'Pending' }; // Amber
    case 'CONFIRMED':
      return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6', icon: 'check-circle-outline' as any, label: 'Confirmed' }; // Blue
    case 'PROCESSING':
    case 'PREPARING':
      return { bg: 'rgba(147, 51, 234, 0.15)', text: '#9333EA', icon: 'inventory' as any, label: 'Processing' }; // Purple
    case 'READY_FOR_PICKUP':
      return { bg: 'rgba(79, 70, 229, 0.15)', text: '#4F46E5', icon: 'inventory' as any, label: 'Ready for Pickup' }; // Indigo
    case 'ASSIGNED':
      return { bg: 'rgba(13, 148, 136, 0.15)', text: '#0D9488', icon: 'assignment-ind' as any, label: 'Assigned' }; // Teal
    case 'ACCEPTED':
      return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', icon: 'thumb-up' as any, label: 'Accepted' }; // Emerald
    case 'PICKED_UP':
      return { bg: 'rgba(8, 145, 178, 0.15)', text: '#0891B2', icon: 'inventory' as any, label: 'Picked Up' }; // Cyan
    case 'OUT_FOR_DELIVERY':
      return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6', icon: 'two-wheeler' as any, label: 'On the Way' }; // Blue
    case 'ARRIVED':
      return { bg: 'rgba(157, 2, 8, 0.15)', text: '#9D0208', icon: 'place' as any, label: 'Arrived' }; // Brand Wine Accent
    case 'DELIVERED':
      return { bg: 'rgba(34, 197, 94, 0.15)', text: '#22C55E', icon: 'done-all' as any, label: 'Delivered' }; // Green
    case 'CANCELLED':
      return { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', icon: 'cancel' as any, label: 'Cancelled' }; // Red
    case 'REJECTED':
    case 'FAILED':
      return { bg: 'rgba(153, 27, 27, 0.15)', text: '#991B1B', icon: 'error-outline' as any, label: normalized === 'REJECTED' ? 'Rejected' : 'Failed' }; // Dark Red
    case 'REFUNDED':
    case 'RETURNED':
      return { bg: 'rgba(75, 85, 99, 0.15)', text: '#4B5563', icon: 'assignment-return' as any, label: normalized === 'REFUNDED' ? 'Refunded' : 'Returned' }; // Gray
    default:
      return { bg: 'rgba(107, 114, 128, 0.15)', text: '#6B7280', icon: 'info-outline' as any, label: status || 'Unknown' };
  }
};

export const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => {
  const config = getOrderStatusConfig(status);

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <MaterialIcons name={config.icon} size={14} color={config.text} style={styles.icon} />
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
};

import { FONT_FAMILY } from '../../constants/typography';

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
  },
});
