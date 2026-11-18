// RIFF · config.js
// Datos públicos para conectarse a la base de datos (Supabase).
// La "publishable key" es pública por diseño: lo que protege los datos son las
// reglas de seguridad (RLS) de supabase/esquema.sql. NUNCA pongas aquí la
// "secret key" ni la contraseña de la base de datos.
export const SUPABASE_URL = "https://oqphkkwdbsoqbbehyeag.supabase.co";
export const SUPABASE_KEY = "sb_publishable_SaIDvD4AKl2Oq36EKbi0xA_31xiuqis";

// Spotify (vincular la cuenta de verdad). El Client ID es público; se crea en developer.spotify.com.
// Si está vacío, la app usa la vinculación simulada.
export const SPOTIFY_CLIENT_ID = "44c914909892446990d0f13363e4ce20";
