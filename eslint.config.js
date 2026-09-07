// @ts-check
const eslint = require("@eslint/js");
const { defineConfig } = require("eslint/config");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = defineConfig([
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility,
    ],
    rules: {
      // pButton (PrimeNG) renderiza o texto do botão via [label] em runtime, não como filho no
      // template - <button pButton [label]="..."></button> é o padrão usado em ~190 lugares no
      // projeto. Sem isto, "corrigir" a regra significaria colar texto literal dentro de cada
      // <button>, duplicando visualmente o texto que o PrimeNG já injeta via [label].
      "@angular-eslint/template/elements-content": ["error", { allowList: ["label"] }],
    },
  }
]);
