import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  updatePassword, 
  EmailAuthProvider, 
  reauthenticateWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User, AuthResponse } from '../types/auth';

const API_URL = '/api/auth';
const APP_STORAGE_KEY = 'agri_app_data';

// Helper to format non-email identifiers (e.g. mobile numbers) for Firebase Auth
const toFirebaseEmail = (identifier: string): string => {
  if (identifier.includes('@')) {
    return identifier;
  }
  const clean = identifier.replace(/[^0-9]/g, '');
  return `user_${clean}@smartagri.app`;
};

export const authService = {
  async sendOtp(identifier: string): Promise<{ message: string; expiresAt: number }> {
    try {
      const response = await fetch(`${API_URL}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      if (response.ok) {
        return response.json();
      }
    } catch {
      // Fallback response for OTP simulation
    }
    return {
      message: 'OTP sent successfully (Simulated)',
      expiresAt: Date.now() + 5 * 60 * 1000,
    };
  },

  async login(identifier: string, password: string): Promise<AuthResponse> {
    const email = toFirebaseEmail(identifier);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const token = await firebaseUser.getIdToken();

      let profileData: User | null = null;
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          profileData = userDocSnap.data() as User;
        }
      } catch (e) {
        console.warn('Could not fetch Firestore user profile:', e);
      }

      const user: User = profileData || {
        id: firebaseUser.uid,
        identifier: identifier,
        type: identifier.includes('@') ? 'email' : 'mobile',
        role: 'farmer',
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem('agri_auth_token', token);
      localStorage.setItem('agri_user_profile', JSON.stringify(user));

      return {
        user,
        token,
        isNewUser: false,
      };
    } catch (firebaseError: any) {
      console.warn('Firebase login failed or fallback to server API:', firebaseError?.message);

      // Fallback to local server API if Firebase Auth fails or credentials mismatch
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Login failed' }));
        throw new Error(error.error || firebaseError?.message || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('agri_auth_token', data.token);
      localStorage.setItem('agri_user_profile', JSON.stringify(data.user));
      return data.status === 'ok' ? data : { ...data, status: 'ok' };
    }
  },

  async signInWithGoogle(): Promise<AuthResponse> {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const firebaseUser = userCredential.user;
    const token = await firebaseUser.getIdToken();

    let profileData: User | null = null;
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        profileData = userDocSnap.data() as User;
        // Merge photoURL and name if updated
        if (firebaseUser.photoURL && !profileData.photoURL) {
          profileData.photoURL = firebaseUser.photoURL;
        }
        if (firebaseUser.displayName && (!profileData.name || profileData.name === 'Farmer')) {
          profileData.name = firebaseUser.displayName;
        }
      } else {
        const newUserProfile: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Farmer',
          identifier: firebaseUser.email || firebaseUser.uid,
          photoURL: firebaseUser.photoURL || undefined,
          type: 'email',
          role: 'farmer',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, newUserProfile);
        profileData = newUserProfile;
      }
    } catch (e) {
      console.warn('Could not sync Firestore user profile:', e);
    }

    const user: User = profileData || {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'Farmer',
      identifier: firebaseUser.email || firebaseUser.uid,
      photoURL: firebaseUser.photoURL || undefined,
      type: 'email',
      role: 'farmer',
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem('agri_auth_token', token);
    localStorage.setItem('agri_user_profile', JSON.stringify(user));

    return {
      user,
      token,
      isNewUser: false,
    };
  },

  async signInWithApple(): Promise<AuthResponse> {
    const provider = new OAuthProvider('apple.com');
    const userCredential = await signInWithPopup(auth, provider);
    const firebaseUser = userCredential.user;
    const token = await firebaseUser.getIdToken();

    let profileData: User | null = null;
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        profileData = userDocSnap.data() as User;
      } else {
        const newUserProfile: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Farmer',
          identifier: firebaseUser.email || firebaseUser.uid,
          photoURL: firebaseUser.photoURL || undefined,
          type: 'email',
          role: 'farmer',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, newUserProfile);
        profileData = newUserProfile;
      }
    } catch (e) {
      console.warn('Could not sync Firestore user profile:', e);
    }

    const user: User = profileData || {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'Farmer',
      identifier: firebaseUser.email || firebaseUser.uid,
      photoURL: firebaseUser.photoURL || undefined,
      type: 'email',
      role: 'farmer',
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem('agri_auth_token', token);
    localStorage.setItem('agri_user_profile', JSON.stringify(user));

    return {
      user,
      token,
      isNewUser: false,
    };
  },

  async register(identifier: string, password: string, type: 'email' | 'mobile'): Promise<AuthResponse> {
    const email = toFirebaseEmail(identifier);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const token = await firebaseUser.getIdToken();

      const newUser: User = {
        id: firebaseUser.uid,
        identifier,
        type,
        role: 'farmer',
        createdAt: new Date().toISOString(),
      };

      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        await setDoc(userDocRef, newUser);
      } catch (e) {
        console.warn('Could not save user document to Firestore:', e);
      }

      localStorage.setItem('agri_auth_token', token);
      localStorage.setItem('agri_user_profile', JSON.stringify(newUser));

      return {
        user: newUser,
        token,
        isNewUser: true,
      };
    } catch (firebaseError: any) {
      console.warn('Firebase registration error or fallback:', firebaseError?.message);

      // Fallback to server API if needed
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, type }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Registration failed' }));
        throw new Error(error.error || firebaseError?.message || 'Registration failed');
      }

      const data = await response.json();
      localStorage.setItem('agri_auth_token', data.token);
      localStorage.setItem('agri_user_profile', JSON.stringify(data.user));
      return data.status === 'ok' ? data : { ...data, status: 'ok' };
    }
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<{ message: string }> {
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.email) {
      try {
        const credential = EmailAuthProvider.credential(currentUser.email, oldPassword);
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, newPassword);
        return { message: 'Password updated successfully' };
      } catch (error: any) {
        throw new Error(error?.message || 'Failed to change password');
      }
    }

    // Fallback to server API
    const token = localStorage.getItem('agri_auth_token');
    if (!token) throw new Error('No token found');

    const response = await fetch(`${API_URL}/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to change password');
    }

    return response.json();
  },

  async resetPasswordRequest(identifier: string): Promise<{ message: string; expiresAt: number }> {
    const email = toFirebaseEmail(identifier);
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        message: 'Password reset link sent to your email',
        expiresAt: Date.now() + 15 * 60 * 1000,
      };
    } catch (e: any) {
      console.warn('Firebase reset password email failed or fallback:', e?.message);
    }

    // Fallback to server API
    const response = await fetch(`${API_URL}/reset-password-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to request password reset');
    }

    return response.json();
  },

  async resetPasswordConfirm(data: any): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/reset-password-confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reset password');
    }

    return response.json();
  },

  async getProfile(): Promise<User | null> {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const profile = userDocSnap.data() as User;
          localStorage.setItem('agri_user_profile', JSON.stringify(profile));
          return profile;
        }
      } catch (e) {
        console.warn('Could not fetch profile from Firestore:', e);
      }
    }

    const savedProfile = localStorage.getItem('agri_user_profile');
    if (savedProfile) {
      try {
        return JSON.parse(savedProfile);
      } catch {}
    }

    const token = localStorage.getItem('agri_auth_token');
    if (!token) return null;

    try {
      const response = await fetch(`${API_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        localStorage.removeItem('agri_auth_token');
        return null;
      }

      const data = await response.json();
      if (data.status === 'ok') {
        const { status, ...user } = data;
        return user as User;
      }
      return data;
    } catch {
      return null;
    }
  },

  async updateProfile(data: { name: string; location: string; farmType: string }): Promise<User> {
    const currentUser = auth.currentUser;
    let baseProfile = await this.getProfile();

    const updatedUser: User = {
      ...(baseProfile || {
        id: currentUser?.uid || 'user-1',
        identifier: currentUser?.email || 'user',
        type: 'email',
        createdAt: new Date().toISOString(),
      }),
      name: data.name,
      location: data.location,
      farmType: data.farmType,
    };

    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, updatedUser, { merge: true });
      } catch (e) {
        console.warn('Firestore update profile failed:', e);
      }
    }

    localStorage.setItem('agri_user_profile', JSON.stringify(updatedUser));

    // Try server update as well
    const token = localStorage.getItem('agri_auth_token');
    if (token) {
      try {
        await fetch(`${API_URL}/update-profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });
      } catch {}
    }

    return updatedUser;
  },

  logout() {
    try {
      signOut(auth);
    } catch {}
    localStorage.removeItem('agri_auth_token');
    localStorage.removeItem('agri_user_profile');
    localStorage.removeItem(APP_STORAGE_KEY);
  },

  getToken() {
    return localStorage.getItem('agri_auth_token');
  }
};
