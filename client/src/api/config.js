const envUrlRaw = import.meta.env.VITE_API_URL || '';
export const API = envUrlRaw.replace(/^["']|["']$/g, '');

console.log("API URL:", import.meta.env.VITE_API_URL);
