import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authApi from '../api/authApi';

const AuthContext = createContext(null);

const ROLE_LEVEL_MAP = {
  SUPERADMIN: 100,
  ADMIN: 80,
  MANAGER: 60,
  STAFF: 40,
  USER: 20,
};

// Helper function to resolve role code (supports object or string)
export const getRoleCode = (userObj) => {
  if (!userObj || !userObj.role) return 'USER';
  if (typeof userObj.role === 'object') {
    return (userObj.role.code || userObj.role.name || 'USER').toUpperCase();
  }
  return String(userObj.role).toUpperCase();
};

// Helper function to resolve role level (supports object level or default level mapping)
export const getRoleLevel = (userObj) => {
  if (!userObj || !userObj.role) return 20;
  if (typeof userObj.role === 'object' && userObj.role.level !== undefined) {
    return Number(userObj.role.level);
  }
  const code = getRoleCode(userObj);
  return ROLE_LEVEL_MAP[code] || 20;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch Profile on App Mount if token exists
  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await authApi.getProfile();
      const profileData = res?.data || res;
      setUser(profileData);
      localStorage.setItem('user', JSON.stringify(profileData));
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      setError(err.message || 'Session expired. Please log in again.');
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await authApi.login({ email, password });
      const dataPayload = res?.data || res;
      
      const token = dataPayload.accessToken || dataPayload.token;
      const userData = dataPayload.user || dataPayload;

      if (token) {
        localStorage.setItem('accessToken', token);
        setAccessToken(token);
      }

      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      }

      if (token && (!userData?.role || typeof userData?.role !== 'object')) {
        await fetchProfile();
      }

      return res;
    } catch (err) {
      const msg = err.message || 'Login failed. Please check your credentials.';
      setError(msg);
      throw err;
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const res = await authApi.register(userData);
      return res;
    } catch (err) {
      const msg = err.message || 'Registration failed.';
      setError(msg);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout API error (proceeding with local cleanup):', err);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      setUser(null);
      setAccessToken(null);
      setError(null);
    }
  };

  // Helper method to check role level dynamically (e.g. minLevel = 60 for Manager, 80 for Admin)
  const hasLevel = useCallback((minRequiredLevel = 20) => {
    if (!user) return false;
    const currentCode = getRoleCode(user);
    if (currentCode === 'SUPERADMIN') return true; // SUPERADMIN overrides all level checks
    const currentLevel = getRoleLevel(user);
    return currentLevel >= minRequiredLevel;
  }, [user]);

  // Helper method to check role permissions (supports Level number or role code list)
  const hasRole = useCallback((allowedRolesOrMinLevel = []) => {
    if (!user) return false;
    const currentCode = getRoleCode(user);
    if (currentCode === 'SUPERADMIN') return true;

    if (typeof allowedRolesOrMinLevel === 'number') {
      return hasLevel(allowedRolesOrMinLevel);
    }

    if (Array.isArray(allowedRolesOrMinLevel)) {
      // 1. Direct role code string match (for exact system role matches)
      if (allowedRolesOrMinLevel.some((r) => typeof r === 'string' && r.toUpperCase() === currentCode)) {
        return true;
      }

      // 2. Minimum required level match across all specified role strings / numbers
      const levels = allowedRolesOrMinLevel.map((r) => {
        if (typeof r === 'number') return r;
        return ROLE_LEVEL_MAP[r.toUpperCase()] || 999;
      });

      const minRequired = Math.min(...levels);
      return hasLevel(minRequired);
    }

    return false;
  }, [user, hasLevel]);

  const currentRoleCode = getRoleCode(user);
  const currentRoleLevel = getRoleLevel(user);

  const value = {
    user,
    accessToken,
    loading,
    error,
    login,
    register,
    logout,
    fetchProfile,
    hasRole,
    hasLevel,
    currentRoleCode,
    currentRoleLevel,
    isAuthenticated: !!accessToken && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
