import js from "@eslint/js";
import globals from "globals";
import stylistic from "@stylistic/eslint-plugin";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: ["**/dist/**"]
  }
  , { files: ["**/*.{js,mjs,cjs}"]
    , plugins: { js, "@stylistic": stylistic }
    , extends: ["js/recommended"]
    , rules: {
      "@stylistic/comma-style": ["error", "first"]
      , "comma-dangle": ["error", "never"]
      , "@stylistic/comma-spacing": ["error", { "before": false, "after": true }]
    }
    , languageOptions: { globals: globals.browser }
  }
]);
