// BasicExample.js
// A complete React Native example using @cmscure/react-native-cmscure-sdk.
//
// BEFORE RUNNING:
// 1. Create the content listed in README.md → Quick Start → Step 2
// 2. Replace YOUR_PROJECT_ID, YOUR_API_KEY, YOUR_PROJECT_SECRET below
//
// This example demonstrates:
// - CMSCureProvider for SDK initialization
// - useCureString for reactive translations
// - useCureColor for reactive CMS colors
// - useCureImage for CMS-managed images
// - useCureDataStore for structured data with typed accessors
// - useCureLanguage for RTL-aware language management
// - LanguageDirection & CureLanguageDisplay utilities

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Linking,
  I18nManager,
} from 'react-native';

import {
  Cure,
  CMSCureProvider,
  useCureString,
  useCureColor,
  useCureImage,
  useCureDataStore,
  useCureLanguage,
  CureLanguageDisplay,
  LanguageDirection,
  CureSDKImage,
} from '@cmscure/react-native-cmscure-sdk';

// ---------------------------------------------------------------------------
// 1. Configuration — wrap your app in CMSCureProvider
// ---------------------------------------------------------------------------

const cmsConfig = {
  projectId: 'YOUR_PROJECT_ID',       // ← replace
  apiKey: 'YOUR_API_KEY',             // ← replace
  projectSecret: 'YOUR_PROJECT_SECRET', // ← replace
  enableAutoRealTimeUpdates: true,
};

export default function App() {
  return (
    <CMSCureProvider config={cmsConfig}>
      <ContentScreen />
    </CMSCureProvider>
  );
}

// ---------------------------------------------------------------------------
// 2. Content Screen — uses all CMS hooks
// ---------------------------------------------------------------------------

function ContentScreen() {
  // Translations — auto-update when CMS content changes
  const welcomeTitle = useCureString('welcome_title', 'home_screen', 'Welcome!');
  const welcomeSubtitle = useCureString('welcome_subtitle', 'home_screen', '');
  const ctaButton = useCureString('cta_button', 'home_screen', 'Get Started');

  // Colors
  const primaryColor = useCureColor('primary_color', '#007AFF');
  const accentColor = useCureColor('accent_color', '#FF9500');
  const bgColor = useCureColor('background_color', '#F2F2F7');

  // Global image
  const heroBannerUrl = useCureImage('hero_banner');
  const appLogoUrl = useCureImage('app_logo');

  // Data Store
  const { items: products, isLoading } = useCureDataStore('feature_products');

  // Language
  const lang = useCureLanguage();
  const [languages, setLanguages] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    Cure.availableLanguages().then(setLanguages).catch(() => {});
  }, []);

  const changeLanguage = useCallback(async (code) => {
    await Cure.setLanguage(code);
    setShowPicker(false);
  }, []);

  const direction = lang.isRTL ? 'rtl' : 'ltr';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        style={{ direction }}
      >
        {/* Hero Banner */}
        <CureSDKImage
          url={heroBannerUrl}
          style={styles.heroBanner}
          resizeMode="cover"
        />

        {/* App Logo */}
        <CureSDKImage
          url={appLogoUrl}
          style={styles.appLogo}
          resizeMode="contain"
        />

        {/* Title */}
        <Text style={[styles.title, { color: primaryColor }]}>
          {welcomeTitle}
        </Text>

        {/* Subtitle */}
        {welcomeSubtitle ? (
          <Text style={styles.subtitle}>{welcomeSubtitle}</Text>
        ) : null}

        {/* CTA Button */}
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: accentColor }]}
          onPress={() => {/* your action */}}
        >
          <Text style={styles.ctaText}>{ctaButton}</Text>
        </TouchableOpacity>

        {/* Products Section */}
        <Text style={[styles.sectionTitle, { color: primaryColor }]}>
          Feature Products
        </Text>

        {isLoading ? (
          <ActivityIndicator size="small" style={{ marginTop: 12 }} />
        ) : products.length === 0 ? (
          <Text style={styles.emptyText}>No products available</Text>
        ) : (
          products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              accentColor={accentColor}
            />
          ))
        )}

        {/* Language Picker */}
        <View style={styles.langHeader}>
          <Text style={[styles.sectionTitle, { color: primaryColor, marginBottom: 0 }]}>
            Language
          </Text>
          <View
            style={[
              styles.dirBadge,
              { backgroundColor: lang.isRTL ? '#FFF3E0' : '#E3F2FD' },
            ]}
          >
            <Text
              style={[
                styles.dirBadgeText,
                { color: lang.isRTL ? '#E65100' : '#1565C0' },
              ]}
            >
              {lang.isRTL ? 'RTL' : 'LTR'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.langSelector}
          onPress={() => setShowPicker(!showPicker)}
        >
          <Text style={styles.langFlag}>{lang.flag}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.langName}>{lang.displayName}</Text>
            <Text style={styles.langCode}>{lang.code.toUpperCase()}</Text>
          </View>
          <Text style={styles.chevron}>▼</Text>
        </TouchableOpacity>

        {showPicker &&
          languages.map((code) => (
            <TouchableOpacity
              key={code}
              style={[
                styles.langOption,
                code === lang.code && styles.langOptionActive,
              ]}
              onPress={() => changeLanguage(code)}
            >
              <Text style={styles.langOptionText}>
                {CureLanguageDisplay.flag(code)}{' '}
                {CureLanguageDisplay.displayName(code)}
              </Text>
              {code === lang.code && (
                <Text style={styles.checkMark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// 3. Product Card Component — uses DataStoreItem typed accessors
// ---------------------------------------------------------------------------

function ProductCard({ product, accentColor }) {
  const title = product.string('title') || '—';
  const price = product.double('price');
  const imageUrl = product.string('image_url');
  const ctaUrl = product.ctaURL;

  return (
    <View style={styles.productCard}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.productImage}
          resizeMode="cover"
        />
      ) : null}
      <View style={styles.productInfo}>
        <Text style={styles.productTitle}>{title}</Text>
        {price != null && (
          <Text style={styles.productPrice}>
            ${price.toFixed(2)}
          </Text>
        )}
      </View>
      {ctaUrl && (
        <TouchableOpacity
          style={[styles.productCta, { backgroundColor: accentColor }]}
          onPress={() => Linking.openURL(ctaUrl)}
        >
          <Text style={styles.productCtaText}>View</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// 4. Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 20 },

  heroBanner: { width: '100%', height: 200, borderRadius: 16, marginBottom: 16 },
  appLogo: { width: 60, height: 60, borderRadius: 12, marginBottom: 12 },

  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 16 },

  ctaButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  emptyText: { color: '#999', textAlign: 'center', paddingVertical: 20 },

  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  productImage: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  productInfo: { flex: 1 },
  productTitle: { fontSize: 15, fontWeight: '600' },
  productPrice: { fontSize: 13, color: '#666', marginTop: 2 },
  productCta: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  productCtaText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  langHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 32, marginBottom: 12 },
  dirBadge: { marginLeft: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  dirBadgeText: { fontSize: 11, fontWeight: '700' },

  langSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
  },
  langFlag: { fontSize: 28, marginRight: 12 },
  langName: { fontSize: 16, fontWeight: '500' },
  langCode: { fontSize: 12, color: '#999', marginTop: 2 },
  chevron: { fontSize: 12, color: '#999' },

  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 4,
  },
  langOptionActive: { backgroundColor: '#E8F5E9' },
  langOptionText: { fontSize: 15 },
  checkMark: { color: '#4CAF50', fontWeight: '700', fontSize: 16 },
});
