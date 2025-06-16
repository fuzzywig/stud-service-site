module.exports = {
  root: true, // Stop looking for parent configs
  env: {
    es6: true,
    node: true,
    commonjs: true,
    es2017: true,
    es2018: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "script",
  },
  extends: [
    "eslint:recommended",
  ],
  rules: {
    "no-undef": "off", // Turn off undefined variable checking
    "no-console": "off",
    "quotes": ["error", "double", {"allowTemplateLiterals": true}],
    "no-restricted-globals": "off",
  },
  globals: {
    // Explicitly define all Node.js globals
    require: "readonly",
    module: "readonly",
    exports: "writable",
    process: "readonly",
    global: "readonly",
    __dirname: "readonly",
    __filename: "readonly",
    console: "readonly",
    Buffer: "readonly",
    setImmediate: "readonly",
    clearImmediate: "readonly",
    setTimeout: "readonly",
    clearTimeout: "readonly",
    setInterval: "readonly",
    clearInterval: "readonly",
  },
};