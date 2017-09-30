module.exports = {
  "env": {
    "browser": true,
    "es6": true,
    "commonjs": true
  },
  "globals": {
    "chrome": true
  },
  "extends": "eslint:recommended",
  "parser": "babel-eslint",
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true,
      "experimentalObjectRestSpread": true,
    },
    "sourceType": "module"
  },
  "rules": {
    "no-console": "off",
    "prefer-const": "error",
    "indent": [
      "error",
      2
    ],
    "linebreak-style": [
      "error",
      "unix"
    ],
    "quotes": [
      "error",
      "single"
    ],
    "semi": [
      "error",
      "always"
    ]
  }
};