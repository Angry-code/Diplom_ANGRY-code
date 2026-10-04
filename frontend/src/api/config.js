
export const API_HOST = 'http://127.0.0.1:8000';
export const API_BASE = `${API_HOST}/api/v1/`;

export const mediaUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_HOST}${path}`;
};