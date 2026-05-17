const AUTH_KEYS = {
  accessToken: "accessToken",
  refreshToken: "refreshToken",
  currentUser: "currentUser",
};

const getStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return window.sessionStorage;
};

export const getAuthItem = (key) => {
  const storage = getStorage();
  return storage ? storage.getItem(key) : null;
};

export const setAuthItem = (key, value) => {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  storage.setItem(key, value);
};

export const removeAuthItem = (key) => {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  storage.removeItem(key);
};

export const clearAuthStorage = () => {
  removeAuthItem(AUTH_KEYS.currentUser);
  removeAuthItem(AUTH_KEYS.accessToken);
  removeAuthItem(AUTH_KEYS.refreshToken);
};

export { AUTH_KEYS };
