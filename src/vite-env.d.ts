/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLIENT: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_EDITOR_EMAIL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
