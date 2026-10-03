import { fail, type Handler } from '../../_lib/http';
import { isAdmin } from '../../_lib/auth';

// Every /api/admin route requires a valid session, except logging in and checking the session.
const PUBLIC_PATHS = new Set(['/api/admin/login', '/api/admin/session']);

export const onRequest: Handler = async ({ request, env, next }) => {
  if (PUBLIC_PATHS.has(new URL(request.url).pathname)) return next();
  if (!(await isAdmin(request, env))) return fail(401, 'נדרשת התחברות מחדש');
  return next();
};
