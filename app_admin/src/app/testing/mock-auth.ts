// Unsigned, test-only JWT builder. The browser never verifies signatures; Express does.
function b64url(value: object): string {
  return btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function mockJwt(payload: Record<string, unknown>): string {
  return b64url({ alg: 'HS256', typ: 'JWT' }) + '.' + b64url(payload) + '.mock-signature';
}
export const MOCK_USER = { email: 'admin@example.test', name: 'Test Admin' };
export const validMockToken = () =>
  mockJwt({ _id: 'mock-user-id', ...MOCK_USER, exp: Math.floor(Date.now() / 1000) + 3600 });
export const expiredMockToken = () =>
  mockJwt({ _id: 'mock-user-id', ...MOCK_USER, exp: Math.floor(Date.now() / 1000) - 60 });
