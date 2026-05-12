/// <reference types="vite/client" />

declare module 'vite/client' {
  interface ImportMetaEnv {
    readonly VITE_GOOGLE_MAPS_API_KEY: string;
  }
}
