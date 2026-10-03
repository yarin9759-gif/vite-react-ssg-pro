import { fail, type Handler } from '../_lib/http';

// Runs before every /api route: config check, uniform JSON errors, no caching or indexing.
export const onRequest: Handler = async ({ env, next }) => {
  if (!env.DB) return fail(503, 'מערכת ההזמנות עדיין לא הוגדרה בשרת (חסר חיבור למסד הנתונים)');

  let response: Response;
  try {
    response = await next();
  } catch (error) {
    console.error('API error', error);
    return fail(500, 'אירעה שגיאה בשרת. נסו שוב בעוד כמה דקות.');
  }

  response = new Response(response.body, response);
  response.headers.set('X-Robots-Tag', 'noindex');
  response.headers.set('Cache-Control', 'no-store');
  return response;
};
