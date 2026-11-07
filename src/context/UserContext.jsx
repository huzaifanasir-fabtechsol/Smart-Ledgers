import { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, SCREEN_LOCK_KEY } from '../api';

const UserContext = createContext({
  user: null,
  companyName: '',
  setUser: () => {},
  refreshUser: () => {},
  locked: false,
  setLocked: () => {},
  hasLockPin: false,
  setHasLockPin: () => {},
  lockScreen: () => {},
  unlockScreen: () => {},
  sidebarOpen: true,
  setSidebarOpen: () => {},
  toggleSidebar: () => {},
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

  const [locked, setLocked] = useState(() => localStorage.getItem(SCREEN_LOCK_KEY) === '1');
  const [hasLockPin, setHasLockPin] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const lockScreen = () => {
    localStorage.setItem(SCREEN_LOCK_KEY, '1');
    setLocked(true);
  };

  const unlockScreen = () => {
    localStorage.removeItem(SCREEN_LOCK_KEY);
    setLocked(false);
  };

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

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
        if (data.has_lock_pin !== undefined) {
          setHasLockPin(Boolean(data.has_lock_pin));
        }
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
      if (newUser.has_lock_pin !== undefined) {
        setHasLockPin(Boolean(newUser.has_lock_pin));
      }
    }
    if (onUserUpdate) onUserUpdate(newUser);
  };

  const companyName = (user?.company_name || '').trim();

  return (
    <UserContext.Provider
      value={{
        user,
        companyName,
        setUser,
        refreshUser,
        locked,
        setLocked,
        hasLockPin,
        setHasLockPin,
        lockScreen,
        unlockScreen,
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

export default UserContext;
