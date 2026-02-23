/**
 * Merkezi API konfigürasyonu
 * Tüm API çağrıları buradaki URL'yi kullanmalıdır
 */
import { Platform } from 'react-native';

/** 
 * Bilgisayarın lokal ağ IP adresi.
 * Fiziksel cihazda test ederken bu IP'nin doğru olduğundan emin olun.
 * CMD'de `ipconfig` komutuyla bulabilirsiniz.
 */
const LOCAL_IP = "192.168.1.129"; // Bilgisayarınızın IP adresi
const LOCAL_PORT = "8000";

/** Ana backend API adresi */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android'
    ? `http://${LOCAL_IP}:${LOCAL_PORT}`  // Fiziksel Cihaz için. Emulator kullanıyorsanız "10.0.2.2" yapın.
    : `http://${LOCAL_IP}:${LOCAL_PORT}`  // iOS
  );

/** API istekleri için ortak headers */
export const API_HEADERS: HeadersInit = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
};
