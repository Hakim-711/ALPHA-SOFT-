export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  browserTokenAuthEnabled: import.meta.env.VITE_ENABLE_BROWSER_TOKEN_AUTH === 'true',
  apiKey: import.meta.env.VITE_ENABLE_BROWSER_TOKEN_AUTH === 'true' ? (import.meta.env.VITE_FRAPPE_API_KEY ?? '') : '',
  apiSecret: import.meta.env.VITE_ENABLE_BROWSER_TOKEN_AUTH === 'true' ? (import.meta.env.VITE_FRAPPE_API_SECRET ?? '') : '',
}
