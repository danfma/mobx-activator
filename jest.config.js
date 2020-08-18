const path = require('path');

module.exports = {
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      astTransformers: [
        path.resolve(__dirname, 'lib/transformers/ts-jest-transformer.js')
      ]
    }
  }
};
