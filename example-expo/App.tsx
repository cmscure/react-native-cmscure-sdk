import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  CMSCureProvider,
  Cure,
  CureSDKImage,
  useCureColor,
  useCureDataStore,
  useCureImage,
  useCureLanguage,
  useCureString,
} from '@cmscure/react-native-cmscure-sdk';

// Put your project values in .env (see .env.example). Use an app key
// (cmsc_ck_...) from Project settings, API keys as EXPO_PUBLIC_CMSCURE_API_KEY.
const config = {
  projectId: process.env.EXPO_PUBLIC_CMSCURE_PROJECT_ID ?? 'YOUR_PROJECT_ID',
  apiKey: process.env.EXPO_PUBLIC_CMSCURE_API_KEY ?? 'YOUR_API_KEY',
  projectSecret: process.env.EXPO_PUBLIC_CMSCURE_PROJECT_SECRET ?? 'YOUR_PROJECT_SECRET',
};

function Home() {
  const title = useCureString('welcome_title', 'home_screen', 'Welcome!');
  const subtitle = useCureString('welcome_subtitle', 'home_screen', 'Manage content, your way.');
  const cta = useCureString('cta_button', 'home_screen', 'Get Started');
  const primary = useCureColor('primary_color', '#007AFF');
  const background = useCureColor('background_color', '#F2F2F7');
  const logo = useCureImage('app_logo');
  const { items, isLoading } = useCureDataStore('feature_products');
  const language = useCureLanguage();

  return (
    <ScrollView style={{ backgroundColor: background }} contentContainerStyle={styles.container}>
      <CureSDKImage url={logo} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <Pressable
        style={[styles.button, { backgroundColor: primary }]}
        onPress={() => Cure.setLanguage(language.code === 'en' ? 'fr' : 'en')}
      >
        <Text style={styles.buttonText}>{cta}</Text>
      </Pressable>
      <Text style={styles.meta}>Language: {language.displayName}</Text>
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.item}>
            <Text style={styles.itemTitle}>{item.string('title')}</Text>
            <Text>{item.double('price')}</Text>
          </View>
        ))
      )}
      <StatusBar style="auto" />
    </ScrollView>
  );
}

export default function App() {
  // CI smoke test: this line only prints if the native module loaded and a
  // promise method answered over the New Architecture interop layer. Release
  // builds drop console.log on iOS, so CI reads it at error level there.
  useEffect(() => {
    const report = __DEV__ ? console.log : console.error;
    Cure.getLanguage()
      .then((code) => report(`CMSCURE_SMOKE_OK lang=${code}`))
      .catch((error) => report(`CMSCURE_SMOKE_FAIL ${error}`));
  }, []);

  return (
    <CMSCureProvider config={config}>
      <Home />
    </CMSCureProvider>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 72, alignItems: 'center', gap: 12 },
  logo: { width: 96, height: 96 },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#555', textAlign: 'center' },
  button: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  buttonText: { color: '#fff', fontWeight: '600' },
  meta: { color: '#777' },
  item: { alignSelf: 'stretch', padding: 12, borderRadius: 8, backgroundColor: '#fff' },
  itemTitle: { fontWeight: '600' },
});
