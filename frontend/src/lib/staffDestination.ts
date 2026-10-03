import {authReturnPath} from './authReturnPath';
export const staffHome = (role?: string) => role === 'admin' ? '/admin' : role === 'moderator' ? '/moderation' : '/profile';
export function loginDestination(requested: string | null, role?: string) {
  const destination = authReturnPath(requested);
  return destination === '/profile' ? staffHome(role) : destination;
}
