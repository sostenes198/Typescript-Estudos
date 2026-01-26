const tseslint = require("typescript-eslint");
const pluginJs = require("@eslint/js");
const pluginImport = require("eslint-plugin-import");
const prettierConfig = require("eslint-config-prettier/flat");
const { FlatCompat } = require("@eslint/eslintrc");
const path = require("path");

// --- Configuração de Compatibilidade
const compat = new FlatCompat({
    baseDirectory: __dirname,
    resolvePluginsRelativeTo: __dirname, // Ajustado para resolver no projeto atual
    recommendedConfig: pluginJs.configs.recommended,
    allConfig: pluginJs.configs.all,
});

// --- Definição de Regras ---
const tsRules = {
    "@typescript-eslint/no-empty-object-type": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-useless-constructor": "off",
    "@typescript-eslint/no-empty-function": [
        "error",
        {
            allow: ["arrowFunctions", "functions", "methods"],
        },
    ],
    "@typescript-eslint/no-unused-vars": [
        "error",
        {
            argsIgnorePattern: "^_",
            ignoreRestSiblings: true,
            caughtErrorsIgnorePattern: "e",
        },
    ],
};

const commonRules = {
    "no-useless-constructor": "off",
    "no-empty-function": "off",
    "no-plusplus": "off",
    "no-console": "off",
    "no-param-reassign": [
        "error",
        {
            props: false,
        },
    ],
    "import/extensions": ["off"],
    "class-methods-use-this": "off",
    "import/prefer-default-export": "off",
    "no-shadow": "off",
    "func-names": "off",
    "object-curly-newline": "off",
    "implicit-arrow-linebreak": "off",
    "import/no-dynamic-require": "off",
    "global-require": "off",
    "no-underscore-dangle": "off",
    quotes: [
        2,
        "single",
        {
            avoidEscape: true,
            allowTemplateLiterals: true,
        },
    ],
    "prettier/prettier": [
        "error",
        {},
        {
            usePrettierrc: true,
        },
    ],
    "default-param-last": ["off"],
};

// --- Helpers do Typescript ---
const recommendedTypeScriptConfigs = [
    ...tseslint.configs.recommended.map((config) => ({
        ...config,
        files: ['**/*.ts'],
    })),
];

// --- Exportação Final Unificada ---
module.exports = tseslint.config(
    // 1. Ignores Globais
    {
        ignores: ["dist/*", "**/jest.config.js", "**/eslint.config.js"],
    },

    // 2. Ambientes e Extends (via Compat)
    ...compat.env({
        es2022: true,
        node: true,
        jest: true,
    }),
    ...compat.extends("plugin:prettier/recommended"),

    // 3. Configurações Base
    prettierConfig,
    ...recommendedTypeScriptConfigs,

    // 4. Regras para Typescript
    {
        files: ['**/*.ts'],
        rules: { ...tsRules, ...commonRules },
        plugins: {
            import: pluginImport,
        },
    },

    // 5. Regras para Javascript
    {
        files: ['**/*.js'],
        rules: {
            ...commonRules,
        },
        plugins: {
            import: pluginImport,
        },
    },

    // 6. SUAS REGRAS LOCAIS (Sobrescrevem as anteriores)
    {
        files: ['**/*.{js,ts,jsx,tsx}'],
        rules: {
            'max-len': [
                'error',
                {
                    code: 200,
                    ignoreComments: true,
                    ignoreTrailingComments: true,
                    ignoreUrls: true,
                    ignoreStrings: true,
                    ignoreTemplateLiterals: true,
                    ignoreRegExpLiterals: true,
                },
            ],
        },
    }
);