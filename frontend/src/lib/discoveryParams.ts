export type DiscoveryView = 'reviews' | 'businesses';
export function discoveryView(params: URLSearchParams): DiscoveryView {
  const requested = params.get('view');
  if (requested === 'reviews' || requested === 'businesses') return requested;
  return params.get('q')?.trim() ? 'businesses' : 'reviews';
}
export function discoveryPage(params: URLSearchParams) {
  const value = Number(params.get('page'));
  return Number.isSafeInteger(value) && value > 0 ? value : 1;
}
export function switchDiscoveryView(params: URLSearchParams, view: DiscoveryView) {
  const next = new URLSearchParams(params);
  next.set('view', view);
  next.delete('page');
  return next;
}
export function updateReviewFilter(params: URLSearchParams, name: 'q' | 'category' | 'location' | 'sort', value: string) {
  const next = switchDiscoveryView(params, 'reviews');
  const normalized = value.trim();
  if (!normalized || name === 'category' && ['All', 'All Categories'].includes(normalized) || name === 'location' && normalized === 'All Bangladesh') next.delete(name);
  else next.set(name, normalized);
  return next;
}
