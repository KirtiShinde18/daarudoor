import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, useWindowDimensions, FlatList, ActivityIndicator, TextInput, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../store/slices/cartSlice';
import { requireAuth } from '../../utils/authGuard';
import { useToast } from '../../providers/ToastProvider';

const SearchScreen = ({ navigation }: any) => {
  const { showToast } = useToast();
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const cartItems = useSelector((state: any) => state.cart.items);
  const isInCart = (productId: string) => cartItems.some((i: any) => i.id === productId);

  const fetchProducts = async (query = '') => {
    try {
      setLoading(true);
      const API_URL = process.env.EXPO_PUBLIC_API_URL || (
        Platform.OS === 'android'
          ? 'http://10.0.2.2:5500'
          : 'http://localhost:5500'
      );
      const url = query.trim() 
        ? `${API_URL}/api/customer/products?search=${encodeURIComponent(query.trim())}`
        : `${API_URL}/api/customer/products`;
        
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setProducts(data.data.filter((p: any) => p.status === 'Active' || p.status === undefined));
      }
    } catch (error) {
      console.error('Failed to fetch search products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch of all products
    fetchProducts();
  }, []);

  // Debounce logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts(searchQuery);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

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

  const styles = useMemo(() => StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: insets.top + 12,
      paddingBottom: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 48,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      marginLeft: 8,
      color: colors.text,
      fontSize: 15,
    },
    clearBtn: {
      padding: 4,
    },
    infoBar: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    infoText: {
      fontSize: 14,
      color: colors.muted,
      fontWeight: '500',
    },
    listContent: {
      padding: 16,
      paddingBottom: 100, // accommodate bottom tab
    },
    row: {
      justifyContent: 'space-between',
    },
    productCard: {
      width: (width - 48) / 2, 
      backgroundColor: colors.surface,
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    imageContainer: {
      width: '100%',
      aspectRatio: 1,
      backgroundColor: colors.card,
      position: 'relative',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 12,
    },
    productImage: {
      width: '100%',
      height: '100%',
    },
    badgeNew: {
      position: 'absolute',
      top: 10,
      left: 10,
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    badgeNewText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: 'bold',
    },
    heartBtn: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: 'rgba(255,255,255,0.9)',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    infoContainer: {
      padding: 12,
    },
    subText: {
      fontSize: 10,
      color: colors.muted,
      textTransform: 'uppercase',
      marginBottom: 2,
    },
    nameText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    volumeText: {
      fontSize: 12,
      color: colors.muted,
      marginBottom: 8,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    priceText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    mrpText: {
      fontSize: 11,
      color: colors.muted,
      textDecorationLine: 'line-through',
      marginLeft: 4,
    },
    addToCartBtn: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      marginTop: 40,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
    },
    emptyText: {
      fontSize: 14,
      color: colors.muted,
      marginTop: 8,
      textAlign: 'center',
    },
    loader: {
      marginTop: 40,
    }
  }), [colors, width, insets]);

  const renderProduct = ({ item }: { item: any }) => {
    const isNew = item.createdAt && (new Date().getTime() - new Date(item.createdAt).getTime()) < (7 * 24 * 60 * 60 * 1000);

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate('ProductDetails', { productId: item._id })}
        style={styles.productCard}
      >
        <View style={styles.imageContainer}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.productImage}
              resizeMode="contain"
            />
          ) : (
            <MaterialIcons name="local-drink" size={32} color={colors.muted} />
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
                console.log('Favorite clicked');
              }, { targetPath: 'Main' });
            }}
          >
            <MaterialIcons name="favorite-border" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.subText} numberOfLines={1}>{item.category}</Text>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={[styles.nameText, { flex: 1 }]} numberOfLines={2}>{item.name}</Text>
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
            <Text style={styles.volumeText} numberOfLines={1}>{item.volume}</Text>
          ) : null}

          <View style={styles.priceRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.priceText}>₹{item.price}</Text>
              {item.discountPrice && item.discountPrice > 0 && (
                <Text style={styles.mrpText}>₹{item.price + item.discountPrice}</Text>
              )}
            </View>
            
            <TouchableOpacity 
              style={styles.addToCartBtn}
              onPress={(e) => {
                e.stopPropagation();
                handleAddToCart(item);
              }}
            >
              <MaterialIcons name="add" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={24} color={colors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={20} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.infoBar}>
        <Text style={styles.infoText}>
          {searchQuery.trim() === '' ? 'All Products' : 'Search Results'} · {products.length} {products.length === 1 ? 'product' : 'products'}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="search-off" size={64} color={colors.muted} />
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptyText}>Try another product, category, or brand.</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          renderItem={renderProduct}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default SearchScreen;
