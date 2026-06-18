import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe, login as loginSvc, logout as logoutSvc } from '../services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await getMe();
      setUser(data.data.user);
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password) => {
    const { data } = await loginSvc(email, password);
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    setUser(data.data.user);
    return data.data.user;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    await logoutSvc(refreshToken).catch(() => {});
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const hasRole = (...roles) => user && roles.includes(user.role?.name);
  const hasPermission = (perm) => user?.role?.name === 'super_admin' || user?.permissions?.includes(perm);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, hasPermission, reload: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
