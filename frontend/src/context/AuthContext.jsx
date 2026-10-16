import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { clearToken, getToken, setToken } from '../api/client';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!getToken());
  const [dark, setDark] = useState(() => localStorage.getItem('finbuddy_dark') === '1');

  useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem('finbuddy_dark', dark ? '1' : '0'); }, [dark]);

  const logout = useCallback(() => { clearToken(); setUser(null); }, []);

  useEffect(() => {
    window.addEventListener('finbuddy:logout', logout);
    return () => window.removeEventListener('finbuddy:logout', logout);
  }, [logout]);

  useEffect(() => {
    if (!getToken()) return;
    api.get('/auth/me').then((r) => { setUser(r.data.user); if (r.data.user.preferences?.darkMode !== undefined) setDark(!!r.data.user.preferences.darkMode); })
      .catch(() => clearToken()).finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password, remember = true) => {
    const { data } = await api.post('/auth/login', { email, password });
    setToken(data.token, remember);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    setToken(data.token, true);
    setUser(data.user);
    return data.user;
  }, []);

  const updateProfile = useCallback(async (patch) => {
    const { data } = await api.put('/auth/me', patch);
    setUser(data.user);
    return data.user;
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout, updateProfile, dark, setDark }), [user, loading, login, register, logout, updateProfile, dark]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
