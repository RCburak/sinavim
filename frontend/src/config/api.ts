/**
 * Merkezi API konfigürasyonu
 * Tüm API çağrıları buradaki URL'yi kullanmalıdır
 */
/** Ana backend API adresi (Ngrok veya sunucu URL) */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  "https://sam-unsublimed-unoptimistically.ngrok-free.dev";

/** API istekleri için ortak headers */
export const API_HEADERS: HeadersInit = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
};
