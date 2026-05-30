// eslint-config-expo 7.x ships the legacy (eslintrc) format only, so the lint
// script runs with ESLINT_USE_FLAT_CONFIG=false (see package.json).
module.exports = {
  extends: "expo",
  ignorePatterns: ["node_modules/", "android/", "ios/", ".expo/", "dist/"],
  rules: {
    // The `@/*` path alias is resolved by TypeScript (tsconfig paths); the
    // eslint import resolver isn't alias-aware, so defer resolution to tsc.
    "import/no-unresolved": "off",
  },
};
