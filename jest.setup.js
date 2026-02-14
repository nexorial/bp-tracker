import '@testing-library/jest-dom'

// Add Next.js Request/Response globals for API route testing
class MockRequest {
  constructor(url, init) {
    this.url = typeof url === 'string' ? url : url.url;
    this.method = init?.method || 'GET';
    this.headers = new Headers(init?.headers);
    this._body = init?.body || null;
  }

  async json() {
    return this._body ? JSON.parse(this._body) : null;
  }

  async text() {
    return this._body || '';
  }
}

class MockResponse {
  constructor(body, init) {
    this.body = body;
    this.status = init?.status || 200;
    this.statusText = init?.statusText || '';
    this.headers = new Headers(init?.headers);
    this._json = body;
  }

  async json() {
    return this._json;
  }

  async text() {
    return typeof this._json === 'string' ? this._json : JSON.stringify(this._json);
  }

  static json(body, init) {
    return new MockResponse(body, init);
  }
}

global.Request = MockRequest;
global.Response = MockResponse;

// ResizeObserver mock for Recharts compatibility
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};
