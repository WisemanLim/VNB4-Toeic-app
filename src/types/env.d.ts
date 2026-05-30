// Expo inlines `process.env.EXPO_PUBLIC_*` at build time. Minimal typing so
// we can read them without pulling in @types/node (which adds Node globals
// that don't exist in React Native).
declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
    EXPO_PUBLIC_USE_MOCK?: string;
    [key: string]: string | undefined;
  };
};

// Metro provides require() at runtime; used to load the bundled seed JSON
// without tsc inferring its (huge) literal type.
declare function require(path: string): unknown;
