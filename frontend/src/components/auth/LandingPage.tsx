import React, { useState } from 'react';
import { ShieldCheck, Mail, KeyRound, User, Loader2, Eye, EyeOff, ArrowLeft, RotateCcw } from 'lucide-react';
import { authApi } from '../../services/authApi';
import { useAuth } from '../../context/AuthContext';

type AuthStep = 'intro' | 'login' | 'signup' | 'verify-signup' | 'forgot' | 'verify-forgot' | 'reset-password';

export const LandingPage: React.FC = () => {
  const { checkSession } = useAuth();
  const [step, setStep] = useState<AuthStep>('intro');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const clearMessages = () => {
    setError(null);
    setSuccessMsg(null);
  };

  const clearFormState = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setOtp('');
    setShowPassword(false);
    clearMessages();
  };

  const handleSwitchStep = (newStep: AuthStep) => {
    clearFormState();
    setStep(newStep);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);
    try {
      await authApi.login({ email, password });
      await checkSession(); 
    } catch (err: any) {
      const errorMsg = err.message?.toLowerCase() || '';
      if (errorMsg.includes('unverified') || errorMsg.includes('email not confirmed')) {
        setStep('verify-signup');
        setError('Your account is unverified. Please check your email for the OTP to continue.');
      } else {
        setError(err.message || 'Invalid email or password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }
    if (password.length < 8) {
      return setError('Password must be at least 8 characters long.');
    }

    setIsLoading(true);
    try {
      await authApi.signup({ full_name: fullName.trim(), email, password });
      setStep('verify-signup');
      setSuccessMsg(`OTP sent to ${email}`);
    } catch (err: any) {
      const errorMsg = err.message?.toLowerCase() || '';
      if (errorMsg.includes('already exists') || errorMsg.includes('already registered')) {
        // FIX: Display clean error and stay on signup page instead of jumping to verify
        setError('Account already exists, please log in to continue.');
      } else {
        setError(err.message || 'Signup failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);
    try {
      await authApi.verifySignup({ email, otp });
      await checkSession(); 
    } catch (err: any) {
      setError(err.message || 'Invalid OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    clearMessages();
    setIsLoading(true);
    try {
      await authApi.resendOtp({ email });
      setSuccessMsg('A new OTP has been sent to your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);
    try {
      const res = await authApi.forgotPassword({ email });
      setSuccessMsg(res.message);
      setStep('verify-forgot'); 
    } catch (err: any) {
      setError(err.message || 'Failed to send reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendForgotOTP = async () => {
    clearMessages();
    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setSuccessMsg('A new reset code has been sent to your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    
    if (otp.length < 5) {
      return setError('Please enter a valid OTP.');
    }

    setIsLoading(true);
    try {
      await authApi.verifyResetOtp({ email, otp });
      setStep('reset-password');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setIsLoading(true);
    try {
      const res = await authApi.resetPassword({ email, otp, new_password: password });
      setSuccessMsg(res.message);
      setStep('login');
      setPassword('');
      setConfirmPassword('');
      setOtp('');
    } catch (err: any) {
      setError(err.message || 'Reset failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        
        {/* Left Side */}
        <div className="bg-gradient-to-br from-bis-950 via-bis-900 to-bis-800 p-10 text-white flex flex-col justify-center space-y-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-10 h-10 text-amber-500" />
            <span className="text-2xl font-black tracking-tight">MANAK SETU</span>
          </div>
          <h1 className="text-3xl font-extrabold leading-tight">Intelligent Compliance Navigator</h1>
          <p className="text-slate-300 text-sm leading-relaxed">
             Find standards. Verify requirements. Navigate certification.<br></br>
            Search relevant standards, understand compliance requirements, and get step-by-step guidance for product certification.
          </p>
        </div>

        {/* Right Side */}
        <div className="p-8 sm:p-10 flex flex-col justify-center bg-white relative">
          
          {step === 'intro' && (
            <div className="text-center space-y-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-slate-900">Welcome</h2>
              <p className="text-slate-500 text-sm">Login / Sign Up to Continue</p>
              <div className="space-y-3 pt-4">
                <button onClick={() => handleSwitchStep('login')} className="w-full py-3.5 bg-bis-900 hover:bg-bis-800 text-white font-bold rounded-xl shadow transition">Login</button>
                <button onClick={() => handleSwitchStep('signup')} className="w-full py-3.5 bg-white border-2 border-bis-900 text-bis-900 hover:bg-slate-50 font-bold rounded-xl transition">Sign Up</button>
              </div>
            </div>
          )}

          {step === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4 animate-fade-in">
              <button type="button" onClick={() => handleSwitchStep('intro')} className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-800 mb-2 transition-colors">
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Login to BIS AI Assistant</h2>
              </div>
              
              {successMsg && <p className="text-xs text-emerald-600 font-bold bg-emerald-50 p-2 rounded">{successMsg}</p>}
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                  <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-bis-500 transition-all" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 ml-1">Password</label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                  <input type={showPassword ? "text" : "password"} required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-bis-500 transition-all" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              {error && <p className="text-xs text-rose-500 font-bold bg-rose-50 p-2 rounded">{error}</p>}
              
              <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-bis-900 hover:bg-bis-800 disabled:opacity-70 text-white font-bold rounded-xl shadow transition flex justify-center mt-4">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
              </button>

              <div className="flex flex-col items-center gap-2 pt-4">
                <button type="button" onClick={() => handleSwitchStep('forgot')} className="text-sm font-semibold text-bis-700 hover:text-bis-900">Forgot Password?</button>
                <p className="text-sm text-slate-500">Don't have an account? <button type="button" onClick={() => handleSwitchStep('signup')} className="font-bold text-bis-900">Sign Up</button></p>
              </div>
            </form>
          )}

          {step === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-3 animate-fade-in" autoComplete="off">
              <button type="button" onClick={() => handleSwitchStep('intro')} className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-800 mb-2 transition-colors">
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
              <div className="text-center mb-4"><h2 className="text-xl font-bold text-slate-900">Create your Account</h2></div>
              
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute left-4 top-3" />
                <input type="text" required placeholder="Full Name" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-sm" />
              </div>
              
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-3" />
                <input type="email" required placeholder="Email Address" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-sm" />
              </div>
              
              <div className="relative">
                <KeyRound className="w-5 h-5 text-slate-400 absolute left-4 top-3" />
                <input type={showPassword ? "text" : "password"} required autoComplete="new-password" minLength={8} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-12 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              <div className="relative">
                <KeyRound className="w-5 h-5 text-slate-400 absolute left-4 top-3" />
                <input type={showPassword ? "text" : "password"} required autoComplete="new-password" minLength={8} placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-sm" />
              </div>
              
              {error && <p className="text-xs text-rose-500 font-bold bg-rose-50 p-2 rounded">{error}</p>}
              
              <button type="submit" disabled={isLoading} className="w-full py-3 bg-bis-900 hover:bg-bis-800 text-white font-bold rounded-xl shadow transition flex justify-center">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
              </button>
              <div className="text-center pt-2">
                <p className="text-sm text-slate-500">Already have an account? <button type="button" onClick={() => handleSwitchStep('login')} className="font-bold text-bis-900">Login</button></p>
              </div>
            </form>
          )}

          {step === 'verify-signup' && (
            <form onSubmit={handleVerifySignup} className="space-y-5 animate-fade-in">
              <button type="button" onClick={() => handleSwitchStep('signup')} className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-800 mb-2 transition-colors">
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
              <h2 className="text-2xl font-bold text-slate-900">Verify your email</h2>
              <p className="text-slate-500 text-sm">Enter the 6-digit OTP sent to <strong className="text-slate-800">{email}</strong>.</p>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                <input type="text" required maxLength={6} placeholder="_ _ _ _ _ _" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-bis-500 transition-all font-mono tracking-widest text-lg text-center" />
              </div>
              
              {error && <p className="text-xs text-rose-500 font-bold bg-rose-50 p-2 rounded">{error}</p>}
              {successMsg && <p className="text-xs text-emerald-600 font-bold bg-emerald-50 p-2 rounded">{successMsg}</p>}
              
              <button type="submit" disabled={isLoading || otp.length < 5} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition flex justify-center">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Registration'}
              </button>

              <div className="flex justify-center pt-2">
                <button type="button" onClick={handleResendOTP} disabled={isLoading} className="flex items-center gap-2 text-sm font-semibold text-bis-700 hover:text-bis-900 disabled:opacity-50">
                  <RotateCcw className="w-4 h-4" /> Resend OTP
                </button>
              </div>
            </form>
          )}

          {step === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4 animate-fade-in">
              <button type="button" onClick={() => handleSwitchStep('login')} className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-800 mb-2 transition-colors">
                <ArrowLeft className="w-3 h-3" /> Back to Login
              </button>
              <h2 className="text-2xl font-bold text-slate-900">Forgot Password</h2>
              <p className="text-slate-500 text-sm">Enter your registered email address to receive a secure OTP.</p>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-bis-500 transition-all" />
              </div>
              {error && <p className="text-xs text-rose-500 font-bold">{error}</p>}
              {successMsg && <p className="text-xs text-emerald-600 font-bold bg-emerald-50 p-2 rounded">{successMsg}</p>}
              <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-bis-900 hover:bg-bis-800 text-white font-bold rounded-xl shadow transition flex justify-center">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Code'}
              </button>
            </form>
          )}

          {step === 'verify-forgot' && (
            <form onSubmit={handleVerifyForgot} className="space-y-5 animate-fade-in">
              <button type="button" onClick={() => handleSwitchStep('forgot')} className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-800 mb-2 transition-colors">
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
              <h2 className="text-2xl font-bold text-slate-900">Verify Reset Code</h2>
              <p className="text-slate-500 text-sm">Enter the 6-digit code sent to <strong className="text-slate-800">{email}</strong>.</p>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                <input type="text" required maxLength={6} placeholder="_ _ _ _ _ _" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-bis-500 transition-all font-mono tracking-widest text-lg text-center" />
              </div>
              
              {error && <p className="text-xs text-rose-500 font-bold bg-rose-50 p-2 rounded">{error}</p>}
              {successMsg && <p className="text-xs text-emerald-600 font-bold bg-emerald-50 p-2 rounded">{successMsg}</p>}
              
              <button type="submit" disabled={isLoading || otp.length < 5} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition flex justify-center">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
              </button>

              <div className="flex justify-center pt-2">
                <button type="button" onClick={handleResendForgotOTP} disabled={isLoading} className="flex items-center gap-2 text-sm font-semibold text-bis-700 hover:text-bis-900 disabled:opacity-50">
                  <RotateCcw className="w-4 h-4" /> Resend OTP
                </button>
              </div>
            </form>
          )}

          {step === 'reset-password' && (
            <form onSubmit={handleResetPassword} className="space-y-4 animate-fade-in" autoComplete="off">
              <button type="button" onClick={() => handleSwitchStep('verify-forgot')} className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-800 mb-2 transition-colors">
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
              <h2 className="text-2xl font-bold text-slate-900">Set New Password</h2>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-slate-400 absolute left-4 top-3" />
                <input type={showPassword ? "text" : "password"} required minLength={8} autoComplete="new-password" placeholder="New Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-300 bg-slate-50 text-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-slate-400 absolute left-4 top-3" />
                <input type={showPassword ? "text" : "password"} required minLength={8} autoComplete="new-password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-sm" />
              </div>
              {error && <p className="text-xs text-rose-500 font-bold">{error}</p>}
              {successMsg && <p className="text-xs text-emerald-600 font-bold bg-emerald-50 p-2 rounded">{successMsg}</p>}
              <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-bis-900 hover:bg-bis-800 text-white font-bold rounded-xl shadow transition flex justify-center">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};