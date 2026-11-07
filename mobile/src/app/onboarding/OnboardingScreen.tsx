import React, { useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useAppTheme } from '../../constants/theme';
import { Button } from '../../components/ui';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type OnboardingNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

const SLIDES = [
  {
    id: 1,
    title: 'Your Drinks. Your Doorstep.',
    subtitle: 'Discover premium beverages and get your favorites delivered with ease.',
    icon: 'local-bar',
    glow: true,
  },
  {
    id: 2,
    title: 'Discover Your Favorites',
    subtitle: 'Explore a curated selection of beers and beverages from brands you love.',
    icon: 'explore',
  },
  {
    id: 3,
    title: 'Order in Just a Few Taps',
    subtitle: 'Choose your favorite drinks, add them to your cart, and place your order effortlessly.',
    icon: 'shopping-cart',
  },
  {
    id: 4,
    title: 'Delivered to Your Door',
    subtitle: 'Track your order and stay updated from confirmation to delivery.',
    icon: 'local-shipping',
    trackingInfo: true,
  },
  {
    id: 5,
    title: 'Enjoy Responsibly',
    subtitle: 'This service is only available to customers who meet the legal drinking age requirements in their location.',
    icon: 'verified-user',
  },
];

const OnboardingScreen = () => {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const { colors } = useAppTheme();

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (currentIndex + 1) * width, animated: true });
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      scrollRef.current?.scrollTo({ x: (currentIndex - 1) * width, animated: true });
    }
  };

  const handleContinue = () => {
    navigation.replace('AuthSelection');
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    slide: {
      width,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    visualContainer: {
      flex: 0.6,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    },
    glow: {
      position: 'absolute',
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: colors.primary,
      opacity: 0.2,
      shadowColor: colors.primaryDark,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 50,
      elevation: 20,
    },
    trackingMock: {
      marginTop: 40,
      width: '80%',
    },
    trackStep: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    trackDotActive: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.primary,
      marginRight: 16,
    },
    trackDotCurrent: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.primary,
      marginRight: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    trackDotGlow: {
      position: 'absolute',
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primaryLight,
      opacity: 0.4,
    },
    trackDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.border,
      marginRight: 16,
    },
    trackLineActive: {
      width: 2,
      height: 30,
      backgroundColor: colors.primary,
      marginLeft: 7,
      marginVertical: 4,
    },
    trackLine: {
      width: 2,
      height: 30,
      backgroundColor: colors.border,
      marginLeft: 7,
      marginVertical: 4,
    },
    trackTextActive: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    trackText: {
      color: colors.muted,
      fontSize: 16,
    },
    textContainer: {
      flex: 0.4,
      alignItems: 'center',
      width: '100%',
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 16,
    },
    subtitle: {
      fontSize: 16,
      color: colors.muted,
      textAlign: 'center',
      lineHeight: 24,
    },
    bottomSection: {
      paddingHorizontal: 24,
      paddingBottom: 32,
    },
    pagination: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 4,
    },
    activeDot: {
      backgroundColor: colors.primary,
      width: 24,
    },
    inactiveDot: {
      backgroundColor: colors.border,
    },
    buttonsContainer: {
      width: '100%',
    },
    fullButton: {
      width: '100%',
    },
    splitButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 16,
    },
    halfButton: {
      flex: 1,
    },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}
      >
        {SLIDES.map((slide, index) => (
          <View key={slide.id} style={styles.slide}>
            <View style={styles.visualContainer}>
              {slide.glow && <View style={styles.glow} />}
              <MaterialIcons name={slide.icon as any} size={120} color={colors.text} />

              {slide.trackingInfo && (
                <View style={styles.trackingMock}>
                  <View style={styles.trackStep}>
                    <View style={styles.trackDotActive} />
                    <Text style={styles.trackTextActive}>Order Confirmed</Text>
                  </View>
                  <View style={styles.trackLineActive} />
                  <View style={styles.trackStep}>
                    <View style={styles.trackDotCurrent}>
                      <View style={styles.trackDotGlow} />
                    </View>
                    <Text style={styles.trackTextActive}>Preparing</Text>
                  </View>
                  <View style={styles.trackLine} />
                  <View style={styles.trackStep}>
                    <View style={styles.trackDot} />
                    <Text style={styles.trackText}>Out for Delivery</Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.subtitle}>{slide.subtitle}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomSection}>
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        <View style={styles.buttonsContainer}>
          {currentIndex === 0 ? (
            <Button title="Get Started" onPress={handleNext} style={styles.fullButton} />
          ) : currentIndex === SLIDES.length - 1 ? (
            <View style={styles.splitButtons}>
              <Button title="Back" variant="secondary" onPress={handleBack} style={styles.halfButton} />
              <Button title="Continue" onPress={handleContinue} style={styles.halfButton} />
            </View>
          ) : (
            <View style={styles.splitButtons}>
              <Button title="Back" variant="secondary" onPress={handleBack} style={styles.halfButton} />
              <Button title="Next" onPress={handleNext} style={styles.halfButton} />
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default OnboardingScreen;
