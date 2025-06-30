// Utility for making authenticated admin API calls with dev bypass support

export async function adminFetch(url: string, options: RequestInit = {}) {
  // Check if dev bypass is enabled
  const devBypass = typeof window !== 'undefined' && 
    localStorage.getItem('admin_dev_bypass') === 'true';

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(devBypass ? { 'x-admin-dev-bypass': 'true' } : {})
  };

  return fetch(url, {
    ...options,
    headers
  });
}

export async function adminGet(url: string) {
  return adminFetch(url, { method: 'GET' });
}

export async function adminPost(url: string, data: any) {
  return adminFetch(url, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function adminPatch(url: string, data: any) {
  return adminFetch(url, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

export async function adminDelete(url: string, data?: any) {
  return adminFetch(url, {
    method: 'DELETE',
    ...(data ? { body: JSON.stringify(data) } : {})
  });
}