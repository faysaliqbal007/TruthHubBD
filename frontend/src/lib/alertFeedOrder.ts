export function selectAlertFeedOrder(currentStatus: string, order: string): {status: string; sort: 'newest' | 'oldest'} {
  if (order === 'trending') return {status: 'Trending', sort: 'newest'};
  return {
    status: currentStatus === 'Trending' ? 'All cases' : currentStatus,
    sort: order === 'oldest' ? 'oldest' : 'newest',
  };
}
