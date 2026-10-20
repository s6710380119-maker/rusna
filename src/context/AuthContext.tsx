import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  User, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  sendEmailVerification, 
  signOut, 
  updateProfile,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  increment 
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isMember: boolean;
  isSuspended: boolean;
  loading: boolean;
  favorites: string[]; // List of resource IDs favorited by current user
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (displayName: string, email: string, pass: string) => Promise<{ needVerification: boolean }>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  logout: () => Promise<void>;
  toggleFavorite: (resourceId: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const BOOTSTRAP_ADMIN_EMAIL = 's6710380119@pkru.ac.th';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync or create user profile in Firestore
  const syncUserProfile = useCallback(async (firebaseUser: User) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    try {
      const snap = await getDoc(userDocRef);
      const isBootstrapAdmin = firebaseUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

      if (!snap.exists()) {
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'ผู้ใช้งาน',
          photoURL: firebaseUser.photoURL || '',
          role: isBootstrapAdmin ? 'admin' : 'member',
          status: 'active',
          bio: '',
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, newProfile);
        setProfile(newProfile);
      } else {
        const data = snap.data() as UserProfile;
        // If this is the designated admin email and not marked admin yet, grant admin
        if (isBootstrapAdmin && data.role !== 'admin') {
          await updateDoc(userDocRef, { role: 'admin' });
          data.role = 'admin';
        }
        setProfile(data);
      }
    } catch (err) {
      console.error('Failed to sync user profile:', err);
      // Fallback in-memory profile
      setProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'ผู้ใช้งาน',
        photoURL: firebaseUser.photoURL || '',
        role: firebaseUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() ? 'admin' : 'member',
        status: 'active',
        createdAt: new Date().toISOString()
      });
    }
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncUserProfile(currentUser);
      } else {
        setProfile(null);
        setFavorites([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [syncUserProfile]);

  // Real-time listener for user profile updates (e.g. role changed by admin, or suspended)
  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      },
      (error) => {
        console.warn('Profile sync snapshot error:', error);
      }
    );
    return () => unsubscribe();
  }, [user]);

  // Real-time listener for current user's favorites
  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }

    const favQuery = query(
      collection(db, 'favorites'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      favQuery,
      (snapshot) => {
        const favIds = snapshot.docs.map(doc => doc.data().resourceId as string);
        setFavorites(favIds);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'favorites');
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Google Login
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await syncUserProfile(result.user);
      }
    } catch (err: unknown) {
      console.error('Google Sign-In Error:', err);
      throw err;
    }
  };

  // Email & Password Login
  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      if (cred.user) {
        await syncUserProfile(cred.user);
      }
    } catch (err: unknown) {
      console.error('Email Login Error:', err);
      throw err;
    }
  };

  // Register with Email & Password
  const registerWithEmail = async (displayName: string, email: string, pass: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const newUser = cred.user;

      // Update display name
      await updateProfile(newUser, { displayName });

      // Send actual verification email
      let needVerification = false;
      try {
        await sendEmailVerification(newUser);
        needVerification = true;
      } catch (e) {
        console.warn('Could not send verification email immediately:', e);
      }

      // Create profile document
      const isBootstrapAdmin = email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
      const profileData: UserProfile = {
        uid: newUser.uid,
        email: email,
        displayName: displayName,
        photoURL: '',
        role: isBootstrapAdmin ? 'admin' : 'member',
        status: 'active',
        bio: '',
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', newUser.uid), profileData);
      setProfile(profileData);

      return { needVerification };
    } catch (err: unknown) {
      console.error('Registration Error:', err);
      throw err;
    }
  };

  // Send Password Reset
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: unknown) {
      console.error('Password Reset Error:', err);
      throw err;
    }
  };

  // Resend Email Verification
  const resendVerificationEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
    setFavorites([]);
  };

  // Toggle Favorite
  const toggleFavorite = async (resourceId: string): Promise<boolean> => {
    if (!user) {
      throw new Error('กรุณาเข้าสู่ระบบก่อนบันทึกรายการโปรด');
    }

    const favDocId = `${user.uid}_${resourceId}`;
    const favRef = doc(db, 'favorites', favDocId);
    const resourceRef = doc(db, 'resources', resourceId);
    const isCurrentlyFavorited = favorites.includes(resourceId);

    try {
      if (isCurrentlyFavorited) {
        await deleteDoc(favRef);
        // Decrement resource count if exists
        try {
          await updateDoc(resourceRef, { favoriteCount: increment(-1) });
        } catch {
          // ignore count error
        }
        return false;
      } else {
        await setDoc(favRef, {
          userId: user.uid,
          resourceId: resourceId,
          createdAt: new Date().toISOString()
        });
        try {
          await updateDoc(resourceRef, { favoriteCount: increment(1) });
        } catch {
          // ignore count error
        }
        return true;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `favorites/${favDocId}`);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await syncUserProfile(user);
    }
  };

  const isAdmin = user?.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() || profile?.role === 'admin';
  const isMember = Boolean(user && profile?.role === 'member');
  const isSuspended = profile?.status === 'suspended';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        isMember,
        isSuspended,
        loading,
        favorites,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        resendVerificationEmail,
        logout,
        toggleFavorite,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
