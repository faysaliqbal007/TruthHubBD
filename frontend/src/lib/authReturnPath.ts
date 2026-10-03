/** Preserve known user journeys without creating an external/open redirect. */
export function authReturnPath(requested: string | null): string {
 if (!requested || !requested.startsWith('/') || requested.startsWith('//') || /[\\\u0000-\u0020]/.test(requested) || requested.split(/[?#]/)[0].split('/').some(part => part === '.' || part === '..')) return '/profile';
 try {
  const url = new URL(requested, 'https://truthhub.invalid');
  if (url.origin !== 'https://truthhub.invalid') return '/profile';
  const allowed = /^\/(?:report|claim|notifications|search|ads)$/.test(url.pathname)
   || /^\/admin(?:\/(?:organizations|ads|tools|audit))?$/.test(url.pathname)
   || /^\/moderation(?:\/reports)?$/.test(url.pathname)
   || url.pathname === '/security'
   || url.pathname === '/profile' && url.searchParams.get('personal') === '1'
   || /^\/reviews\/\d+$/.test(url.pathname)
   || /^\/business\/[a-z0-9-]+$/.test(url.pathname)
   || /^\/scam-alerts(?:\/[a-zA-Z0-9-]+)?$/.test(url.pathname);
  return allowed ? url.pathname + url.search + url.hash : '/profile';
 } catch { return '/profile'; }
}
