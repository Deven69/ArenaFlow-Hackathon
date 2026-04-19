const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const;

required.forEach(key => {
  if (!import.meta.env[key]) throw new Error(`Missing required env var: ${key}`);
});

export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL as string,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  },
  maps: { apiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY as string },
  app: { version: '1.0.0', region: 'asia-south1', defaultVenue: 'wankhede-mumbai' }
} as const;
