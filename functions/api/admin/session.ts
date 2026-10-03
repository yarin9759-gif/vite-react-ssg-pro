import { json, type Handler } from '../../_lib/http';
import { authConfigError, clearSessionCookie, isAdmin } from '../../_lib/auth';

// GET /api/admin/session - is the current visitor logged in?
export const onRequestGet: Handler = async ({ request, env }) =>
  json({ authenticated: await isAdmin(request, env), configError: authConfigError(env) });

// DELETE /api/admin/session - log out
export const onRequestDelete: Handler = async () =>
  json({ authenticated: false }, 200, { 'Set-Cookie': clearSessionCookie() });
