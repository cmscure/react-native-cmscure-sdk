// AdvancedExample.js
// Advanced patterns: standalone Cure API (no hooks), manual sync,
// event listeners, and imperative data store access.
//
// Use this when you need more control than the hook-based approach.

import React, { useEffect, useState, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  NativeEventEmitter,
  NativeModules,
} from 'react-native';

import {
  Cure,
  CMSCureProvider,
  LanguageDirection,
  CureLanguageDisplay,
  CMSCureConstants,
} from '@cmscure/react-native-cmscure-sdk';

// ---------------------------------------------------------------------------
// App wrapper
// ---------------------------------------------------------------------------

const cmsConfig = {
  projectId: 'YOUR_PROJECT_ID',
  apiKey: 'YOUR_API_KEY',
  projectSecret: 'YOUR_PROJECT_SECRET',
};

export default function App() {
  return (
    <CMSCureProvider config={cmsConfig}>
      <AdvancedScreen />
    </CMSCureProvider>
  );
}

// ---------------------------------------------------------------------------
// Advanced Screen — imperative API usage
// ---------------------------------------------------------------------------

function AdvancedScreen() {
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('#007AFF');
  const [imageUrl, setImageUrl] = useState(null);
  const [products, setProducts] = useState([]);
  const [events, setEvents] = useState([]);
  const [tabInput, setTabInput] = useState('home_screen');
  const [keyInput, setKeyInput] = useState('welcome_title');

  // 1. Imperative translation lookup
  const lookupTranslation = async () => {
    try {
      const value = await Cure.translation(keyInput, tabInput);
      Alert.alert('Translation', `${keyInput} → "${value}"`);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  // 2. Manual sync
  const manualSync = async () => {
    try {
      await Cure.sync(tabInput);
      Alert.alert('Synced', `Tab "${tabInput}" synced successfully`);
    } catch (e) {
      Alert.alert('Sync Error', e.message);
    }
  };

  // 3. Imperative data store access with typed accessors
  const fetchProducts = async () => {
    try {
      const items = await Cure.getStoreItems('feature_products');
      setProducts(items);

      // Demo typed accessors
      if (items.length > 0) {
        const first = items[0];
        console.log('Title:', first.string('title'));
        console.log('Price:', first.double('price'));
        console.log('Active:', first.bool('is_active'));
        console.log('CTA:', first.ctaURL);
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  // 4. Color lookup
  const fetchColor = async () => {
    const c = await Cure.colorValue('primary_color');
    if (c) setColor(c);
  };

  // 5. Image lookup
  const fetchImage = async () => {
    const url = await Cure.imageURL('hero_banner');
    setImageUrl(url);
  };

  // 6. Listen for real-time update events
  useEffect(() => {
    const emitter = new NativeEventEmitter(NativeModules.CMSCureSDK);
    const sub = emitter.addListener('CMSCureContentUpdate', (event) => {
      setEvents((prev) => [
        { id: Date.now(), type: event.type, identifier: event.identifier },
        ...prev.slice(0, 19), // keep last 20
      ]);
    });
    return () => sub?.remove();
  }, []);

  // 7. Language utilities (pure JS — no native call)
  const arabicDir = LanguageDirection.direction('ar'); // → 'RTL'
  const arabicFlag = CureLanguageDisplay.flag('ar');   // → '🇸🇦'
  const arabicName = CureLanguageDisplay.displayName('ar'); // → 'Arabic'

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Advanced API Demo</Text>

        {/* Translation lookup */}
        <View style={styles.card}>
          <Text style={styles.label}>Translation Lookup</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={keyInput}
              onChangeText={setKeyInput}
              placeholder="Key"
            />
            <TextInput
              style={[styles.input, { flex: 1, marginLeft: 8 }]}
              value={tabInput}
              onChangeText={setTabInput}
              placeholder="Tab"
            />
          </View>
          <View style={styles.row}>
            <TouchableOpacity style={styles.btn} onPress={lookupTranslation}>
              <Text style={styles.btnText}>Lookup</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, { marginLeft: 8, backgroundColor: '#34C759' }]} onPress={manualSync}>
              <Text style={styles.btnText}>Sync Tab</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Color / Image */}
        <View style={styles.card}>
          <Text style={styles.label}>Color & Image</Text>
          <View style={styles.row}>
            <TouchableOpacity style={styles.btn} onPress={fetchColor}>
              <Text style={styles.btnText}>Get Color</Text>
            </TouchableOpacity>
            <View style={[styles.colorBox, { backgroundColor: color }]} />
            <TouchableOpacity style={[styles.btn, { marginLeft: 8 }]} onPress={fetchImage}>
              <Text style={styles.btnText}>Get Image</Text>
            </TouchableOpacity>
          </View>
          {imageUrl && <Text style={styles.urlText} numberOfLines={1}>{imageUrl}</Text>}
        </View>

        {/* Data Store */}
        <View style={styles.card}>
          <Text style={styles.label}>Data Store (feature_products)</Text>
          <TouchableOpacity style={styles.btn} onPress={fetchProducts}>
            <Text style={styles.btnText}>Fetch Products</Text>
          </TouchableOpacity>
          {products.map((p) => (
            <Text key={p.id} style={styles.itemText}>
              • {p.string('title') || '—'} — ${p.double('price')?.toFixed(2) ?? 'N/A'}
              {p.ctaURL ? ` [CTA]` : ''}
            </Text>
          ))}
        </View>

        {/* Language utilities */}
        <View style={styles.card}>
          <Text style={styles.label}>Language Utilities (pure JS)</Text>
          <Text style={styles.itemText}>
            Arabic → {arabicFlag} {arabicName} ({arabicDir})
          </Text>
          <Text style={styles.itemText}>
            English → {CureLanguageDisplay.flag('en')}{' '}
            {CureLanguageDisplay.displayName('en')} ({LanguageDirection.direction('en')})
          </Text>
        </View>

        {/* Event log */}
        <View style={styles.card}>
          <Text style={styles.label}>Real-time Events</Text>
          {events.length === 0 ? (
            <Text style={styles.emptyText}>Waiting for CMS updates…</Text>
          ) : (
            events.map((e) => (
              <Text key={e.id} style={styles.eventText}>
                [{e.type}] {e.identifier}
              </Text>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  scroll: { padding: 20 },
  heading: { fontSize: 24, fontWeight: '700', marginBottom: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  label: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  btn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  colorBox: { width: 32, height: 32, borderRadius: 6, marginLeft: 10 },
  urlText: { fontSize: 11, color: '#999', marginTop: 6 },
  itemText: { fontSize: 14, color: '#333', marginTop: 4 },
  emptyText: { color: '#999', fontSize: 13 },
  eventText: { fontSize: 12, color: '#555', fontFamily: 'Courier', marginTop: 2 },
});
