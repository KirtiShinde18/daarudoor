import { NavigatorScreenParams } from '@react-navigation/native';
import { Address } from './address.types';
import { Product } from './product.types';
import { Order } from './order.types';

export type MainTabParamList = {
  Home: undefined;
  Cart: undefined;
  Orders: undefined;
  Profile: undefined;
};

export type DeliveryTabParamList = {
  Dashboard: undefined;
  Orders: undefined;
  Profile: undefined;
};

export type AuthStackParamList = {
  Login: { targetPath?: string };
  LoginOTP: { targetPath?: string };
  SignUp: undefined;
  ForgotPassword: { targetPath?: string };
  AgeVerification: { targetPath?: string };
};

export type RootStackParamList = {
  Splash: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  DeliveryMain: NavigatorScreenParams<DeliveryTabParamList>;
  
  // Shared / Modal Screens
  ProductDetails: { product: Product; productId?: string };
  Checkout: undefined;
  OrderDetails: { order: Order; orderId?: string };
  MyAddresses: { selectMode?: boolean };
  AddEditAddress: { address?: Address; isSelectMode?: boolean };
  EditProfile: undefined;
};
