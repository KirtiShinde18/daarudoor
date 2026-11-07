import React from 'react';
import { 
  Clock, 
  CheckCircle2, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  CornerUpLeft 
} from 'lucide-react';

interface OrderStatusBadgeProps {
  status: string;
}

export const getOrderStatusConfig = (status: string) => {
  const normalized = status?.toUpperCase() || '';
  
  switch (normalized) {
    case 'PENDING':
      return { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200', icon: Clock, label: 'Pending' }; // Amber
    case 'CONFIRMED':
      return { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200', icon: CheckCircle2, label: 'Confirmed' }; // Blue
    case 'PROCESSING':
    case 'PREPARING':
      return { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200', icon: Package, label: 'Processing' }; // Purple
    case 'READY_FOR_PICKUP':
      return { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-200', icon: Package, label: 'Ready for Pickup' }; // Indigo
    case 'ASSIGNED':
      return { bg: 'bg-teal-100', text: 'text-teal-600', border: 'border-teal-200', icon: CheckCircle2, label: 'Assigned' }; // Teal
    case 'ACCEPTED':
      return { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200', icon: CheckCircle2, label: 'Accepted' }; // Emerald
    case 'PICKED_UP':
      return { bg: 'bg-cyan-100', text: 'text-cyan-600', border: 'border-cyan-200', icon: Package, label: 'Picked Up' }; // Cyan
    case 'OUT_FOR_DELIVERY':
      return { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200', icon: Truck, label: 'On the Way' }; // Blue
    case 'ARRIVED':
      return { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200', icon: CheckCircle2, label: 'Arrived' }; // Amber
    case 'DELIVERED':
      return { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200', icon: CheckCircle, label: 'Delivered' }; // Green
    case 'CANCELLED':
      return { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200', icon: XCircle, label: 'Cancelled' }; // Red
    case 'REJECTED':
    case 'FAILED':
      return { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', icon: AlertCircle, label: normalized === 'REJECTED' ? 'Rejected' : 'Failed' }; // Dark Red
    case 'REFUNDED':
    case 'RETURNED':
      return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', icon: CornerUpLeft, label: normalized === 'REFUNDED' ? 'Refunded' : 'Returned' }; // Gray
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', icon: AlertCircle, label: status || 'Unknown' };
  }
};

export const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => {
  const config = getOrderStatusConfig(status);
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
};
