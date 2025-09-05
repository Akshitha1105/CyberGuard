export {}
declare global {
  interface ImportMetaEnv {
    readonly VITE_HF_API_KEY?: string
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

