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
const LOCAL_IP = "192.168.1.116";
const LOCAL_PORT = "8000";

/** Ana backend API adresi */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android'
    ? `http://${LOCAL_IP}:${LOCAL_PORT}`  // Android fiziksel cihaz veya emülatör
    : `http://${LOCAL_IP}:${LOCAL_PORT}`  // iOS fiziksel cihaz
  );

/** API istekleri için ortak headers */
export const API_HEADERS: HeadersInit = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
};
