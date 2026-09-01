import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { 
  Lock, 
  Mail, 
  User, 
  Building2, 
  ShieldCheck, 
  ArrowRight, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: { name: string; email: string; role: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [step, setStep] = useState<'form' | 'otp'>('form');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organizationType, setOrganizationType] = useState('MSME');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  // Validation & Status States
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [timer, setTimer] = useState<number>(60);
  const [isResendDisabled, setIsResendDisabled] = useState(true);

  // Email format regex validation
  const isValidEmail = (val: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(val.trim());
  };

  // Timer countdown for OTP resend
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsResendDisabled(false);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Handle Step 1: Form Submit & Request OTP from Backend
  const handleRequestOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (!isValidEmail(email)) {
      setErrorMsg('Please enter a valid official email address (e.g., name@domain.com).');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    try {
      // Connect to FastAPI to send the email
      const res = await fetch('http://127.0.0.1:8000/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      if (!res.ok) throw new Error("Failed to connect to backend to send OTP. Is your FastAPI server running?");

      // Move to OTP step
      setStep('otp');
      setTimer(60);
      setIsResendDisabled(true);
      setOtp(['', '', '', '', '', '']);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Handle OTP Input box navigation
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input box
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Handle Step 2: Verify OTP with Backend
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const enteredOtp = otp.join('');
    if (enteredOtp.length < 6) {
      setErrorMsg('Please enter the complete 6-digit OTP sent to your email.');
      return;
    }

    try {
      // Ask Python to verify if the typed OTP matches what was emailed
      const res = await fetch('http://127.0.0.1:8000/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: enteredOtp })
      });

      if (!res.ok) {
        throw new Error("Invalid or expired OTP code. Please check your email and try again.");
      }

      // Trigger success callback
      if (onSuccess) {
        onSuccess({
          name: fullName.trim() || email.split('@')[0],
          email: email.trim(),
          role: organizationType,
        });
      }

      handleModalClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleModalClose = () => {
    setStep('form');
    setEmail('');
    setPassword('');
    setFullName('');
    setOtp(['', '', '', '', '', '']);
    setErrorMsg(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={
        <div className="flex items-center gap-2 text-bis-900">
          <ShieldCheck className="w-5 h-5 text-amber-500" />
          <span className="font-extrabold font-sans">
            {step === 'otp'
              ? 'Email Verification (OTP)'
              : isSignUp
              ? 'BIS Single Sign-On (SSO) Registration'
              : 'e-BIS Official Portal Login'}
          </span>
        </div>
      }
      maxWidth="md"
    >
      {/* Informational Banner */}
      <div className="bg-bis-50 border border-bis-200 p-3 rounded-xl text-xs text-bis-900 flex items-center gap-2 mb-4">
        <Lock className="w-4 h-4 text-bis-700 shrink-0" />
        <span>
          {step === 'otp'
            ? `A 6-digit one-time verification code has been dispatched to ${email}.`
            : 'Secure authentication for manufacturers, testing laboratories, and auditors.'}
        </span>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: Registration / Login Form */}
      {step === 'form' ? (
        <form onSubmit={handleRequestOTP} className="space-y-4">
          {isSignUp && (
            <>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Full Name / Authorized Signatory
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-bis-500 focus:border-bis-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Stakeholder Category
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <select
                    value={organizationType}
                    onChange={(e) => setOrganizationType(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-bis-500 focus:border-bis-500 outline-none"
                  >
                    <option value="MSME">Domestic MSME / Startup (Udyam)</option>
                    <option value="Large Scale">Large Domestic Industry</option>
                    <option value="Foreign Manufacturer">Foreign Manufacturer (FMCS)</option>
                    <option value="Testing Lab">BIS Recognized Testing Laboratory</option>
                    <option value="Consumer">Individual Consumer / Student</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Official Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-bis-500 focus:border-bis-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-bis-500 focus:border-bis-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-bis-900 hover:bg-bis-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow transition-all"
          >
            <span>{isSignUp ? 'Send Registration OTP' : 'Send Login OTP'}</span>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
              }}
              className="text-xs text-bis-700 hover:text-bis-900 font-semibold transition-colors"
            >
              {isSignUp
                ? 'Already registered on e-BIS? Sign In'
                : "Don't have an account? Register with Udyam / BIS SSO"}
            </button>
          </div>
        </form>
      ) : (
        /* STEP 2: 6-Digit OTP Verification Screen */
        <form onSubmit={handleVerifyOTP} className="space-y-5">
          <div className="text-center space-y-1">
            <p className="text-xs font-semibold text-slate-600">
              Enter the 6-digit verification code sent to:
            </p>
            <p className="text-xs font-mono font-bold text-bis-900">{email}</p>
          </div>

          {/* 6 Digit Input Boxes */}
          <div className="flex justify-center gap-2 sm:gap-3 py-2">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-input-${idx}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                className="w-10 h-12 sm:w-12 sm:h-14 text-center font-mono text-base sm:text-lg font-extrabold rounded-xl border-2 border-slate-300 focus:border-bis-700 focus:ring-2 focus:ring-bis-100 bg-slate-50 focus:bg-white outline-none transition-all"
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-bis-900 hover:bg-bis-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow transition-all"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Verify OTP & Complete Sign-In</span>
          </button>

          {/* Resend & Back controls */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setStep('form');
                setErrorMsg(null);
                setOtp(['', '', '', '', '', '']);
              }}
              className="text-slate-500 hover:text-slate-800 font-semibold"
            >
              ← Change Email
            </button>

            <button
              type="button"
              disabled={isResendDisabled}
              onClick={() => handleRequestOTP()}
              className={`flex items-center gap-1 font-semibold ${
                isResendDisabled
                  ? 'text-slate-400 cursor-not-allowed'
                  : 'text-bis-700 hover:text-bis-900'
              }`}
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isResendDisabled ? `Resend OTP in ${timer}s` : 'Resend OTP'}</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};