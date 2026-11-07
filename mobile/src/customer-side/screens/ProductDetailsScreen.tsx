import { useToast } from '../../providers/ToastProvider';
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Platform, 
  Image,
  Modal,
  TextInput,
  Alert,
  useWindowDimensions
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, updateQuantity } from '../../store/slices/cartSlice';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:5500' : 'http://localhost:5500');

const ProductDetailsScreen = ({ route, navigation }: any) => {
  const { showToast } = useToast();
  const { productId } = route.params;
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { width } = useWindowDimensions();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [localQty, setLocalQty] = useState(1);

  const cartItems = useSelector((state: any) => state.cart.items);
  const cartItem = cartItems.find((i: any) => i.id === productId);
  const isInCart = !!cartItem;
  const currentQty = isInCart ? cartItem.quantity : localQty;

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const user = useSelector((state: any) => state.auth.user);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError('');
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`${BASE_URL}/api/customer/products/${productId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      
      if (data.success) {
        setProduct(data.data);
      } else {
        setError(data.message || 'Product not found');
      }

      // Fetch reviews
      const reviewsRes = await fetch(`${BASE_URL}/api/customer/products/${productId}/reviews`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const reviewsData = await reviewsRes.json();
      if (reviewsData.success) {
        setReviews(reviewsData.data);
      }

      // Check review eligibility
      if (token && user) {
        const eligRes = await fetch(`${BASE_URL}/api/customer/products/${productId}/can-review`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const eligData = await eligRes.json();
        if (eligData.success && eligData.eligible) {
          setCanReview(true);
        }
      }

    } catch (err: any) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (reviewRating === 0) {
      showToast('Please select a rating', 'error');
      return;
    }
    if (reviewText.trim().length < 5) {
      showToast('Review must be at least 5 characters', 'error');
      return;
    }

    try {
      setSubmittingReview(true);
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/api/customer/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: reviewRating, comment: reviewText.trim() }),
      });
      
      const data = await response.json();
      if (data.success) {
        showToast('Review added successfully!', 'success');
        setShowReviewModal(false);
        setReviewRating(0);
        setReviewText('');
        fetchProduct(); // refresh product and reviews
      } else {
        showToast(data.message || 'Failed to submit review', 'error');
      }
    } catch (err) {
      showToast('Network error while submitting review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const handleAddToCart = () => {
    if (!isInCart && product) {
      dispatch(addToCart({
        id: product._id,
        name: product.name,
        price: product.discountPrice || product.price,
        image: product.image,
        volume: product.volume,
        quantity: localQty,
      }));
      showToast("Added to Cart", "success");
    }
  };

  const handleIncrement = () => {
    if (isInCart) {
      dispatch(updateQuantity({ id: productId, quantity: cartItem.quantity + 1 }));
    } else {
      setLocalQty(prev => prev + 1);
    }
  };
  
  const handleDecrement = () => {
    if (isInCart) {
      dispatch(updateQuantity({ id: productId, quantity: cartItem.quantity - 1 }));
    } else {
      setLocalQty(prev => (prev > 1 ? prev - 1 : 1));
    }
  };

  const renderStars = (rating: number, size = 16, interactive = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity 
          key={i} 
          disabled={!interactive}
          onPress={() => interactive && setReviewRating(i)}
        >
          <MaterialIcons 
            name={i <= rating ? "star" : "star-border"} 
            size={size} 
            color={i <= rating ? "#D4AF72" : "rgba(253,251,247,0.3)"} 
          />
        </TouchableOpacity>
      );
    }
    return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>{stars}</View>;
  };

  const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: { 
      paddingHorizontal: 20, 
      paddingTop: insets.top + 16, 
      paddingBottom: 16, 
      flexDirection: 'row', 
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
      zIndex: 10
    },
    headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginLeft: 16 },
    content: { paddingBottom: 100 },
    imageContainer: {
      width: '100%',
      aspectRatio: 1,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: 40, // extra padding because of overlap
      paddingTop: 20,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    detailsContainer: {
      padding: 24,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: 'rgba(212,175,114,0.4)', // champagne gold
      overflow: 'hidden',
    },
    name: {
      fontSize: 24,
      fontWeight: '700',
      color: '#FDFBF7',
      marginBottom: 8,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    price: {
      fontSize: 22,
      fontWeight: '700',
      color: '#D4AF72',
    },
    originalPrice: {
      fontSize: 16,
      color: 'rgba(253,251,247,0.6)',
      textDecorationLine: 'line-through',
      marginLeft: 12,
    },
    stockBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginBottom: 20,
    },
    stockText: {
      fontSize: 12,
      fontWeight: '600',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FDFBF7',
      marginTop: 10,
      marginBottom: 12,
    },
    infoRow: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    infoLabel: {
      width: 100,
      fontSize: 14,
      color: 'rgba(253,251,247,0.7)',
      fontWeight: '500',
    },
    infoValue: {
      flex: 1,
      fontSize: 14,
      color: '#FDFBF7',
      fontWeight: '500',
    },
    description: {
      fontSize: 15,
      color: '#FDFBF7',
      lineHeight: 22,
      marginTop: 8,
      opacity: 0.9,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      marginTop: -4,
    },
    ratingText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FDFBF7',
      marginLeft: 6,
    },
    ratingSubText: {
      fontSize: 14,
      color: 'rgba(253,251,247,0.7)',
      marginLeft: 4,
    },
    reviewCard: {
      backgroundColor: 'rgba(255,255,255,0.08)',
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: 'rgba(212,175,114,0.25)',
    },
    reviewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    reviewName: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FDFBF7',
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    verifiedText: {
      fontSize: 10,
      color: '#D4AF72',
      marginLeft: 2,
    },
    reviewDate: {
      fontSize: 12,
      color: 'rgba(253,251,247,0.6)',
    },
    reviewText: {
      fontSize: 14,
      color: '#FDFBF7',
      lineHeight: 20,
      marginTop: 8,
    },
    emptyReviews: {
      padding: 20,
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: 12,
      marginTop: 8,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)'
    },
    emptyReviewsText: {
      fontSize: 14,
      color: 'rgba(253,251,247,0.7)',
      marginTop: 8,
    },
    writeReviewBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: 'rgba(212,175,114,0.15)',
      borderWidth: 1,
      borderColor: '#D4AF72',
      borderRadius: 24,
      marginTop: 16,
      alignSelf: 'flex-start',
    },
    writeReviewText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#D4AF72',
      marginLeft: 6,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: insets.bottom > 0 ? insets.bottom + 24 : 24,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    modalSubtitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    textInput: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      color: colors.text,
      fontSize: 15,
      minHeight: 120,
      textAlignVertical: 'top',
      marginBottom: 24,
    },
    submitBtn: {
      backgroundColor: colors.primary,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    submitBtnText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(35, 0, 15, 0.98)', // very dark merlot for contrast
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 24,
      borderTopWidth: 1,
      borderTopColor: 'rgba(212,175,114,0.3)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    qtyContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 24,
      borderWidth: 1,
      borderColor: 'rgba(212,175,114,0.3)',
    },
    qtyBtn: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    qtyText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FDFBF7',
      width: 30,
      textAlign: 'center',
    },
    addBtn: {
      flex: 1,
      height: 48,
      borderRadius: 24,
      marginLeft: 16,
      overflow: 'hidden', // for LinearGradient radius
    },
    addBtnContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addBtnText: {
      color: '#FFF8E7',
      fontSize: 16,
      fontWeight: '700',
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    retryBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 24,
    },
    retryText: {
      color: colors.white,
      fontWeight: '600',
    }
  });

  if (loading) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={[styles.root, styles.center]}>
        <MaterialIcons name="error-outline" size={48} color={colors.muted} style={{ marginBottom: 16 }} />
        <Text style={styles.errorText}>{error || 'Product not found'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => {
          if (error === 'Product not found') navigation.goBack();
          else fetchProduct();
        }}>
          <Text style={styles.retryText}>{error === 'Product not found' ? 'Go Back' : 'Retry'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const hasOffer = product.discountPrice && product.discountPrice < product.price;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Product Details</Text>
      </View>

      <View style={{ flex: 1, backgroundColor: colors.surface }}>
        <View style={[styles.imageContainer, { position: 'absolute', top: 0, left: 0, right: 0 }]}>
          {product.image ? (
            <Image source={{ uri: product.image }} style={styles.image} resizeMode="contain" />
          ) : (
            <MaterialIcons name="local-drink" size={80} color={colors.muted} />
          )}
        </View>

        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }} 
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
        >
          <View style={{ height: width - 30 }} />
          <BlurView 
            intensity={20}
            tint="dark"
            style={[styles.detailsContainer, { minHeight: '100%' }]}
          >
          <LinearGradient
            colors={['rgba(74, 0, 31, 0.88)', 'rgba(114, 47, 55, 0.78)', 'rgba(49, 0, 20, 0.92)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.name}>{product.name}</Text>
          
          {(product.averageRating > 0 || product.reviewCount > 0) && (
            <View style={styles.ratingRow}>
              {renderStars(product.averageRating, 18)}
              <Text style={styles.ratingText}>{product.averageRating?.toFixed(1) || '0.0'}</Text>
              <Text style={styles.ratingSubText}>({product.reviewCount} {product.reviewCount === 1 ? 'Review' : 'Reviews'})</Text>
            </View>
          )}

          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{product.discountPrice || product.price}</Text>
            {hasOffer && <Text style={styles.originalPrice}>₹{product.price}</Text>}
          </View>

          <View style={[styles.stockBadge, { backgroundColor: isOutOfStock ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)' }]}>
            <Text style={[styles.stockText, { color: isOutOfStock ? '#EF4444' : '#22C55E' }]}>
              {isOutOfStock ? 'Out of Stock' : 'In Stock'}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Details</Text>
          {product.brand && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Brand:</Text>
              <Text style={styles.infoValue}>{product.brand}</Text>
            </View>
          )}
          {product.category && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Category:</Text>
              <Text style={styles.infoValue}>{product.category}</Text>
            </View>
          )}
          {product.volume && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Volume:</Text>
              <Text style={styles.infoValue}>{product.volume}</Text>
            </View>
          )}
          {product.description && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={styles.sectionTitle}>Customer Reviews</Text>
              {product.averageRating > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialIcons name="star" size={20} color="#D4AF72" />
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#FDFBF7', marginLeft: 4 }}>
                    {product.averageRating?.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>

            {reviews.length > 0 ? (
              reviews.map((review, index) => (
                <View key={review._id || index} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View>
                      <Text style={styles.reviewName}>{review.customer?.name || 'Customer'}</Text>
                      {review.isVerifiedPurchase && (
                        <View style={styles.verifiedBadge}>
                          <MaterialIcons name="check-circle" size={12} color="#D4AF72" />
                          <Text style={styles.verifiedText}>Verified Purchase</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.reviewDate}>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  {renderStars(review.rating, 14)}
                  <Text style={styles.reviewText}>{review.comment}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyReviews}>
                <MaterialIcons name="rate-review" size={32} color="rgba(253,251,247,0.7)" />
                <Text style={styles.emptyReviewsText}>Be the first to review this product</Text>
              </View>
            )}

            {canReview && (
              <TouchableOpacity 
                style={styles.writeReviewBtn}
                onPress={() => setShowReviewModal(true)}
              >
                <MaterialIcons name="edit" size={18} color="#D4AF72" />
                <Text style={styles.writeReviewText}>Write a Review</Text>
              </TouchableOpacity>
            )}
          </View>
          </BlurView>
        </ScrollView>
      </View>

      <Modal
        visible={showReviewModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Write a Review</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <MaterialIcons name="close" size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Tap to Rate</Text>
            <View style={{ marginBottom: 24, alignSelf: 'flex-start' }}>
              {renderStars(reviewRating, 32, true)}
            </View>

            <Text style={styles.modalSubtitle}>Review</Text>
            <TextInput
              style={styles.textInput}
              placeholder="What did you like or dislike?"
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={4}
              value={reviewText}
              onChangeText={setReviewText}
            />

            <TouchableOpacity 
              style={[styles.submitBtn, submittingReview && { opacity: 0.7 }]}
              onPress={submitReview}
              disabled={submittingReview}
            >
              {submittingReview ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomBar}>
        <View style={styles.qtyContainer}>
          <TouchableOpacity style={styles.qtyBtn} onPress={handleDecrement}>
            <MaterialIcons name="remove" size={20} color="#FDFBF7" />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{currentQty}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={handleIncrement}>
            <MaterialIcons name="add" size={20} color="#FDFBF7" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={styles.addBtn}
          onPress={handleAddToCart}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isInCart ? ['#22C55E', '#16A34A'] : ['#A64D65', '#722F37']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addBtnContent}
          >
            <Text style={styles.addBtnText}>
              {isInCart ? 'Added to Cart' : 'Add to Cart'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProductDetailsScreen;
