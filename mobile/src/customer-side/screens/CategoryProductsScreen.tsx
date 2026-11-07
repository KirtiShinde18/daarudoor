import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, useWindowDimensions, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useAppTheme } from '../../constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../store/slices/cartSlice';
import { requireAuth } from '../../utils/authGuard';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '../../providers/ToastProvider';
import { getApiBaseUrl } from '../../config/api.config';

const CategoryProductsScreen = ({ route, navigation }: any) => {
  const { showToast } = useToast();
  const { categoryId, categoryName } = route.params;
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const cartItems = useSelector((state: any) => state.cart.items);
  const isInCart = (productId: string) => cartItems.some((i: any) => i.id === productId);

  const fetchProducts = async () => {
    try {
      const API_URL = getApiBaseUrl();
      const response = await fetch(`${API_URL}/api/customer/products?category=${encodeURIComponent(categoryId)}`);
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch category products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

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
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: insets.top + 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    backButton: {
      marginRight: 16,
      padding: 4,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    listContent: {
      padding: 16,
      paddingBottom: 40,
    },
    row: {
      justifyContent: 'space-between',
    },
    productCard: {
      width: (width - 48) / 2, // 2 columns with 16 padding on sides and 16 gap
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
    },
    emptyText: {
      fontSize: 16,
      color: colors.muted,
      marginTop: 12,
      textAlign: 'center',
    },
    loader: {
      marginTop: 40,
    }
  }), [colors, width]);

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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryName}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="liquor" size={48} color={colors.muted} />
          <Text style={styles.emptyText}>No products available in this category yet.</Text>
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        />
      )}
    </View>
  );
};

export default CategoryProductsScreen;
