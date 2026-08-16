import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { User, AuthResponse } from '../types/auth';
import { authService } from '../services/authService';
import { useHistoryStore } from '../stores/historyStore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<AuthResponse>;
  register: (identifier: string, password: string, type: 'email' | 'mobile') => Promise<AuthResponse>;
  loginWithGoogle: () => Promise<AuthResponse>;
  loginWithApple: () => Promise<AuthResponse>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  resetPasswordRequest: (identifier: string) => Promise<void>;
  resetPasswordConfirm: (data: any) => Promise<void>;
  updateProfile: (data: { name: string; location: string; farmType: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const setCurrentHistoryUser = useHistoryStore((state) => state.setCurrentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const profile = await authService.getProfile();
          setUser(profile);
        } else {
          const profile = await authService.getProfile();
          setUser(profile);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    setCurrentHistoryUser(user?.id ?? null);
  }, [loading, setCurrentHistoryUser, user?.id]);

  const login = async (identifier: string, password: string): Promise<AuthResponse> => {
    const response = await authService.login(identifier, password);
    setUser(response.user);
    return response;
  };

  const register = async (identifier: string, password: string, type: 'email' | 'mobile'): Promise<AuthResponse> => {
    const response = await authService.register(identifier, password, type);
    setUser(response.user);
    return response;
  };

  const loginWithGoogle = async (): Promise<AuthResponse> => {
    const response = await authService.signInWithGoogle();
    setUser(response.user);
    return response;
  };

  const loginWithApple = async (): Promise<AuthResponse> => {
    const response = await authService.signInWithApple();
    setUser(response.user);
    return response;
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    await authService.changePassword(oldPassword, newPassword);
  };

  const resetPasswordRequest = async (identifier: string) => {
    await authService.resetPasswordRequest(identifier);
  };

  const resetPasswordConfirm = async (data: any) => {
    await authService.resetPasswordConfirm(data);
  };

  const updateProfile = async (data: { name: string; location: string; farmType: string }) => {
    const updatedUser = await authService.updateProfile(data);
    setUser(updatedUser);
  };

  const logout = () => {
    authService.logout();
    setCurrentHistoryUser(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      loginWithGoogle,
      loginWithApple,
      changePassword, 
      resetPasswordRequest, 
      resetPasswordConfirm, 
      updateProfile, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an Provider');
  }
  return context;
};
