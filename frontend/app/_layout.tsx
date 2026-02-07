import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// Açılış ekranının (Splash Screen) otomatik kapanmasını engelliyoruz
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Uygulama yüklendiğinde açılış ekranını kapatıyoruz
    SplashScreen.hideAsync();
  }, []);

  return (
    // Tüm uygulamayı GestureHandler ile sarmalıyoruz (Kaydırma hareketleri için şart)
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade', // Sayfa geçiş animasyonu
        }}
      >
        {/* Sayfaları burada tanımlayabilir veya otomatik yapılandırmaya bırakabilirsiniz */}
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="dashboard" />
      </Stack>
    </GestureHandlerRootView>
  );
}