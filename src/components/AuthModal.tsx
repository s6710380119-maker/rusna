import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login'
}) => {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setDisplayName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrorMessage('');
    setSuccessInfo('');
    setShowPassword(false);
  };

  const handleModeChange = (newMode: 'login' | 'register' | 'forgot') => {
    setMode(newMode);
    setErrorMessage('');
    setSuccessInfo('');
  };

  const parseFirebaseError = (err: any): string => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/invalid-email':
        return 'รูปแบบที่อยู่อีเมลไม่ถูกต้อง';
      case 'auth/user-disabled':
        return 'บัญชีผู้ใช้นี้ถูกปิดใช้งาน โปรดติดต่อผู้ดูแลระบบ';
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
        return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      case 'auth/wrong-password':
        return 'รหัสผ่านไม่ถูกต้อง';
      case 'auth/email-already-in-use':
        return 'อีเมลนี้ถูกใช้งานแล้ว โปรดเข้าสู่ระบบหรือใช้การกู้คืนรหัสผ่าน';
      case 'auth/weak-password':
        return 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
      case 'auth/popup-closed-by-user':
        return 'การเข้าสู่ระบบด้วย Google ถูกยกเลิก';
      case 'auth/operation-not-allowed':
        return 'ระบบยังไม่ได้เปิดใช้งานวิธีเข้าสู่ระบบนี้ใน Firebase Console (กรุณาดูคู่มือ)';
      default:
        return err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง';
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      await loginWithGoogle();
      showToast('เข้าสู่ระบบด้วยบัญชี Google สำเร็จ', 'success');
      onClose();
      resetForm();
    } catch (err: any) {
      setErrorMessage(parseFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessInfo('');

    if (mode === 'forgot') {
      if (!email.trim()) {
        setErrorMessage('กรุณากรอกที่อยู่อีเมล');
        return;
      }
      setLoading(true);
      try {
        await resetPassword(email.trim());
        setSuccessInfo('ส่งลิงก์ตั้งรหัสผ่านใหม่ไปยังอีเมลเรียบร้อยแล้ว กรุณาตรวจสอบกล่องจดหมายหรือโฟลเดอร์สแปม');
        showToast('ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว', 'success');
      } catch (err: any) {
        setErrorMessage(parseFirebaseError(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'login') {
      if (!email.trim() || !password) {
        setErrorMessage('กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน');
        return;
      }
      setLoading(true);
      try {
        await loginWithEmail(email.trim(), password);
        showToast('ยินดีต้อนรับเข้าสู่ระบบ EduShare Thailand', 'success');
        onClose();
        resetForm();
      } catch (err: any) {
        setErrorMessage(parseFirebaseError(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'register') {
      if (!displayName.trim()) {
        setErrorMessage('กรุณากรอกชื่อ-นามสกุล หรือชื่อที่ต้องการแสดง');
        return;
      }
      if (!email.trim()) {
        setErrorMessage('กรุณากรอกอีเมล');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
        return;
      }

      setLoading(true);
      try {
        const { needVerification } = await registerWithEmail(displayName.trim(), email.trim(), password);
        showToast('สมัครสมาชิกสำเร็จ!', 'success');
        if (needVerification) {
          setSuccessInfo('ระบบได้ส่งอีเมลยืนยันตัวตนไปยัง ' + email.trim() + ' เรียบร้อยแล้ว');
        }
        setTimeout(() => {
          onClose();
          resetForm();
        }, 1500);
      } catch (err: any) {
        setErrorMessage(parseFirebaseError(err));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        
        {/* Header pattern */}
        <div className="bg-gradient-to-r from-blue-700 via-sky-600 to-indigo-700 p-6 text-white relative">
          <button
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {mode === 'forgot' && (
            <button
              onClick={() => handleModeChange('login')}
              className="flex items-center gap-1 text-xs text-white/90 hover:text-white mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>กลับสู่หน้าเข้าสู่ระบบ</span>
            </button>
          )}

          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            {mode === 'login' && 'เข้าสู่ระบบคลังปัญญา'}
            {mode === 'register' && 'สมัครสมาชิก EduShare'}
            {mode === 'forgot' && 'ลืมรหัสผ่าน'}
          </h2>
          <p className="text-xs text-blue-100 mt-1">
            {mode === 'login' && 'เข้าสู่ระบบเพื่อโพสต์ แบ่งปัน และบันทึกสื่อการสอนที่คุณสนใจ'}
            {mode === 'register' && 'สร้างบัญชีฟรีเพื่อร่วมเป็นส่วนหนึ่งของเครือข่ายครูและผู้เรียน'}
            {mode === 'forgot' && 'กรอกอีเมลเพื่อรับลิงก์รีเซ็ตรหัสผ่านผ่าน Firebase Auth'}
          </p>

          {/* Switch Tab between Login and Register */}
          {mode !== 'forgot' && (
            <div className="flex bg-blue-900/40 p-1 rounded-xl mt-4 backdrop-blur-xs">
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  mode === 'login' ? 'bg-white text-blue-800 shadow-xs' : 'text-blue-100 hover:text-white'
                }`}
              >
                เข้าสู่ระบบ
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('register')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  mode === 'register' ? 'bg-white text-blue-800 shadow-xs' : 'text-blue-100 hover:text-white'
                }`}
              >
                สมัครสมาชิกใหม่
              </button>
            </div>
          )}
        </div>

        {/* Content body */}
        <div className="p-6">
          {/* Status notices */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successInfo && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successInfo}</span>
            </div>
          )}

          {/* Google Sign-in Option (for Login & Register) */}
          {mode !== 'forgot' && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 shadow-xs hover:shadow transition transform active:scale-[0.99] disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>เข้าสู่ระบบด้วย Google</span>
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-[11px] uppercase">
                  <span className="bg-white px-3 text-slate-400 font-medium">หรือใช้อีเมลและรหัสผ่าน</span>
                </div>
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อ-นามสกุล หรือชื่อแสดงผล
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="เช่น ครูสมศักดิ์ หรือ นิสิตวิทยาการฯ"
                    required
                    className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition"
                  />
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ที่อยู่อีเมล
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@school.ac.th หรือ gmail.com"
                  required
                  className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    รหัสผ่าน
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => handleModeChange('forgot')}
                      className="text-[11px] font-medium text-blue-600 hover:text-blue-800 transition"
                    >
                      ลืมรหัสผ่าน?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    required
                    className="w-full pl-10 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ยืนยันรหัสผ่านอีกครั้ง
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่านซ้ำอีกครั้ง"
                    required
                    className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white rounded-xl font-medium text-sm shadow-md shadow-blue-500/20 transition transform active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังดำเนินการ...</span>
                </>
              ) : (
                <>
                  {mode === 'login' && 'เข้าสู่ระบบ'}
                  {mode === 'register' && 'สร้างบัญชีและส่งอีเมลยืนยัน'}
                  {mode === 'forgot' && 'ส่งลิงก์ตั้งรหัสผ่านใหม่'}
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-5 text-center text-[11px] text-slate-400">
            {mode === 'login' ? (
              <span>
                ยังไม่มีบัญชีผู้ใช้?{' '}
                <button
                  onClick={() => handleModeChange('register')}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  สมัครสมาชิกใหม่ฟรี
                </button>
              </span>
            ) : mode === 'register' ? (
              <span>
                มีบัญชีอยู่แล้ว?{' '}
                <button
                  onClick={() => handleModeChange('login')}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  เข้าสู่ระบบ
                </button>
              </span>
            ) : null}
          </div>
        </div>

      </div>
    </div>
  );
};
