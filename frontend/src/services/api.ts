const BASE_URL = 'https://senin-ngrok-adresin.ngrok-free.app';

export const getAnalizler = async () => {
  const response = await fetch(`${BASE_URL}/analizler`);
  return await response.json();
};

export const postAnaliz = async (veri: any) => {
  const response = await fetch(`${BASE_URL}/analiz-ekle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(veri),
  });
  return await response.json();
};