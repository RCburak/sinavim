const BASE_URL = 'https://sam-unsublimed-unoptimistically.ngrok-free.dev';

export const generateProgram = async (goal: string, hours: number) => {
  const response = await fetch(`${BASE_URL}/generate-program`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true' 
    },
    body: JSON.stringify({ goal, hours }),
  });
  return await response.json();
};