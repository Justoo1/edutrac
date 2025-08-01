import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'
import { ReadableStream } from 'stream/web'

// Polyfill for Node.js globals that Next.js expects
Object.assign(global, {
  TextEncoder,
  TextDecoder,
  ReadableStream,
  Request: class Request {
    constructor(input, init) {
      this.url = input
      this.method = init?.method || 'GET'
      this.headers = new Headers(init?.headers || {})
      this.body = init?.body || null
    }
    
    async json() {
      return JSON.parse(this.body || '{}')
    }
    
    async text() {
      return this.body || ''
    }
  },
  Response: class Response {
    constructor(body, init) {
      this.body = body
      this.status = init?.status || 200
      this.statusText = init?.statusText || 'OK'
      this.headers = new Headers(init?.headers || {})
    }
    
    async json() {
      return JSON.parse(this.body || '{}')
    }
    
    async text() {
      return this.body || ''
    }
  },
  Headers: class Headers {
    constructor(init) {
      this.map = new Map()
      if (init) {
        if (init instanceof Headers) {
          init.forEach((value, key) => this.set(key, value))
        } else if (Array.isArray(init)) {
          init.forEach(([key, value]) => this.set(key, value))
        } else {
          Object.entries(init).forEach(([key, value]) => this.set(key, value))
        }
      }
    }
    
    set(key, value) {
      this.map.set(key.toLowerCase(), String(value))
    }
    
    get(key) {
      return this.map.get(key.toLowerCase()) || null
    }
    
    has(key) {
      return this.map.has(key.toLowerCase())
    }
    
    forEach(callback) {
      this.map.forEach((value, key) => callback(value, key, this))
    }
  },
})

// Mock next/navigation
const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockPrefetch = jest.fn()
const mockBack = jest.fn()
const mockForward = jest.fn()
const mockRefresh = jest.fn()
const mockRedirect = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: mockPrefetch,
    back: mockBack,
    forward: mockForward,
    refresh: mockRefresh,
  })),
  usePathname: jest.fn(() => '/test-path'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  redirect: mockRedirect,
}))

// Mock next-auth
const mockUseSession = jest.fn()
const mockGetSession = jest.fn()
const mockSignIn = jest.fn()
const mockSignOut = jest.fn()

jest.mock('next-auth/react', () => ({
  useSession: mockUseSession,
  getSession: mockGetSession,
  signIn: mockSignIn,
  signOut: mockSignOut,
}))

// Default useSession return value
mockUseSession.mockReturnValue({
  data: {
    user: {
      id: 'test-user-id',
      name: 'Test User',
      username: 'test.user',
      email: 'test@example.com',
      image: 'https://example.com/avatar.jpg',
      role: 'TEACHER',
      schoolId: 'test-school-id',
    },
  },
  status: 'authenticated',
})

// Mock Sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}))

// Suppress console warnings in tests
const originalConsoleWarn = console.warn
beforeAll(() => {
  console.warn = (...args) => {
    if (
      args[0]?.includes?.('Warning: ReactDOM.render is no longer supported') ||
      args[0]?.includes?.('Warning: `ReactDOMTestUtils.act`')
    ) {
      return
    }
    originalConsoleWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.warn = originalConsoleWarn
})

// Export mocks for use in tests
global.mockPush = mockPush
global.mockReplace = mockReplace
global.mockUseSession = mockUseSession
global.mockGetSession = mockGetSession
