// jest.polyfills.js
const { TextEncoder, TextDecoder } = require('util')

// Polyfill for TextEncoder/TextDecoder which are needed for @paralleldrive/cuid2
Object.assign(global, {
  TextEncoder,
  TextDecoder,
})

// Polyfill crypto for Node.js environments that need it
if (!global.crypto) {
  const { randomBytes } = require('crypto')
  global.crypto = {
    getRandomValues: (arr) => {
      const bytes = randomBytes(arr.length)
      for (let i = 0; i < arr.length; i++) {
        arr[i] = bytes[i]
      }
      return arr
    }
  }
}
