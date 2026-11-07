import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '../../constants/theme';

import DeliveryDashboardScreen from '../screens/DeliveryDashboardScreen';
import DeliveryNewOrdersScreen from '../screens/DeliveryNewOrdersScreen';
import DeliveryActiveOrdersScreen from '../screens/DeliveryActiveOrdersScreen';
import DeliveryHistoryScreen from '../screens/DeliveryHistoryScreen';
import DeliveryProfileScreen from '../screens/DeliveryProfileScreen';

export type DeliveryMainTabParamList = {
  Home: undefined;
  New: undefined;
  Shipments: undefined;
  History: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<DeliveryMainTabParamList>();

const DeliveryTabBar = ({ state, descriptors, navigation }: any) => {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom + 10 : 20 }]}>
      <BlurView 
        intensity={80} 
        tint={isDark ? 'dark' : 'light'} 
        style={[styles.glassPill, { borderColor: colors.border }]}
      >
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          let iconName: keyof typeof MaterialIcons.glyphMap = 'home';
          if (route.name === 'New') iconName = 'notifications';
          else if (route.name === 'Shipments') iconName = 'local-shipping';
          else if (route.name === 'History') iconName = 'history';
          else if (route.name === 'Profile') iconName = 'person';

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              style={styles.tabButton}
            >
              <View style={[
                styles.iconContainer, 
                isFocused && { 
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                  borderWidth: 1,
                  borderRadius: 18,
                }
              ]}>
                <MaterialIcons 
                  name={iconName} 
                  size={24} 
                  color={isFocused ? colors.white : colors.muted} 
                />
                {isFocused && (
                  <Text style={[styles.tabLabel, { color: colors.white }]}>
                    {route.name}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
};

import { getAssignedOrders, updateOrderLocation } from '../../api/delivery.api';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const LOCATION_TASK_NAME = 'background-delivery-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: { data: any; error: any }) => {
  if (error) {
    console.error("Background Location Error", error);
    return;
  }
  if (data) {
    const { locations } = data as any;
    const location = locations[0];
    if (location) {
      const { latitude, longitude, heading } = location.coords;
      try {
        const res = await getAssignedOrders();
        if (res?.success) {
          const activeOrders = res.data.filter((o: any) => ['ACCEPTED', 'OUT_FOR_DELIVERY', 'ARRIVED'].includes(o.status));
          for (const order of activeOrders) {
            await updateOrderLocation(order._id, latitude, longitude, heading || 0);
          }
        }
      } catch (err) {
        console.error("Background Location API Error", err);
      }
    }
  }
});

export const DeliveryNavigator = () => {
  const [activeOrders, setActiveOrders] = React.useState<any[]>([]);

  React.useEffect(() => {
    let pollInterval: ReturnType<typeof setInterval>;

    const fetchActive = async () => {
      try {
        const res = await getAssignedOrders();
        if (res?.success) {
          const active = res.data.filter((o: any) => ['ACCEPTED', 'OUT_FOR_DELIVERY', 'ARRIVED'].includes(o.status));
          setActiveOrders(active);
        }
      } catch (err) {
        console.error("Failed to fetch active orders", err);
      }
    };

    fetchActive();
    pollInterval = setInterval(fetchActive, 20000); // Check every 20s

    return () => clearInterval(pollInterval);
  }, []);

  React.useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      if (activeOrders.length === 0) {
        // Stop background tracking if no active orders
        const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
        if (isRegistered) {
          await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        }
        if (locationSubscription) {
          locationSubscription.remove();
        }
        return;
      }

      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      if (fgStatus !== 'granted') {
        console.warn('Foreground Location permission denied');
        return;
      }

      // Foreground Tracking Fallback
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        async (location) => {
          const { latitude, longitude, heading } = location.coords;
          for (const order of activeOrders) {
            try {
              await updateOrderLocation(order._id, latitude, longitude, heading || 0);
            } catch (err) {
              console.error("Update location failed", err);
            }
          }
        }
      );

      // Request Background Permissions
      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
      if (bgStatus === 'granted') {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
        if (!isRegistered) {
          await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
            showsBackgroundLocationIndicator: true,
            foregroundService: {
              notificationTitle: "DaaruDoor Delivery",
              notificationBody: "Tracking your location for active deliveries",
              notificationColor: "#6A0409",
            },
          });
        }
      }
    };

    startTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      // Note: We don't unregister background task on unmount, it manages itself based on activeOrders
    };
  }, [activeOrders]);

  return (
    <Tab.Navigator
      tabBar={props => <DeliveryTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={DeliveryDashboardScreen} />
      <Tab.Screen name="New" component={DeliveryNewOrdersScreen} />
      <Tab.Screen name="Shipments" component={DeliveryActiveOrdersScreen} />
      <Tab.Screen name="History" component={DeliveryHistoryScreen} />
      <Tab.Screen name="Profile" component={DeliveryProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  glassPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 4,
  },
});
