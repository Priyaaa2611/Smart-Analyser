import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { Phone, Mail, ArrowRight, ShieldCheck, Loader2, Lock, User as UserIcon, Eye, EyeOff, KeyRound, Sprout, Bug, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Logo } from '../Logo';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type AuthMode = 'login' | 'register' | 'forgot-password' | 'reset-password';

export const Login: React.FC = () => {
  const { t } = useTranslation();
  const { login, register, loginWithGoogle, loginWithApple, resetPasswordRequest, resetPasswordConfirm } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [loginMethod, setLoginMethod] = useState<'mobile' | 'email'>('mobile');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const formatMobile = (digits: string) => {
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
  };

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (loginMethod === 'mobile') {
      let digits = val.replace(/\D/g, '');
      if (digits.startsWith('91') && digits.length > 10) {
        digits = digits.slice(2);
      }
      setIdentifier(digits.slice(0, 10));
    } else {
      setIdentifier(val);
    }
  };

  const getFormattedIdentifier = () => {
    if (loginMethod === 'mobile') {
      return `+91${identifier}`;
    }
    return identifier;
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setError(null);
    setSuccess(null);

    if (mode === 'register' && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6 && (mode === 'login' || mode === 'register' || mode === 'reset-password')) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const formattedId = getFormattedIdentifier();
      if (mode === 'login') {
        await login(formattedId, password);
      } else if (mode === 'register') {
        await register(formattedId, password, loginMethod);
      } else if (mode === 'forgot-password') {
        await resetPasswordRequest(formattedId);
        setMode('reset-password');
        setSuccess("Reset OTP sent to your " + (loginMethod === 'email' ? 'email' : 'mobile'));
      } else if (mode === 'reset-password') {
        await resetPasswordConfirm({ identifier: formattedId, otp, newPassword: password });
        setMode('login');
        setSuccess("Password reset successful. Please login.");
        setPassword('');
        setOtp('');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatSocialAuthError = (err: any): string => {
    const code = err?.code || '';
    const message = err?.message || '';
    if (code.includes('api-key-not-valid') || message.includes('api-key-not-valid')) {
      return 'Invalid Firebase API Key. Please check your Firebase Web API Key in Firebase Console -> Project Settings -> General.';
    }
    if (code === 'auth/operation-not-allowed') {
      return 'Google/Apple Sign-In is disabled in Firebase. Please enable it in Firebase Console -> Authentication -> Sign-in method.';
    }
    if (code === 'auth/unauthorized-domain') {
      return 'Domain not authorized. Add localhost in Firebase Console -> Authentication -> Settings -> Authorized domains.';
    }
    if (code === 'auth/popup-blocked') {
      return 'Sign-in popup was blocked by your browser. Please enable popups and try again.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Sign-in window was closed before finishing.';
    }
    return message || 'Sign-In failed. Please try again.';
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setError(formatSocialAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithApple();
    } catch (err: any) {
      console.error('Apple sign in error:', err);
      setError(formatSocialAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'register' : 'login');
    setError(null);
    setSuccess(null);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="relative min-h-screen bg-stone-950 text-stone-200 font-sans flex items-center justify-center p-4 md:p-8 overflow-hidden">
      {/* Full-bleed Atmospheric Background Image */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1920"
          alt="Farm Background"
          className="w-full h-full object-cover opacity-20 filter saturate-150 brightness-75 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/90 via-stone-950/80 to-stone-950/95 backdrop-blur-[2px]" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[130px] pointer-events-none" />
      </div>

      {/* Horizontal 2-Column Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-4xl bg-stone-900/85 backdrop-blur-2xl border border-stone-800/80 rounded-3xl overflow-hidden shadow-2xl shadow-black/90 grid grid-cols-1 md:grid-cols-12"
      >
        {/* LEFT COLUMN: Brand Logo, App Name, Tagline & Features */}
        <div className="md:col-span-5 bg-gradient-to-br from-emerald-950/50 via-stone-950/90 to-stone-950 p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-stone-800/80 relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            {/* Logo & App Name */}
            <div className="flex items-center space-x-3">
              <Logo size={42} />
              <div>
                <h1 className="font-extrabold text-xl md:text-2xl text-white tracking-tight leading-tight">
                  Smart Agriculture
                </h1>
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.18em]">
                  Farming Intelligence
                </p>
              </div>
            </div>

            {/* Subtitle */}
            <p className="text-stone-300 text-xs md:text-sm leading-relaxed pt-1">
              Empowering farmers with AI-driven crop advice, disease diagnosis, and live market intelligence.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-2.5 pt-3">
              <div className="flex items-center space-x-3 bg-stone-900/60 p-3 rounded-2xl border border-stone-800/60">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                  <Sprout size={16} />
                </div>
                <span className="text-xs font-semibold text-stone-200">AI Crop & Soil Advisory</span>
              </div>

              <div className="flex items-center space-x-3 bg-stone-900/60 p-3 rounded-2xl border border-stone-800/60">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                  <Bug size={16} />
                </div>
                <span className="text-xs font-semibold text-stone-200">Real-Time Disease Scan</span>
              </div>

              <div className="flex items-center space-x-3 bg-stone-900/60 p-3 rounded-2xl border border-stone-800/60">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 shrink-0">
                  <TrendingUp size={16} />
                </div>
                <span className="text-xs font-semibold text-stone-200">Live Mandi Market Rates</span>
              </div>
            </div>
          </div>

          {/* Footer info */}
          <div className="relative z-10 pt-6 text-[10px] text-stone-500 font-medium">
            © Smart Agriculture Platform
          </div>
        </div>

        {/* RIGHT COLUMN: Compact Login/Register Form */}
        <div className="md:col-span-7 p-6 md:p-8 flex flex-col justify-center">
          {/* Auth Mode Toggle (Login vs Register) */}
          {(mode === 'login' || mode === 'register') && (
            <div className="flex bg-stone-950/80 p-1 rounded-2xl mb-4 border border-stone-800">
              <button
                onClick={() => setMode('login')}
                className={cn(
                  "flex-1 py-2 text-xs font-bold rounded-xl transition-all",
                  mode === 'login' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : "text-stone-400 hover:text-stone-200"
                )}
              >
                {t('common.login')}
              </button>
              <button
                onClick={() => setMode('register')}
                className={cn(
                  "flex-1 py-2 text-xs font-bold rounded-xl transition-all",
                  mode === 'register' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : "text-stone-400 hover:text-stone-200"
                )}
              >
                {t('common.register')}
              </button>
            </div>
          )}

          {/* Side-by-Side Social Buttons */}
          {(mode === 'login' || mode === 'register') && (
            <div className="space-y-2 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="bg-stone-950 hover:bg-stone-900 border border-stone-800 hover:border-emerald-500/40 text-stone-200 py-2.5 px-3 rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-[0.98] shadow-md"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span className="text-xs font-bold truncate">Google</span>
                </button>

                <button
                  type="button"
                  onClick={handleAppleSignIn}
                  disabled={loading}
                  className="bg-stone-950 hover:bg-stone-900 border border-stone-800 hover:border-emerald-500/40 text-stone-200 py-2.5 px-3 rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-[0.98] shadow-md"
                >
                  <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.16-1.9-14.49-6.07-3.23-2.63-7.14-7.29-11.73-13.98-6.7-9.75-11.96-20.78-15.78-33.09-3.82-12.31-5.73-24.08-5.73-35.31 0-14.73 3.63-27.13 10.89-37.19 7.26-10.06 16.5-15.19 27.72-15.39 4.47 0 9.47 1.15 15 3.45 5.53 2.3 9.47 3.45 11.82 3.45 2.12 0 6.13-1.22 12.03-3.66 5.9-2.44 10.89-3.56 14.97-3.36 10.96.6 20.08 4.67 27.35 12.21-9.75 5.89-14.53 14.15-14.34 24.78.25 9.75 4.13 17.81 11.64 24.18 4.34 3.73 9.29 6.27 14.86 7.63-2.5 7.42-5.77 15.11-9.82 23.08zM119.22 31.84c0-6.85 2.5-13.41 7.5-19.68 5-6.27 11.36-10.36 19.08-12.27.5 7.15-1.78 13.88-6.84 20.19-5.06 6.31-11.45 10.29-19.17 11.93-.12-.06-.37-.11-.57-.17z" />
                  </svg>
                  <span className="text-xs font-bold truncate">Apple ID</span>
                </button>
              </div>

              <div className="relative flex items-center justify-center pt-2 pb-1">
                <div className="border-t border-stone-800 w-full" />
                <span className="bg-stone-900 px-3 text-[10px] font-bold text-stone-500 uppercase tracking-widest absolute rounded-full">
                  or continue with
                </span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Login Method Toggle */}
            {(mode === 'login' || mode === 'register' || mode === 'forgot-password') && (
              <div className="flex justify-center space-x-3 mb-1">
                <button
                  type="button"
                  onClick={() => setLoginMethod('mobile')}
                  className={cn(
                    "text-xs font-semibold px-4 py-1.5 rounded-full border transition-all",
                    loginMethod === 'mobile' 
                      ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 font-bold" 
                      : "border-stone-800 text-stone-400 hover:border-stone-700"
                  )}
                >
                  Mobile
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('email')}
                  className={cn(
                    "text-xs font-semibold px-4 py-1.5 rounded-full border transition-all",
                    loginMethod === 'email' 
                      ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 font-bold" 
                      : "border-stone-800 text-stone-400 hover:border-stone-700"
                  )}
                >
                  Email
                </button>
              </div>
            )}

            {/* Identifier Input */}
            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 ml-1">
                {loginMethod === 'mobile' ? t('auth.mobileNumber') : t('auth.emailAddress')}
              </label>
              <div className="relative">
                <div className={cn(
                  "absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 flex items-center",
                  loginMethod === 'mobile' && "space-x-2"
                )}>
                  {loginMethod === 'email' ? <Mail size={15} /> : (
                    <>
                      <Phone size={15} />
                      <span className="text-stone-300 font-bold border-r border-stone-800 pr-2 text-xs">+91</span>
                    </>
                  )}
                </div>
                <input 
                  type={loginMethod === 'mobile' ? "tel" : "email"}
                  value={loginMethod === 'mobile' ? formatMobile(identifier) : identifier}
                  onChange={handleIdentifierChange}
                  placeholder={loginMethod === 'mobile' ? "xxxxx xxxxx" : "user@email.com"}
                  className={cn(
                    "w-full bg-stone-950/80 border border-stone-800 rounded-xl py-2.5 pr-4 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all text-xs font-medium",
                    loginMethod === 'mobile' ? "pl-24" : "pl-10"
                  )}
                  required
                  disabled={mode === 'reset-password'}
                />
              </div>
            </div>

            {/* Password Input */}
            {(mode === 'login' || mode === 'register' || mode === 'reset-password') && (
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 ml-1">
                  {mode === 'reset-password' ? t('auth.newPassword') : t('auth.password')}
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
                    <Lock size={15} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-stone-950/80 border border-stone-800 rounded-xl py-2.5 pl-10 pr-10 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all text-xs font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password (Register only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 ml-1">
                  {t('auth.confirmPassword')}
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
                    <Lock size={15} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-stone-950/80 border border-stone-800 rounded-xl py-2.5 pl-10 pr-4 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all text-xs font-medium"
                    required
                  />
                </div>
              </div>
            )}

            {/* OTP Input (Reset Password only) */}
            {mode === 'reset-password' && (
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 ml-1">
                  {t('auth.resetOtp')}
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
                    <ShieldCheck size={15} />
                  </div>
                  <input 
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full bg-stone-950/80 border border-stone-800 rounded-xl py-2.5 pl-10 pr-4 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all text-xs font-mono tracking-widest"
                    required
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="text-red-400 text-xs bg-red-500/10 p-2.5 rounded-xl border border-red-500/20 leading-relaxed font-medium">
                {error}
              </p>
            )}

            {success && (
              <p className="text-emerald-400 text-xs bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 leading-relaxed font-medium">
                {success}
              </p>
            )}

            <button 
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/30"
            >
              {loading ? <Loader2 className="animate-spin text-white" size={18} /> : (
                <>
                  <span className="text-xs md:text-sm font-bold">
                    {mode === 'login' ? t('common.login') : 
                     mode === 'register' ? t('common.register') : 
                     mode === 'forgot-password' ? t('auth.sendResetOtp') : 
                     t('auth.resetPassword')}
                  </span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {mode === 'login' && (
              <div className="text-center pt-1">
                <button 
                  type="button"
                  onClick={() => setMode('forgot-password')}
                  className="text-stone-400 text-xs hover:text-emerald-400 transition-colors font-medium"
                >
                  {t('auth.forgotPassword')}
                </button>
              </div>
            )}

            {(mode === 'forgot-password' || mode === 'reset-password') && (
              <div className="text-center pt-1">
                <button 
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-stone-400 text-xs hover:text-emerald-400 transition-colors font-medium"
                >
                  {t('auth.backToLogin')}
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
