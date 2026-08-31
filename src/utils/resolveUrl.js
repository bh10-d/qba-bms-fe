/**
 * Resolves static asset URLs, backend API URLs, and base64 Data URLs.
 * - Absolute URLs (http://, https://, data:, blob:) are returned as-is.
 * - Backend URLs starting with /uploads, /api, or /static are directed to NestJS backend (http://localhost:3000)
 * - Frontend public assets (e.g., /logonen.png, /icon-square.png) are returned as-is to be served by Vite frontend.
 */
export const resolveUrl = (url) => {
  if (!url) return null;

  if (
    url.startsWith('data:') ||
    url.startsWith('blob:') ||
    url.startsWith('http://') ||
    url.startsWith('https://')
  ) {
    return url;
  }

  // If path starts with backend endpoints /uploads, /api, or /static -> point to NestJS backend
  if (url.startsWith('/uploads') || url.startsWith('/api') || url.startsWith('/static')) {
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
    return `${serverUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  // Otherwise, it's a local frontend public static asset (e.g. /logonen.png, /icon-square.png)
  return url;
};

export default resolveUrl;
