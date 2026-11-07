import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Image, TouchableOpacity, TextInput, useWindowDimensions, ImageBackground, Platform, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../constants/theme';
import { Card, Badge, Button } from '../../components/ui';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { addToCart } from '../../store/slices/cartSlice';
import { requireAuth } from '../../utils/authGuard';
import { updateUser } from '../../store/slices/authSlice';
import { useToast } from '../../providers/ToastProvider';
import { getApiBaseUrl } from '../../config/api.config';

const CATEGORIES = ['All', 'Beer', 'Lager', 'Ale', 'Craft Beer', 'Premium', 'Offers'];

const BASE_CATEGORIES = [
  { id: 'wine', name: 'Wine', image: require('../../../assets/categories/wine.png') },
  { id: 'whiskey', name: 'Whiskey', image: require('../../../assets/categories/whiskey.png') },
  { id: 'vodka', name: 'Vodka', image: require('../../../assets/categories/vodka.png') },
  { id: 'beer', name: 'Beer', image: require('../../../assets/categories/beer.png') },
  { id: 'brandy', name: 'Brandy', image: require('../../../assets/categories/brandy.png') },
  { id: 'rum', name: 'Rum', image: require('../../../assets/categories/rum.png') },
];

// Removed MOCK_PRODUCTS to use dynamic data from API

const HomeScreen = ({ navigation }: any) => {
  const { showToast } = useToast();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const user = useSelector((state: any) => state.auth.user);
  const cartItems = useSelector((state: any) => state.cart.items);
  const cartAppliedOffer = useSelector((state: any) => state.cart.appliedOffer);
  const cartSubtotal = useSelector((state: any) =>
    state.cart.items.reduce((total: number, item: any) => total + (item.price * item.quantity), 0)
  );

  const [customerName, setCustomerName] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const dispatch = useDispatch();

  const handleApplyOffer = async (offer: any) => {
    if (cartAppliedOffer?.code === offer.code) {
      showToast('Offer is already applied', 'success');
      return;
    }
    if (offer.minOrderValue && cartSubtotal < offer.minOrderValue) {
      showToast(`Minimum order value of ₹${offer.minOrderValue} required`, 'error');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('token');
      const API_URL = getApiBaseUrl();

      const response = await fetch(`${API_URL}/api/customer/offers/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: offer.code, cartTotal: cartSubtotal })
      });
      const data = await response.json();
      if (data.success) {
        dispatch({ type: 'cart/applyOffer', payload: { code: data.data.offer.code, discountAmount: data.data.discount } });
        showToast('Offer applied successfully!', 'success');
      } else {
        showToast(data.message || 'Invalid offer code', 'error');
      }
    } catch (error) {
      showToast('Failed to apply offer', 'error');
    }
  };

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [selectedGender, setSelectedGender] = useState<'Male' | 'Female' | null>(null);
  const [onboardingError, setOnboardingError] = useState('');
  const [isOnboardingLoading, setIsOnboardingLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const minLegalAge = 18;
  const maxEligibleYear = currentYear - minLegalAge;
  const years = useMemo(() => Array.from({ length: 60 }, (_, i) => maxEligibleYear - i), [maxEligibleYear]);

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [yearModalVisible, setYearModalVisible] = useState(false);

  useEffect(() => {
    if (user && (!user.ageVerified || !user.onboardingCompleted)) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  }, [user]);

  const isInCart = (productId: string) => cartItems.some((i: any) => i.id === productId);

  const handleAddToCart = (item: any) => {
    requireAuth(navigation, () => {
      dispatch(addToCart({
        id: item._id,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: 1,
        category: item.category,
        brand: item.brand,
      }));
      showToast("Added to Cart", "success");
    }, { targetPath: 'Main' });
  };

  const newArrivals = useMemo(() => {
    return [...products]
      .filter(p => p.status !== 'Inactive' && !p.isDeleted)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 10);
  }, [products]);

  const dynamicCategories = useMemo(() => {
    const categoryMap = new Map();

    // 1. Add base static categories first
    BASE_CATEGORIES.forEach(cat => {
      categoryMap.set(cat.name.toLowerCase(), {
        id: cat.id,
        name: cat.name,
        localImage: cat.image,
        imageUri: null
      });
    });

    // 2. Dynamically add any new categories from products
    products.forEach(p => {
      if (p.category && p.status !== 'Inactive' && !p.isDeleted) {
        const catKey = p.category.toLowerCase();
        if (!categoryMap.has(catKey)) {
          categoryMap.set(catKey, {
            id: p.category.toLowerCase().replace(/\s+/g, '-'),
            name: p.category,
            localImage: require('../../../assets/categories/beer.png'), // fallback for new categories
            imageUri: p.image || null
          });
        }
      }
    });

    return Array.from(categoryMap.values());
  }, [products]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const API_URL = getApiBaseUrl();
        const response = await fetch(`${API_URL}/api/customer/products`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setProducts(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
    };

    const fetchOffers = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const API_URL = getApiBaseUrl();
        const response = await fetch(`${API_URL}/api/customer/offers/active`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setOffers(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch offers:', error);
      }
    };

    fetchProducts();
    fetchOffers();
  }, []);

  useEffect(() => {
    if (user && user.name && user.name.trim() !== '') {
      setCustomerName(user.name.trim());
    } else {
      setCustomerName('');
    }
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning 🌅';
    if (hour < 17) return 'Good Afternoon 🌤️';
    return 'Good Evening 🌙';
  };

  const handleAgeContinue = () => {
    if (!selectedYear) {
      setOnboardingError('Please select your birth year');
      return;
    }
    setOnboardingError('');
    setOnboardingStep(2);
  };

  const handleGenderSubmit = async () => {
    if (!selectedGender) return;
    setIsOnboardingLoading(true);
    setOnboardingError('');

    try {
      const token = await AsyncStorage.getItem('token') || await AsyncStorage.getItem('userToken');
      const API_URL = getApiBaseUrl();

      const response = await fetch(`${API_URL}/api/auth/customer/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          birthYear: selectedYear,
          gender: selectedGender
        })
      });

      const data = await response.json();

      if (response.ok) {
        dispatch(updateUser(data.user));

        const updateStorage = async (key: string) => {
          const str = await AsyncStorage.getItem(key);
          if (str) {
            const parsed = JSON.parse(str);
            await AsyncStorage.setItem(key, JSON.stringify({ ...parsed, ...data.user }));
          }
        };
        await updateStorage('user');
        await updateStorage('userData');

        setShowOnboarding(false);
      } else {
        setOnboardingError(data.message || 'Onboarding failed');
      }
    } catch (error) {
      setOnboardingError('Network error. Please try again.');
    } finally {
      setIsOnboardingLoading(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: insets.top + 16,
      paddingBottom: 20,
    },
    greeting: {
      color: colors.muted,
      fontSize: 14,
      marginBottom: 2,
    },
    // title: {
    //   color: colors.text,
    //   fontSize: 22,
    //   fontWeight: '700',
    // },
    title: {
      color: colors.primary,
      fontSize: 24,
      fontFamily: 'Inter_700Bold',
      letterSpacing: 0.5,
    },
    subtitle: {
      color: colors.muted,
      fontSize: 13,
      marginTop: 2,
    },
    profileBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.card,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      marginHorizontal: 20,
      marginBottom: 24,
      paddingHorizontal: 16,
      height: 50,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      marginLeft: 10,
      color: colors.text,
      fontSize: 16,
    },
    heroImageContainer: {
      width: '100%',
      height: 450,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      overflow: 'hidden',
      zIndex: -1,
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    dashboardContent: {
      marginTop: -25,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      backgroundColor: colors.background,
      paddingTop: 24,
      // No shadow properties to keep it completely flat
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    bottomSheetContainer: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      padding: 24,
      paddingTop: 32,
      minHeight: '48%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -10 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 20,
    },
    onboardingTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 10,
    },
    onboardingSubtitle: {
      fontSize: 14,
      color: colors.muted,
      textAlign: 'center',
      marginBottom: 30,
      lineHeight: 20,
    },
    dropdownButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 20,
      paddingVertical: 18,
      marginBottom: 30,
    },
    dropdownText: { fontSize: 16, color: colors.text, fontWeight: '600' },
    dropdownTextPlaceholder: { fontSize: 16, color: colors.muted },
    yearModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    yearModalContent: {
      backgroundColor: colors.card,
      borderRadius: 20,
      width: '80%',
      maxHeight: '60%',
      overflow: 'hidden',
    },
    yearModalHeader: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      alignItems: 'center',
    },
    yearModalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    yearItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.05)',
      alignItems: 'center',
    },
    yearText: { fontSize: 16, color: colors.text },
    onboardingErrorText: {
      color: colors.primary,
      fontSize: 13,
      textAlign: 'center',
      marginBottom: 20,
    },
    genderOptions: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 30,
    },
    genderOption: {
      flex: 1,
      minHeight: 90,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: 'rgba(255,255,255,0.035)',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    genderOptionActive: {
      borderColor: colors.primary,
      backgroundColor: 'rgba(106,4,9,0.22)',
    },
    genderText: {
      color: colors.muted,
      fontSize: 16,
      fontWeight: '600',
    },
    genderTextActive: {
      color: colors.white,
    },
    horizontalScrollSection: {
      paddingLeft: 20,
      marginBottom: 24,
    },
    offerCard: {
      width: 300,
      borderRadius: 16,
      marginRight: 16,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    offerImageContainer: {
      width: '100%',
      height: 140,
      position: 'relative',
    },
    offerImage: {
      width: '100%',
      height: '100%',
    },
    offerBadge: {
      position: 'absolute',
      top: 12,
      left: 12,
      backgroundColor: colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    offerBadgeText: {
      color: colors.white,
      fontSize: 10,
      fontWeight: 'bold',
      letterSpacing: 0.5,
    },
    offerContent: {
      padding: 16,
    },
    offerTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
      marginBottom: 4,
    },
    offerDesc: {
      color: colors.muted,
      fontSize: 14,
      marginBottom: 12,
      lineHeight: 20,
    },
    offerCodeContainer: {
      backgroundColor: 'rgba(106, 4, 9, 0.08)',
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(106, 4, 9, 0.15)',
      marginBottom: 12,
    },
    emptyOfferCard: {
      borderRadius: 16,
      backgroundColor: 'rgba(106, 4, 9, 0.03)',
      borderWidth: 1,
      borderColor: 'rgba(106, 4, 9, 0.08)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      marginRight: 20,
    },
    emptyOfferIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: 'rgba(106, 4, 9, 0.08)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    emptyOfferTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 6,
    },
    emptyOfferDesc: {
      color: colors.muted,
      fontSize: 13,
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: 18,
      paddingHorizontal: 10,
    },
    emptyOfferBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
    },
    emptyOfferBtnText: {
      color: colors.white,
      fontWeight: '600',
      fontSize: 13,
    },
    offerCodeText: {
      color: colors.primary,
      fontWeight: '700',
      fontSize: 13,
      letterSpacing: 0.5,
    },
    offerFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginTop: 4,
    },
    offerConditionText: {
      color: colors.muted,
      fontSize: 12,
      marginBottom: 2,
    },
    offerValidityText: {
      color: colors.muted,
      fontSize: 12,
    },
    offerApplyBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    offerApplyBtnText: {
      color: colors.white,
      fontWeight: '700',
      fontSize: 13,
    },
    shoppingHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginTop: 8,
      marginBottom: 16,
    },
    shoppingTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    viewAllText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    categorySection: {
      marginBottom: 24,
    },
    categoryTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginLeft: 20,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
    },
    horizontalProductScroll: {
      paddingHorizontal: 20,
      paddingRight: 8,
    },
    newArrivalsCard: {
      width: 175,
      marginRight: 16,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      paddingBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    newArrivalsImageContainer: {
      width: '100%',
      height: 150,
      backgroundColor: colors.card,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      padding: 12,
    },
    newArrivalsImage: {
      width: '100%',
      height: '100%',
    },
    badgeNew: {
      position: 'absolute',
      top: 12,
      left: 12,
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    badgeNewText: {
      color: colors.white,
      fontSize: 10,
      fontWeight: 'bold',
      letterSpacing: 0.5,
    },
    heartBtn: {
      position: 'absolute',
      top: 12,
      right: 12,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.9)',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    newArrivalsInfo: {
      paddingHorizontal: 14,
      paddingTop: 14,
    },
    newArrivalsName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 6,
    },
    newArrivalsSub: {
      fontSize: 12,
      color: colors.muted,
      marginBottom: 10,
    },
    newArrivalsPriceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    newArrivalsPriceBlock: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    newArrivalsPrice: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    newArrivalsMrp: {
      fontSize: 12,
      color: colors.muted,
      textDecorationLine: 'line-through',
      marginLeft: 6,
    },
    addToCartBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    },
    shoppingCategoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    shoppingCategoryCard: {
      width: '48%',
      marginBottom: 16,
      borderRadius: 16,
      backgroundColor: colors.surface,
      overflow: 'hidden',
      alignItems: 'center',
      paddingBottom: 12,
    },
    shoppingCategoryImageContainer: {
      width: '100%',
      height: 120,
      backgroundColor: colors.card,
      marginBottom: 8,
    },
    shoppingCategoryName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },

  }), [colors]);

  return (
    <SafeAreaView style={styles.safeArea}>

      {/* FIXED BACKGROUND LAYER (Stays behind while scrolling) */}
      <View style={[StyleSheet.absoluteFill, { zIndex: 1 }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            {customerName ? <Text style={styles.title}>{customerName}</Text> : <Text style={styles.title}>Hello 👋</Text>}
            <Text style={styles.subtitle}>Find your favourite drinks</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn}>
            <MaterialIcons name="notifications-none" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroImageContainer}>
          <Image
            source={require('../../../assets/Home.jpg')}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* FOREGROUND SCROLL LAYER */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        style={{ zIndex: 2, elevation: 2 }}
      >

        {/* DUMMY SPACER: Exactly mirrors the height of the fixed background elements so the overlap aligns perfectly */}
        <View style={{ opacity: 0 }} pointerEvents="none">
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              {customerName ? <Text style={styles.title}>Hello, {customerName} 👋</Text> : <Text style={styles.title}>Hello 👋</Text>}
              <Text style={styles.subtitle}>Find your favourite drinks</Text>
            </View>
            <View style={styles.profileBtn} />
          </View>
          <View style={styles.heroImageContainer} />
        </View>

        {/* OVERLAPPING DASHBOARD CONTENT */}
        <View style={[styles.dashboardContent, { zIndex: 3 }]}>

          {/* HORIZONTAL EXPLORE SCROLL (Using existing banner/offer concept) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollSection}
          >
            {offers.length > 0 ? offers.map((offer) => {
              const isApplied = cartAppliedOffer?.code === offer.code;

              return (
                <View key={offer._id} style={styles.offerCard}>
                  <View style={styles.offerImageContainer}>
                    <Image
                      source={{ uri: offer.image?.secure_url }}
                      style={styles.offerImage}
                      resizeMode="cover"
                    />
                    <View style={styles.offerBadge}>
                      <Text style={styles.offerBadgeText}>SPECIAL OFFER</Text>
                    </View>
                  </View>

                  <View style={styles.offerContent}>
                    <Text style={styles.offerTitle} numberOfLines={1}>{offer.title}</Text>
                    <Text style={styles.offerDesc} numberOfLines={2}>{offer.description}</Text>

                    {offer.code && (
                      <View style={styles.offerCodeContainer}>
                        <Text style={styles.offerCodeText}>Code: {offer.code}</Text>
                      </View>
                    )}

                    <View style={styles.offerFooter}>
                      <View>
                        {offer.minOrderValue > 0 && (
                          <Text style={styles.offerConditionText}>On orders above ₹{offer.minOrderValue}</Text>
                        )}
                        <Text style={styles.offerValidityText}>Valid till {new Date(offer.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.offerApplyBtn, isApplied && { backgroundColor: '#10b981', shadowColor: '#10b981' }]}
                        onPress={() => handleApplyOffer(offer)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.offerApplyBtnText}>{isApplied ? 'Applied' : 'Apply Offer'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )
            }) : (
              <View style={[styles.emptyOfferCard, { width: width - 40 }]}>
                <View style={styles.emptyOfferIconContainer}>
                  <MaterialIcons name="card-giftcard" size={28} color={colors.primary} />
                </View>
                <Text style={styles.emptyOfferTitle}>No Offers Right Now</Text>
                <Text style={styles.emptyOfferDesc}>
                  Great deals are coming soon! Keep shopping and we'll bring you exciting offers and discounts.
                </Text>
                <TouchableOpacity 
                  style={styles.emptyOfferBtn} 
                  onPress={() => navigation.navigate('Search')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyOfferBtnText}>Continue Shopping</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Start Shopping Header */}
          <View style={styles.shoppingHeader}>
            <Text style={styles.shoppingTitle}>Start Shopping</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Search')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Dynamic Shopping Categories */}
          <View style={styles.shoppingCategoryGrid}>
            {dynamicCategories.map((cat: any) => (
              <TouchableOpacity
                key={cat.id}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('CategoryProducts', { categoryId: cat.name, categoryName: cat.name })}
                style={styles.shoppingCategoryCard}
              >
                <View style={styles.shoppingCategoryImageContainer}>
                  {cat.imageUri ? (
                    <Image source={{ uri: cat.imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <Image source={cat.localImage} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  )}
                </View>
                <Text style={styles.shoppingCategoryName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.shoppingHeader}>
            <Text style={styles.shoppingTitle}>New Arrivals</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Search')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalProductScroll}
            data={newArrivals}
            keyExtractor={item => item._id}
            renderItem={({ item }) => {
              // Assume products added within the last 7 days are "NEW"
              const isNew = item.createdAt && (new Date().getTime() - new Date(item.createdAt).getTime()) < (7 * 24 * 60 * 60 * 1000);

              return (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('ProductDetails', { productId: item._id })}
                  style={styles.newArrivalsCard}
                >
                  <View style={styles.newArrivalsImageContainer}>
                    {item.image ? (
                      <Image
                        source={{ uri: item.image }}
                        style={styles.newArrivalsImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <MaterialIcons name="local-drink" size={40} color={colors.muted} />
                    )}

                    {isNew && (
                      <View style={styles.badgeNew}>
                        <Text style={styles.badgeNewText}>NEW</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.heartBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        requireAuth(navigation, () => {
                          // TODO: implement favorite API
                          console.log('Favorite clicked');
                        }, { targetPath: 'Main' });
                      }}
                    >
                      <MaterialIcons name="favorite-border" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.newArrivalsInfo}>
                    <Text style={[styles.newArrivalsSub, { fontSize: 10, textTransform: 'uppercase', marginBottom: 2 }]} numberOfLines={1}>
                      {item.category}
                    </Text>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text style={[styles.newArrivalsName, { flex: 1 }]} numberOfLines={2}>{item.name}</Text>
                      {(item.averageRating > 0 || item.reviewCount > 0) && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 6 }}>
                          <Text style={{ fontSize: 11, fontWeight: '600', color: colors.text }}>
                            {item.averageRating?.toFixed(1) || '0.0'}
                          </Text>
                          <MaterialIcons name="star" size={12} color="#F59E0B" style={{ marginLeft: 2 }} />
                          <Text style={{ fontSize: 10, color: colors.muted, marginLeft: 2, fontWeight: '400' }}>({item.reviewCount})</Text>
                        </View>
                      )}
                    </View>

                    {item.volume ? (
                      <Text style={[styles.newArrivalsSub, { marginBottom: 8 }]} numberOfLines={1}>
                        {item.volume}
                      </Text>
                    ) : null}

                    <View style={styles.newArrivalsPriceRow}>
                      <View style={styles.newArrivalsPriceBlock}>
                        <Text style={styles.newArrivalsPrice}>₹{item.price}</Text>
                        {item.discountPrice && item.discountPrice > 0 && (
                          <Text style={styles.newArrivalsMrp}>₹{item.price + item.discountPrice}</Text> // Mocking MRP logic or use actual MRP if exists
                        )}
                      </View>

                      <TouchableOpacity
                        style={styles.addToCartBtn}
                        activeOpacity={0.7}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleAddToCart(item);
                        }}
                      >
                        <MaterialIcons name="add" size={20} color={colors.white} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />

        </View>
      </ScrollView>

      <Modal
        visible={showOnboarding}
        transparent={true}
        animationType="fade"
      >
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.bottomSheetContainer}>
            {onboardingStep === 1 ? (
              <>
                <Text style={styles.onboardingTitle}>What's your birth year?</Text>
                <Text style={styles.onboardingSubtitle}>
                  You must be at least {minLegalAge} to use DaaruDoor.
                </Text>

                <TouchableOpacity
                  style={styles.dropdownButton}
                  activeOpacity={0.7}
                  onPress={() => {
                    setYearModalVisible(true);
                    setOnboardingError('');
                  }}
                >
                  <Text style={selectedYear ? styles.dropdownText : styles.dropdownTextPlaceholder}>
                    {selectedYear ? selectedYear.toString() : 'Select your birth year'}
                  </Text>
                  <MaterialIcons name="arrow-drop-down" size={24} color={colors.muted} />
                </TouchableOpacity>

                {onboardingError ? <Text style={styles.onboardingErrorText}>{onboardingError}</Text> : null}

                <Button
                  title="Continue"
                  onPress={handleAgeContinue}
                  variant={selectedYear ? 'primary' : 'disabled'}
                />
              </>
            ) : (
              <>
                <Text style={styles.onboardingTitle}>What's your gender?</Text>
                <Text style={styles.onboardingSubtitle}>
                  Help us personalize your experience.
                </Text>

                <View style={styles.genderOptions}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.genderOption, selectedGender === 'Male' && styles.genderOptionActive]}
                    onPress={() => setSelectedGender('Male')}
                  >
                    <MaterialIcons name="male" size={32} color={selectedGender === 'Male' ? colors.primaryLight : colors.muted} />
                    <Text style={[styles.genderText, selectedGender === 'Male' && styles.genderTextActive]}>Male</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.genderOption, selectedGender === 'Female' && styles.genderOptionActive]}
                    onPress={() => setSelectedGender('Female')}
                  >
                    <MaterialIcons name="female" size={32} color={selectedGender === 'Female' ? colors.primaryLight : colors.muted} />
                    <Text style={[styles.genderText, selectedGender === 'Female' && styles.genderTextActive]}>Female</Text>
                  </TouchableOpacity>
                </View>

                {onboardingError ? <Text style={styles.onboardingErrorText}>{onboardingError}</Text> : <View style={{ height: 33 }} />}

                <Button
                  title="Submit & Verify"
                  onPress={handleGenderSubmit}
                  loading={isOnboardingLoading}
                  variant={selectedGender ? 'primary' : 'disabled'}
                />
              </>
            )}
          </Animated.View>
        </KeyboardAvoidingView>

        <Modal
          visible={yearModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setYearModalVisible(false)}
        >
          <TouchableOpacity style={styles.yearModalOverlay} activeOpacity={1} onPress={() => setYearModalVisible(false)}>
            <View style={styles.yearModalContent}>
              <View style={styles.yearModalHeader}>
                <Text style={styles.yearModalTitle}>Select Year</Text>
              </View>
              <FlatList
                data={years}
                keyExtractor={(item) => item.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.yearItem}
                    onPress={() => {
                      setSelectedYear(item);
                      setYearModalVisible(false);
                    }}
                  >
                    <Text style={styles.yearText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </Modal>

    </SafeAreaView>
  );
};

export default HomeScreen;
