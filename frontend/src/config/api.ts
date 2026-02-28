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
  (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hostname === 'localhost')
    ? `http://localhost:${LOCAL_PORT}`
    : (process.env.EXPO_PUBLIC_API_URL ?? `http://${LOCAL_IP}:${LOCAL_PORT}`);

/** API istekleri için ortak headers */
export const API_HEADERS: HeadersInit = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
};
