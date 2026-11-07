import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '../config/api.config';

// Strip /api to get socket server origin
const SOCKET_URL = getApiBaseUrl().replace(/\/api\/?$/, '');

class SocketClientService {
  private socket: Socket | null = null;
  private connecting = false;

  async getSocket(): Promise<Socket | null> {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (this.connecting) {
      // Wait a moment for connection
      await new Promise(res => setTimeout(res, 500));
      if (this.socket) return this.socket;
    }

    return this.connect();
  }

  async connect(): Promise<Socket | null> {
    if (this.socket?.connected) return this.socket;

    try {
      this.connecting = true;
      const token =
        (await AsyncStorage.getItem('userToken')) ||
        (await AsyncStorage.getItem('token'));

      if (!token) {
        this.connecting = false;
        return null;
      }

      if (this.socket) {
        this.socket.disconnect();
      }

      this.socket = io(SOCKET_URL, {
        auth: { token },
        query: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        console.log('⚡ Socket connected successfully to:', SOCKET_URL);
        this.connecting = false;
      });

      this.socket.on('connect_error', (err) => {
        console.warn('⚠️ Socket connection error:', err.message);
        this.connecting = false;
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
      });

      return this.socket;
    } catch (err) {
      console.error('Socket init failed:', err);
      this.connecting = false;
      return null;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connecting = false;
  }

  async joinOrder(orderId: string, onInitData?: (data: any) => void) {
    const socket = await this.getSocket();
    if (!socket) return;

    socket.emit('join_order', { orderId }, (response: any) => {
      if (response && response.success) {
        console.log(`Joined order room order_${orderId}`);
        if (onInitData) onInitData(response);
      } else {
        console.warn(`Failed to join order room:`, response?.message);
      }
    });
  }

  leaveOrder(orderId: string) {
    if (this.socket) {
      this.socket.emit('leave_order', { orderId });
    }
  }

  onLocationUpdate(callback: (data: { orderId: string; currentLocation: any; status: string; updatedAt: string }) => void) {
    if (this.socket) {
      this.socket.off('delivery_location_updated');
      this.socket.on('delivery_location_updated', callback);
    }
  }

  onStatusUpdate(callback: (data: { orderId: string; status: string; updatedAt: string; timestamps?: any }) => void) {
    if (this.socket) {
      this.socket.off('order_status_updated');
      this.socket.on('order_status_updated', callback);
    }
  }

  emitDeliveryLocation(data: {
    orderId: string;
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    accuracy?: number;
  }, ack?: (res: any) => void) {
    if (this.socket?.connected) {
      this.socket.emit('delivery_location_update', data, ack);
    }
  }
}

export const socketClient = new SocketClientService();
export default socketClient;
