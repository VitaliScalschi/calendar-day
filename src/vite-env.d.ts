/// <reference types="vite/client" />

/**
 * Declarații de tipuri pentru modulele JSON
 */
declare module '*.json' {
  const value: any;
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
