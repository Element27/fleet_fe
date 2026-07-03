import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import { SignIn } from '@clerk/clerk-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { toast } from '../lib/toast';
import { clsx } from 'clsx';

export function AuthPage() {
  const [stage, setStage] = useState<'signin' | 'signup' | 'verify'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [org, setOrg] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, isSignedIn } = useAuth();
  const navigate = useNavigate();

  const resetForm = () => {
    setCode('');
    setLoading(false);
  };

  useEffect(() => {
    if (isSignedIn) { navigate('/dashboard', { replace: true }); }
  }, [isSignedIn, navigate]);

  useEffect(() => {
    if (signUp.isLoaded && signUp.signUp?.status === 'missing_requirements') {
      setStage('verify');
    }
  }, [signUp.isLoaded, signUp.signUp?.status]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error('Password too short', 'Minimum 8 characters required.'); return; }
    setLoading(true);
    try {
      if (!signUp.isLoaded) { toast.error('Sign up unavailable', 'Please try again.'); setLoading(false); return; }
      const result = await signUp.signUp.create({
        emailAddress: email,
        password,
        firstName: fullname.split(' ')[0],
        lastName: fullname.split(' ').slice(1).join(' ') || undefined,
      });
      if (result.status === 'complete') {
        await signUp.setActive({ session: result.createdSessionId });
        const registered = await api.post('/api/auth/register', { fullname, email, organisation: org }).catch(() => null);
        if (!registered) console.warn('[Auth] Backend registration failed — user exists in Clerk but not in app DB');
        toast.success('Account created', 'Welcome to FleetGuard.');
        navigate('/dashboard');
      } else if (result.status === 'missing_requirements') {
        await signUp.signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        toast.info('Verify your email', 'A verification code has been sent to your email.');
        setStage('verify');
        resetForm();
      }
    } catch (err: any) {
      toast.error('Sign up failed', err.errors?.[0]?.message || 'Could not create account.');
    }
    setLoading(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setLoading(true);
    try {
      if (!signUp.isLoaded) { toast.error('Verification unavailable', 'Please try again.'); setLoading(false); return; }
      const result = await signUp.signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        await signUp.setActive({ session: result.createdSessionId });
        const registered = await api.post('/api/auth/register', { fullname, email, organisation: org }).catch(() => null);
        if (!registered) console.warn('[Auth] Backend registration failed — user exists in Clerk but not in app DB');
        toast.success('Email verified', 'Account created. Welcome to FleetGuard.');
        navigate('/dashboard');
      } else {
        toast.error('Verification failed', 'Invalid or expired code. Request a new one.');
      }
    } catch (err: any) {
      toast.error('Verification failed', err.errors?.[0]?.message || 'Invalid code.');
    }
    setLoading(false);
  };

  const handleResend = async () => {
    if (!signUp.isLoaded) { toast.error('Resend unavailable', 'Please try again.'); return; }
    try {
      await signUp.signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      toast.info('Code resent', 'A new verification code has been sent to your email.');
    } catch {
      toast.error('Resend failed', 'Could not resend code. Please try signing up again.');
    }
  };

  const handleBack = () => {
    setStage('signup');
    resetForm();
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="w-[48%] bg-gradient-to-br from-[#0f2a2a] via-[#0D6E6E] to-[#0a4040] flex flex-col p-10">
        <div className="flex items-center gap-3 mb-auto">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <span className="text-white font-bold text-base">FleetGuard</span>
        </div>
        <div className="mb-20">
          <h1 className="text-white text-3xl font-bold leading-tight mb-3">
            Compliance from disbursement to closure.
          </h1>
          <p className="text-white/60 text-sm leading-relaxed">
            One workflow connecting your dealer, collateral manager, tracking firm and insurer.
          </p>
        </div>
        <div className="text-white/30 text-xs">© 2026 FleetGuard</div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-surface px-10">
        <div className="w-full max-w-sm">

          {stage === 'verify' ? (
            <form onSubmit={handleVerify} className="space-y-4">
              <button type="button" onClick={handleBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2 transition-colors">
                <ArrowLeft size={15} /> Back
              </button>
              <h2 className="text-lg font-bold text-gray-900">Check your email</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                We sent a 6-digit verification code to <strong className="text-gray-700">{email}</strong>.
              </p>
              <div>
                <label className="label">Verification code</label>
                <input
                  className="input text-center text-lg tracking-[0.5em] font-mono"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  autoFocus
                />
              </div>
              <button type="submit" disabled={loading || code.length !== 6}
                className={clsx(
                  'w-full py-2.5 rounded-xl text-sm font-semibold transition-colors mt-2',
                  code.length === 6
                    ? 'bg-[#0D6E6E] text-white hover:bg-[#0a5555]'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                )}>
                {loading ? 'Verifying...' : 'Verify email'}
              </button>
              <p className="text-center text-xs text-gray-400">
                Didn't get it?{' '}
                <button type="button" onClick={handleResend} className="text-[#0D6E6E] hover:underline font-medium">
                  Resend code
                </button>
              </p>
            </form>
          ) : (
            <>
              {/* Tab toggle */}
              <div className="flex bg-white rounded-xl p-1 border border-gray-100 mb-7">
                {(['signin', 'signup'] as const).map(t => (
                  <button key={t} onClick={() => setStage(t)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                      stage === t ? 'bg-[#0f2a2a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}>
                    {t === 'signin' ? 'Sign in' : 'Sign up'}
                  </button>
                ))}
              </div>

              {stage === 'signin' ? (
                <SignIn
                  afterSignInUrl="/dashboard"
                  appearance={{
                    elements: {
                      rootBox: 'w-full',
                      card: 'shadow-none bg-transparent p-0',
                      header: 'hidden',
                      headerTitle: 'hidden',
                      headerSubtitle: 'hidden',
                      socialButtons: 'hidden',
                      dividerLine: 'hidden',
                      dividerText: 'hidden',
                      footerAction: 'hidden',
                      footer: 'hidden',
                      formFieldInput: 'border border-gray-200 rounded-xl px-4 py-2.5 text-sm w-full outline-none focus:border-[#0D6E6E] focus:ring-1 focus:ring-[#0D6E6E]',
                      formFieldLabel: 'block text-xs font-medium text-gray-500 mb-1.5',
                      formButtonPrimary: 'w-full bg-[#0D6E6E] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0a5555] transition-colors disabled:opacity-60 mt-2',
                      formHeaderAction: 'text-xs text-gray-400 hover:text-[#0D6E6E]',
                    },
                  }}
                />
              ) : (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <label className="label">Full name</label>
                    <input className="input" placeholder="Amara Okafor" value={fullname} onChange={e => setFullname(e.target.value)} required />
                  </div>
                  <div>
                    <label className="label">Organisation</label>
                    <input className="input" placeholder="e.g. Acme Bank" value={org} onChange={e => setOrg(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input className="input" type="email" placeholder="you@bank.com" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div>
                    <label className="label">Password</label>
                    <input className="input" type="password" placeholder="Min 8 characters" value={password} onChange={e => setPassword(e.target.value)} required />
                    <p className="text-xs text-gray-400 mt-1">Min 8 characters. Checked against known breached passwords.</p>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full bg-[#0D6E6E] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0a5555] transition-colors disabled:opacity-60">
                    {loading ? 'Creating...' : 'Create account'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
