import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '../constants/theme';

// App Screens
import SplashScreen from '../app/splash/SplashScreen';
import OnboardingScreen from '../app/onboarding/OnboardingScreen';
import AgeVerificationScreen from '../app/auth/AgeVerificationScreen';
import GenderScreen from '../app/auth/GenderScreen';
import LocationScreen from '../app/auth/LocationScreen';
import AuthSelectionScreen from '../app/auth/AuthSelectionScreen';
import SignUpScreen from '../app/auth/SignUpScreen';
import LoginScreen from '../app/auth/LoginScreen';
import LoginOTPScreen from '../app/auth/LoginOTPScreen';
import OTPVerificationScreen from '../app/auth/OTPVerificationScreen';
import ForgotPasswordScreen from '../app/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../app/auth/ResetPasswordScreen';

// Customer Screens
import HomeScreen from '../customer-side/screens/HomeScreen';
import CartScreen from '../customer-side/screens/CartScreen';
import ProfileScreen from '../customer-side/screens/ProfileScreen';
import CategoryProductsScreen from '../customer-side/screens/CategoryProductsScreen';
import CheckoutScreen from '../customer-side/screens/CheckoutScreen';
import OrderSuccessScreen from '../customer-side/screens/OrderSuccessScreen';
import EditProfileScreen from '../customer-side/screens/EditProfileScreen';
import SearchScreen from '../customer-side/screens/SearchScreen';
import MyAddressesScreen from '../customer-side/screens/MyAddressesScreen';
import AddEditAddressScreen from '../customer-side/screens/AddEditAddressScreen';
import OrderHistoryScreen from '../customer-side/screens/OrderHistoryScreen';
import OrderDetailsScreen from '../customer-side/screens/OrderDetailsScreen';
import TrackOrderScreen from '../customer-side/screens/TrackOrderScreen';
import ProductDetailsScreen from '../customer-side/screens/ProductDetailsScreen';

// Delivery Screens
import { DeliveryNavigator } from '../delivery-side/navigation/DeliveryNavigator';
import DeliveryOrdersScreen from '../delivery-side/screens/DeliveryOrdersScreen';
import DeliveryOrderDetailsScreen from '../delivery-side/screens/DeliveryOrderDetailsScreen';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  AgeVerification: { targetPath?: string } | undefined;
  Gender: { targetPath?: string; birthYear?: number } | undefined;
  Location: undefined;
  AuthSelection: undefined;
  SignUp: undefined;
  Login: { targetPath?: string } | undefined;
  LoginOTP: { targetPath?: string } | undefined;
  OTPVerification: { email: string; targetPath?: string; mode: 'login' | 'forgot' } | undefined;
  ForgotPassword: undefined;
  ResetPassword: { resetToken: string } | undefined;
  Main: undefined;
  DeliveryMain: undefined;
  EditProfile: { userProfile: any };
  CategoryProducts: { categoryId: string; categoryName: string };
  Checkout: undefined;
  OrderSuccess: { orderId: string; amount: number; method: string };
  MyAddresses: { selectMode?: boolean } | undefined;
  AddEditAddress: { address?: any, isSelectMode?: boolean } | undefined;
  OrderHistory: undefined;
  OrderDetails: { orderId: string };
  TrackOrder: { orderId: string };
  DeliveryOrderDetails: { orderId: string };
  DeliveryOrders: undefined;
  ProductDetails: { productId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Cart: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

import { useSelector } from 'react-redux';
import { RootState } from '../store';

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const mainRoutes = state.routes.filter((r: any) => r.name !== 'Cart');
  const cartRoute = state.routes.find((r: any) => r.name === 'Cart');

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom + 10 : 20 }]}>
      
      {/* Main Glass Pill */}
      <BlurView 
        intensity={80} 
        tint={isDark ? 'dark' : 'light'} 
        style={[styles.glassPill, { borderColor: colors.border }]}
      >
        {mainRoutes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === state.routes.findIndex((r: any) => r.name === route.name);

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

          let iconName: keyof typeof MaterialIcons.glyphMap = 'store';
          if (route.name === 'Search') iconName = 'search';
          else if (route.name === 'Profile') iconName = 'person';

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
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

      {/* Separate Cart Button */}
      {cartRoute && (
        <TouchableOpacity
          style={[styles.cartButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('Cart')}
        >
          <MaterialIcons name="shopping-cart" size={24} color={colors.white} />
          {cartCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

    </View>
  );
};

import { store } from '../store';

const MainNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
      />
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
    paddingHorizontal: 10,
    marginRight: 14,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 6,
  },
  cartButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

import { DefaultTheme, DarkTheme } from '@react-navigation/native';

export const RootNavigator = () => {
  const { colors, isDark } = useAppTheme();

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="AgeVerification" component={AgeVerificationScreen} />
        <Stack.Screen name="Gender" component={GenderScreen} />
        <Stack.Screen name="Location" component={LocationScreen} />
        <Stack.Screen name="AuthSelection" component={AuthSelectionScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="LoginOTP" component={LoginOTPScreen} />
        <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="Main" component={MainNavigator} />
        <Stack.Screen name="DeliveryMain" component={DeliveryNavigator} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="CategoryProducts" component={CategoryProductsScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
        <Stack.Screen name="MyAddresses" component={MyAddressesScreen} />
        <Stack.Screen name="AddEditAddress" component={AddEditAddressScreen} />
        <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
        <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
        <Stack.Screen name="TrackOrder" component={TrackOrderScreen} />
        <Stack.Screen name="DeliveryOrderDetails" component={DeliveryOrderDetailsScreen} />
        <Stack.Screen name="DeliveryOrders" component={DeliveryOrdersScreen} />
        <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
