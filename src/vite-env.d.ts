/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SIA_ADMIN_LOGIN_URL?: string;
  /** Implicită `SAISE.Token`; pentru frontend dacă cookie-ul nu e HttpOnly. */
  readonly VITE_SIA_SESSION_COOKIE_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Declarații de tipuri pentru modulele JSON
 */
declare module '*.json' {
  const value: unknown;
  export default value;
}

/**
 * Declarații de tipuri pentru modulele CSS
 */
declare module '*.css' {
  const classes: { [key: string]: string };
  export default classes;
}

/**
 * Declarații de tipuri pentru SVG
 */
declare module '*.svg' {
  const content: string;
  export default content;
}
