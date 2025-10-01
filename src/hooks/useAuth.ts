import { useState, useEffect } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

interface AuthError {
  code: string;
  message: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Handle redirect result
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log('Google ile giriş başarılı');
        }
      })
      .catch((error) => {
        console.error('Redirect hatası:', error);
        setError(getErrorMessage(error.code));
      });

    return unsubscribe;
  }, []);

  // E-posta ve şifre ile giriş
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const authError = err as AuthError;
      setError(getErrorMessage(authError.code));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // E-posta ve şifre ile kayıt
  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      setError(null);
      setLoading(true);
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName });
    } catch (err) {
      const authError = err as AuthError;
      setError(getErrorMessage(authError.code));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Google ile giriş
  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Mobil cihaz kontrolü
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Mobil cihazlarda özel ayarlar
        googleProvider.setCustomParameters({
          prompt: 'select_account',
          login_hint: ''
        });
      }
      
      await signInWithRedirect(auth, googleProvider);
    } catch (err) {
      const authError = err as AuthError;
      setError(getErrorMessage(authError.code));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Çıkış yap
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Çıkış yapılırken hata:', err);
    }
  };

  // Hata mesajlarını Türkçeleştir
  const getErrorMessage = (code: string): string => {
    switch (code) {
      case 'auth/user-not-found':
        return 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.';
      case 'auth/wrong-password':
        return 'Yanlış şifre girdiniz.';
      case 'auth/email-already-in-use':
        return 'Bu e-posta adresi zaten kullanımda.';
      case 'auth/weak-password':
        return 'Şifre çok zayıf. En az 6 karakter olmalıdır.';
      case 'auth/invalid-email':
        return 'Geçersiz e-posta adresi.';
      case 'auth/popup-closed-by-user':
        return 'Giriş penceresi kapatıldı.';
      case 'auth/cancelled-popup-request':
        return 'Giriş işlemi iptal edildi.';
      default:
        return 'Bir hata oluştu. Lütfen tekrar deneyin.';
    }
  };

  return {
    user,
    loading,
    error,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    logout,
    setError
  };
}