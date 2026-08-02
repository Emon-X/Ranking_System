export function clearAuthSession() {
  localStorage.removeItem("isAuthenticated");
  localStorage.removeItem("token");
  localStorage.removeItem("userRole");
  localStorage.removeItem("username");
}

export function redirectToLogin() {
  clearAuthSession();
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

export function isTokenExpired(token) {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    if (payload && payload.exp) {
      // payload.exp is in seconds
      return Date.now() >= payload.exp * 1000;
    }
    return false;
  } catch (e) {
    return false;
  }
}

export function checkAuthStatus() {
  const token = localStorage.getItem("token");
  const isAuth = localStorage.getItem("isAuthenticated") === "true";
  if (!isAuth || !token) {
    return false;
  }
  if (isTokenExpired(token)) {
    clearAuthSession();
    return false;
  }
  return true;
}

export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem("token");

  // Pre-check if token is already expired
  if (token && isTokenExpired(token)) {
    redirectToLogin();
    throw new Error("Session expired. Redirecting to login...");
  }

  const headers = new Headers(options.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    redirectToLogin();
    throw new Error("Session expired. Redirecting to login...");
  }

  return response;
}
