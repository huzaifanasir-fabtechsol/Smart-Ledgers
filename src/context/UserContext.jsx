import { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../api';

const UserContext = createContext({
  user: null,
  companyName: '',
  setUser: () => {},
  refreshUser: () => {},
});

export const UserProvider = ({ children, initialUser, onUserUpdate }) => {
  const [user, setUserState] = useState(() => {
    if (initialUser) return initialUser;
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await apiRequest('/account/profile/');
      if (res.ok) {
        const data = await res.json();
        setUserState((prev) => {
          const updated = { ...(prev || {}), ...data };
          localStorage.setItem('user', JSON.stringify(updated));
          return updated;
        });
        if (onUserUpdate) onUserUpdate(data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (initialUser) {
      setUserState(initialUser);
    }
  }, [initialUser]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      refreshUser();
    }
  }, []);

  const setUser = (newUser) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
    }
    if (onUserUpdate) onUserUpdate(newUser);
  };

  const companyName = (user?.company_name || '').trim();

  return (
    <UserContext.Provider value={{ user, companyName, setUser, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

export default UserContext;
