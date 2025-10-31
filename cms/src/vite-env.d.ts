/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_COGNITO_LOGIN_URL: string
  readonly VITE_COGNITO_LOGOUT_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
