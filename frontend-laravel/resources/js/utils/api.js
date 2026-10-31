/**
 * Helper function untuk fetch API dengan auto-inject headers
 * X-User-Id dan X-User-Role dari auth user
 */
export function apiFetch(url, options = {}, auth = null) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };

  // Inject user headers jika auth tersedia
  if (auth?.user) {
    headers['X-User-Id'] = auth.user.id;
    headers['X-User-Role'] = auth.role || auth.user.role_slug || 'user';
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
