// Call the Django backend directly. The previous '/api' value relied on a
// Vercel rewrite proxy, which failed with ROUTER_EXTERNAL_TARGET_CONNECTION_ERROR
// (Vercel's edge could not reach PythonAnywhere). CORS is enabled on the backend.
// export const API_BASE_URL = 'https://huzaifanasirfab.pythonanywhere.com/api';
export const API_BASE_URL = 'http://127.0.0.1:8000/api';
// export const API_BASE_URL = '/api';