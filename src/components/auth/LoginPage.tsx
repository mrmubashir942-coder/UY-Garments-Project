import React, { useState, useEffect } from 'react';
import { auth, OWNER_EMAIL, PasswordResetRecord } from '../../services/auth';
import { db } from '../../services/db';
import { UYGarmentsLogo } from '../../assets/logo';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Mail,
  KeyRound,
  RotateCcw,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

type AuthMode = 'login' | 'forgot-request' | 'forgot-verify' | 'forgot-success';

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');

  // Login form state
  const [identifier, setIdentifier] = useState('uygarment942');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot Password state
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetRecord, setResetRecord] = useState<PasswordResetRecord | null>(null);
  const [resendCountdown, setResendCountdown] = useState<number>(0);

  const customLogoUrl = db.getSettings().customLogoUrl;

  // Countdown timer for resending verification code
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Handle standard login submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage('Please enter your owner username or email.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      const res = await auth.login(identifier, password);

      if (res.success) {
        onLoginSuccess();
      } else {
        setErrorMessage(
          res.error || 'Authentication failed. Please verify your credentials.'
        );
      }
    } catch {
      setErrorMessage('An unexpected authentication error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Request password reset / send email code
  const handleRequestResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!resetIdentifier.trim()) {
      setErrorMessage('Please enter your registered owner email or username.');
      return;
    }

    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const res = await auth.requestPasswordReset(resetIdentifier);

      if (res.success && res.record) {
        setResetRecord(res.record);
        setResendCountdown(60);
        setMode('forgot-verify');
      } else {
        setErrorMessage(
          res.error || 'Unable to send reset code. Please verify your email or username.'
        );
      }
    } catch {
      setErrorMessage('Failed to trigger reset email sequence. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend code handler
  const handleResendCode = async () => {
    if (resendCountdown > 0 || isLoading) return;
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await auth.requestPasswordReset(resetIdentifier || OWNER_EMAIL);
      if (res.success && res.record) {
        setResetRecord(res.record);
        setResendCountdown(60);
      } else {
        setErrorMessage(res.error || 'Could not resend verification code.');
      }
    } catch {
      setErrorMessage('Could not resend verification email.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify code & commit new password
  const handleVerifyAndResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCode = resetCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setErrorMessage('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both entries.');
      return;
    }

    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const res = await auth.resetPasswordWithCode(cleanCode, newPassword);

      if (res.success) {
        setMode('forgot-success');
      } else {
        setErrorMessage(res.error || 'Password reset failed. Please check the code.');
      }
    } catch {
      setErrorMessage('Failed to complete password reset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-between text-neutral-900 selection:bg-neutral-900 selection:text-white">
      {/* Top minimal header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-neutral-900">
        <div className="flex items-center gap-3">
          <UYGarmentsLogo size="sm" showText={true} customUrl={customLogoUrl} />
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-neutral-300" />
          <span>Single-Owner Secure Workspace</span>
        </div>
      </header>

      {/* Main Center Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-10">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-800 grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">
          {/* Left Brand Area (Dark Charcoal / Pitch Black) */}
          <section className="lg:col-span-5 bg-neutral-950 text-white p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-neutral-800 relative">
            <div>
              {/* Prominent Logo & Exact Required Branding */}
              <div className="mb-6 flex flex-col items-start gap-4">
                <UYGarmentsLogo size="lg" showText={false} customUrl={customLogoUrl} />
                <div className="space-y-1">
                  <h1 className="text-2xl font-black tracking-tight text-white uppercase">
                    UY Garments
                  </h1>
                  <p className="text-sm font-medium text-neutral-300 tracking-wide">
                    Garments Management Software
                  </p>
                  <p className="text-xs text-neutral-400 font-normal pt-1">
                    Developed by Muhammad Mubashir
                  </p>
                </div>
              </div>

              {/* Core System Highlights */}
              <div className="space-y-3 pt-6 border-t border-neutral-900 text-xs text-neutral-300">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                  <span>Factory, Fabric & Trims Inventory</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                  <span>Cutting, Stitching & QC Inspection (A/B/C)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                  <span>Wholesale Orders, Dispatch & Invoicing</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                  <span>Ledgers, PKR Accounts & Payroll Management</span>
                </div>
              </div>
            </div>

            {/* Bottom Security Note in Brand Panel */}
            <div className="pt-8 mt-6 border-t border-neutral-900 text-[11px] text-neutral-500">
              <div className="flex items-center gap-1.5 text-neutral-400 font-medium">
                <Lock className="w-3.5 h-3.5" />
                <span>Restricted Authorised Access</span>
              </div>
              <p className="mt-1 leading-relaxed text-neutral-500">
                Single-owner administrative console. Authenticated sessions protected with salted cryptographic hashing.
              </p>
            </div>
          </section>

          {/* Right Area (Clean White Surface) */}
          <section className="lg:col-span-7 bg-white p-8 sm:p-12 flex flex-col justify-between">
            <div>
              {/* Mobile view logo display */}
              <div className="lg:hidden mb-5">
                <UYGarmentsLogo size="md" showText={false} customUrl={customLogoUrl} />
              </div>

              {/* Error Alert Message */}
              {errorMessage && (
                <div
                  role="alert"
                  className="mb-6 p-3.5 rounded-lg bg-neutral-50 border border-neutral-900 text-neutral-900 text-xs flex items-start gap-2.5 animate-fadeIn"
                >
                  <AlertCircle className="w-4 h-4 text-neutral-950 shrink-0 mt-0.5" />
                  <div className="leading-snug font-medium flex-1">
                    {errorMessage}
                  </div>
                </div>
              )}

              {/* VIEW 1: STANDARD SIGN IN */}
              {mode === 'login' && (
                <div>
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-950">
                      Owner Sign In
                    </h2>
                    <p className="text-xs text-neutral-500 mt-1">
                      Enter your authorised owner credentials to access the management workspace.
                    </p>
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-5">
                    {/* Username / Email */}
                    <div>
                      <label
                        htmlFor="username"
                        className="block text-xs font-semibold text-neutral-800 uppercase tracking-wider mb-2"
                      >
                        Username or Email
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          id="username"
                          type="text"
                          autoComplete="username"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="uygarment942"
                          className="w-full pl-10 pr-3 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 transition-colors"
                          disabled={isLoading}
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Password with Visibility Toggle & Forgot Password Link */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label
                          htmlFor="password"
                          className="block text-xs font-semibold text-neutral-800 uppercase tracking-wider"
                        >
                          Master Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setErrorMessage(null);
                            setResetIdentifier(identifier || OWNER_EMAIL);
                            setMode('forgot-request');
                          }}
                          className="text-xs font-medium text-neutral-600 hover:text-neutral-950 transition-colors underline-offset-2 hover:underline cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-10 pr-11 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 transition-colors font-mono"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-800 transition-colors cursor-pointer"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-neutral-950 hover:bg-neutral-900 active:bg-black text-white font-medium py-3 px-4 rounded-lg shadow-sm transition-all duration-150 flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Authenticating Credentials...</span>
                        </>
                      ) : (
                        <>
                          <span>Sign In to Workspace</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* VIEW 2: FORGOT PASSWORD — STEP 1 (REQUEST CODE) */}
              {mode === 'forgot-request' && (
                <div>
                  <div className="mb-6">
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage(null);
                        setMode('login');
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-950 transition-colors mb-3 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign In</span>
                    </button>
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-950 flex items-center gap-2">
                      <KeyRound className="w-6 h-6 text-neutral-900" />
                      <span>Reset Password</span>
                    </h2>
                    <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                      Enter your registered owner email address or username. A secure 6-digit verification code will be dispatched to confirm your identity.
                    </p>
                  </div>

                  <form onSubmit={handleRequestResetSubmit} className="space-y-5">
                    <div>
                      <label
                        htmlFor="resetIdentifier"
                        className="block text-xs font-semibold text-neutral-800 uppercase tracking-wider mb-2"
                      >
                        Registered Owner Email or Username
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          id="resetIdentifier"
                          type="text"
                          value={resetIdentifier}
                          onChange={(e) => setResetIdentifier(e.target.value)}
                          placeholder="mrmubashir942@gmail.com"
                          className="w-full pl-10 pr-3 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 transition-colors"
                          disabled={isLoading}
                          autoFocus
                        />
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-2">
                        Registered owner address: <span className="font-mono text-neutral-700">{OWNER_EMAIL}</span>
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-neutral-950 hover:bg-neutral-900 active:bg-black text-white font-medium py-3 px-4 rounded-lg shadow-sm transition-all duration-150 flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating Verification Code...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Verification Code</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* VIEW 3: FORGOT PASSWORD — STEP 2 (ENTER CODE & NEW PASSWORD) */}
              {mode === 'forgot-verify' && (
                <div>
                  <div className="mb-5">
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage(null);
                        setMode('forgot-request');
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-950 transition-colors mb-3 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Change Email / Back</span>
                    </button>
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-950">
                      Verify & Set Password
                    </h2>
                    <p className="text-xs text-neutral-500 mt-1">
                      Enter the 6-digit code sent to your registered email and choose a new master password.
                    </p>
                  </div>

                  {/* Verification Code Notice & Assistant */}
                  <div className="mb-5 p-3.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-semibold text-neutral-950">
                        <Mail className="w-4 h-4 text-neutral-900" />
                        <span>Email Verification Dispatched</span>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-neutral-200 text-neutral-800 rounded font-bold">
                        10m Expiry
                      </span>
                    </div>
                    <div className="text-neutral-600 text-[11px] leading-relaxed">
                      Verification code sent to <strong className="text-neutral-950 font-mono">{resetRecord?.email || OWNER_EMAIL}</strong>.
                    </div>
                    {resetRecord?.code && (
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
                        <div className="text-[11px] text-neutral-600 font-mono">
                          Verification Code: <strong className="text-neutral-950 tracking-widest text-xs">{resetRecord.code}</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => setResetCode(resetRecord.code)}
                          className="text-[11px] font-semibold text-neutral-950 hover:underline cursor-pointer"
                        >
                          Auto-fill
                        </button>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleVerifyAndResetSubmit} className="space-y-4">
                    {/* Verification Code Input */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="resetCode"
                          className="block text-xs font-semibold text-neutral-800 uppercase tracking-wider"
                        >
                          6-Digit Verification Code
                        </label>
                        <button
                          type="button"
                          onClick={handleResendCode}
                          disabled={resendCountdown > 0 || isLoading}
                          className="text-[11px] text-neutral-600 hover:text-neutral-950 disabled:text-neutral-400 font-medium transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>
                            {resendCountdown > 0
                              ? `Resend in ${resendCountdown}s`
                              : 'Resend Code'}
                          </span>
                        </button>
                      </div>
                      <input
                        id="resetCode"
                        type="text"
                        maxLength={6}
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full text-center py-2.5 bg-white border border-neutral-300 rounded-lg text-lg font-mono font-bold tracking-widest text-neutral-900 placeholder-neutral-300 focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 transition-colors"
                        disabled={isLoading}
                        autoFocus
                      />
                    </div>

                    {/* New Password */}
                    <div>
                      <label
                        htmlFor="newPassword"
                        className="block text-xs font-semibold text-neutral-800 uppercase tracking-wider mb-1.5"
                      >
                        New Master Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          id="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="w-full pl-10 pr-11 py-2 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 transition-colors font-mono"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-800 transition-colors cursor-pointer"
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="block text-xs font-semibold text-neutral-800 uppercase tracking-wider mb-1.5"
                      >
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          className="w-full pl-10 pr-11 py-2 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 transition-colors font-mono"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-800 transition-colors cursor-pointer"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Reset Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-neutral-950 hover:bg-neutral-900 active:bg-black text-white font-medium py-3 px-4 rounded-lg shadow-sm transition-all duration-150 flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer pt-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying & Updating Password...</span>
                        </>
                      ) : (
                        <>
                          <span>Confirm & Reset Password</span>
                          <CheckCircle2 className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* VIEW 4: SUCCESS CONFIRMATION */}
              {mode === 'forgot-success' && (
                <div className="py-4 text-center space-y-5 animate-fadeIn">
                  <div className="w-16 h-16 bg-neutral-950 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-950">
                      Password Reset Complete
                    </h2>
                    <p className="text-xs text-neutral-600 max-w-sm mx-auto leading-relaxed">
                      Your master owner password has been successfully updated with salted cryptographic verification. You can now log into your workspace with your new password.
                    </p>
                  </div>

                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMessage(null);
                        setPassword('');
                        setResetCode('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setResetRecord(null);
                      }}
                      className="w-full bg-neutral-950 hover:bg-neutral-900 active:bg-black text-white font-medium py-3 px-4 rounded-lg shadow-sm transition-all duration-150 flex items-center justify-center gap-2 text-sm cursor-pointer"
                    >
                      <span>Proceed to Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Discreet Form Footer */}
            <div className="pt-8 mt-8 border-t border-neutral-100 text-center space-y-1">
              <div className="text-[11px] font-medium text-neutral-500">
                UY Garments · Garments Management Software
              </div>
              <div className="text-[11px] text-neutral-400">
                Developed by Muhammad Mubashir
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Discreet bottom page footer */}
      <footer className="px-6 py-4 border-t border-neutral-900 text-center text-xs text-neutral-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© {new Date().getFullYear()} UY Garments. All rights reserved.</span>
        <span className="font-medium text-neutral-400">
          Developed by Muhammad Mubashir
        </span>
      </footer>
    </div>
  );
};
