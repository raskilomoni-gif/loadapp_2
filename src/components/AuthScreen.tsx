import React, { useRef, useState } from 'react';
import { Truck, Package, User, Lock, Mail, Phone, MessageCircle, IdCard, Upload, Eye, EyeOff, ArrowRight, ArrowLeft, Loader2, CheckCircle2, X, KeyRound, MailCheck } from 'lucide-react';
import { signInWithEmail, signUpWithEmail, uploadIdPhoto, resetPassword } from '../services/authService';
import { UserProfile, UserRole } from '../types/auth';
import { supabase } from '../services/supabaseClient';

interface AuthScreenProps {
  onAuthSuccess: (profile: UserProfile) => void;
}

type AuthMode = 'welcome' | 'signin' | 'signup' | 'forgot';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('shipper');
  const [maxListings, setMaxListings] = useState(10);
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [idPhotoFile, setIdPhotoFile] = useState<File | null>(null);
  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetFields = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setPhone('');
    setWhatsapp('');
    setIdNumber('');
    setIdPhotoFile(null);
    setIdPhotoPreview(null);
    setError(null);
  };

  const handleIdPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('ID photo must be under 5MB.');
      return;
    }
    setIdPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setIdPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleSignIn = async () => {
    setError(null);
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const { user, error: err } = await signInWithEmail(email, password);
      if (err || !user) {
        setError(err || 'Sign-in failed.');
      } else {
        onAuthSuccess(user);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setError(null);
    if (!email || !password || !displayName) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!phone) {
      setError('Phone number is required.');
      return;
    }
    if (!idNumber) {
      setError('ID number is required for verification.');
      return;
    }
    if (!idPhotoFile) {
      setError('Please upload a photo of your ID document.');
      return;
    }

    setLoading(true);
    try {
      // Sign up first to get the user ID
      const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password });
      if (authErr) {
        setError(authErr.message);
        setLoading(false);
        return;
      }
      if (!authData.user) {
        setError('Registration failed — no user returned.');
        setLoading(false);
        return;
      }

      const userId = authData.user.id;

      // Upload ID photo to storage
      setUploadingPhoto(true);
      const photoUrl = await uploadIdPhoto(userId, idPhotoFile);
      setUploadingPhoto(false);

      if (!photoUrl) {
        setError('Could not upload ID photo. Please try again.');
        setLoading(false);
        return;
      }

      // Create profile with all fields — pass existingUserId so signUpWithEmail
      // does NOT call supabase.auth.signUp a second time (that was causing the
      // "user already registered" error)
      const { user, error: err } = await signUpWithEmail(
        email,
        password,
        role,
        displayName,
        maxListings,
        phone,
        whatsapp || undefined,
        idNumber,
        photoUrl,
        userId
      );
      if (err || !user) {
        setError(err || 'Registration failed.');
      } else {
        onAuthSuccess(user);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- Welcome screen: role + sign-in / sign-up choice ---
  if (mode === 'welcome') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-4">
              <Truck className="w-8 h-8 text-amber-400" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">HaulFlow</h1>
            <p className="text-slate-400 mt-2">East African Freight & Escrow Platform</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">Choose your account type</h2>
            <p className="text-sm text-slate-400 mb-6">Select whether you ship cargo or drive trucks. You can change this later.</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => { setRole('shipper'); setMode('signup'); }}
                className="group relative p-6 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-amber-500/50 hover:bg-amber-500/5 transition text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition">
                    <Package className="w-6 h-6" />
                  </span>
                  <span className="text-lg font-bold text-white">Shipper</span>
                </div>
                <p className="text-sm text-slate-400">I have cargo to move. I post loads and choose trucks.</p>
              </button>

              <button
                onClick={() => { setRole('driver'); setMode('signup'); }}
                className="group relative p-6 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition">
                    <Truck className="w-6 h-6" />
                  </span>
                  <span className="text-lg font-bold text-white">Driver</span>
                </div>
                <p className="text-sm text-slate-400">I move cargo. I browse available loads and bid on trips.</p>
              </button>
            </div>

            <div className="pt-6 border-t border-slate-800 text-center">
              <p className="text-sm text-slate-400">Already have an account?</p>
              <button
                onClick={() => { resetFields(); setMode('signin'); }}
                className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
              >
                Sign In
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Sign In screen ---
  if (mode === 'signin') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <BackButton onClick={() => { resetFields(); setMode('welcome'); }} />

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-3">
              <Truck className="w-7 h-7 text-amber-400" />
            </div>
            <h1 className="text-2xl font-black text-white">Welcome back</h1>
            <p className="text-slate-400 mt-1 text-sm">Sign in to your HaulFlow account</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <AuthInput icon={<Mail className="w-4 h-4" />} type="email" placeholder="Email address" value={email} onChange={setEmail} />
            <AuthInput
              icon={<Lock className="w-4 h-4" />}
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={setPassword}
              trailing={
                <button onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-white">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            {/* Forgot password link */}
            <div className="text-right">
              <button
                onClick={() => { setError(null); setResetSent(false); setMode('forgot'); }}
                className="text-xs text-slate-400 hover:text-amber-400 transition flex items-center gap-1 ml-auto"
              >
                <KeyRound className="w-3 h-3" /> Forgot password?
              </button>
            </div>

            {error && <AuthError message={error} />}

            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Forgot Password screen ---
  if (mode === 'forgot') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <BackButton onClick={() => { resetFields(); setResetSent(false); setMode('signin'); }} />

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-3">
              <KeyRound className="w-7 h-7 text-amber-400" />
            </div>
            <h1 className="text-2xl font-black text-white">Reset password</h1>
            <p className="text-slate-400 mt-1 text-sm">Enter your email and we'll send you a recovery link</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            {resetSent ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                  <MailCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">Recovery link sent</strong>
                    <span className="text-slate-300 text-sm">Check your email ({email}) for a password reset link. The link may take a minute to arrive.</span>
                  </div>
                </div>
                <button
                  onClick={() => { resetFields(); setResetSent(false); setMode('signin'); }}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Sign In
                </button>
              </div>
            ) : (
              <>
                <AuthInput icon={<Mail className="w-4 h-4" />} type="email" placeholder="Email address" value={email} onChange={setEmail} />

                {error && <AuthError message={error} />}

                <button
                  onClick={async () => {
                    setError(null);
                    if (!email) {
                      setError('Please enter your email address.');
                      return;
                    }
                    setLoading(true);
                    try {
                      const { error: err } = await resetPassword(email);
                      if (err) {
                        setError(err);
                      } else {
                        setResetSent(true);
                      }
                    } catch {
                      setError('Network error. Please try again.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send Recovery Link <ArrowRight className="w-4 h-4" /></>}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Sign Up screen ---
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg my-8">
        <BackButton onClick={() => { resetFields(); setMode('welcome'); }} />

        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl border mb-3 ${role === 'shipper' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
            {role === 'shipper' ? <Package className="w-7 h-7 text-amber-400" /> : <Truck className="w-7 h-7 text-emerald-400" />}
          </div>
          <h1 className="text-2xl font-black text-white">Create your account</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Registering as <span className={role === 'shipper' ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>{role === 'shipper' ? 'Shipper' : 'Driver'}</span>
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          {/* Role switcher */}
          <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl">
            <button
              onClick={() => setRole('shipper')}
              className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2 ${role === 'shipper' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              <Package className="w-4 h-4" /> Shipper
            </button>
            <button
              onClick={() => setRole('driver')}
              className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2 ${role === 'driver' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              <Truck className="w-4 h-4" /> Driver
            </button>
          </div>

          <AuthInput icon={<User className="w-4 h-4" />} placeholder={role === 'shipper' ? 'Your name or company name *' : 'Your full name *'} value={displayName} onChange={setDisplayName} />
          <AuthInput icon={<Mail className="w-4 h-4" />} type="email" placeholder="Email address *" value={email} onChange={setEmail} />
          <AuthInput
            icon={<Lock className="w-4 h-4" />}
            type={showPassword ? 'text' : 'password'}
            placeholder="Password (min 6 characters) *"
            value={password}
            onChange={setPassword}
            trailing={
              <button onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-white">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          {/* Contact: Phone + WhatsApp */}
          <div className="grid grid-cols-2 gap-3">
            <AuthInput icon={<Phone className="w-4 h-4" />} placeholder="Phone number *" value={phone} onChange={setPhone} />
            <AuthInput icon={<MessageCircle className="w-4 h-4" />} placeholder="WhatsApp number" value={whatsapp} onChange={setWhatsapp} />
          </div>

          {/* ID verification */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1">
              <IdCard className="w-3.5 h-3.5" /> ID Verification (Required)
            </label>
            <AuthInput
              icon={<IdCard className="w-4 h-4" />}
              placeholder="ID / Passport / DL number *"
              value={idNumber}
              onChange={setIdNumber}
            />

            {/* ID photo upload */}
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleIdPhotoChange} />
            {idPhotoPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-700">
                <img src={idPhotoPreview} alt="ID preview" className="w-full h-40 object-cover" />
                <button
                  onClick={() => { setIdPhotoFile(null); setIdPhotoPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-950/80 text-white hover:bg-red-500/80 transition"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/90 text-white text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ID photo ready
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 rounded-xl bg-slate-800/50 border-2 border-dashed border-slate-700 hover:border-amber-500/50 transition flex flex-col items-center gap-2 text-slate-400 hover:text-white"
              >
                <Upload className="w-7 h-7" />
                <span className="text-sm font-medium">Tap to upload a photo of your ID</span>
                <span className="text-xs text-slate-500">National ID, Passport, or Driver License — max 5MB</span>
              </button>
            )}
          </div>

          {/* Max listings slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Max marketplace listings</label>
              <span className="text-sm font-bold text-amber-400">{maxListings}</span>
            </div>
            <input
              type="range"
              min={5}
              max={15}
              step={1}
              value={maxListings}
              onChange={(e) => setMaxListings(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>5</span><span>10</span><span>15</span>
            </div>
          </div>

          {error && <AuthError message={error} />}

          <button
            onClick={handleSignUp}
            disabled={loading || uploadingPhoto}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : uploadingPhoto ? (
              <>Uploading ID... <Loader2 className="w-5 h-5 animate-spin" /></>
            ) : (
              <>Create Account <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Helper sub-components ---

const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition font-medium"
  >
    <ArrowLeft className="w-4 h-4" /> Back
  </button>
);

const AuthInput: React.FC<{
  icon?: React.ReactNode;
  type?: string;
  placeholder: string;
  value: string | number;
  onChange: (v: string) => void;
  trailing?: React.ReactNode;
}> = ({ icon, type = 'text', placeholder, value, onChange, trailing }) => (
  <div className="relative flex items-center">
    {icon && <span className="absolute left-3 text-slate-500">{icon}</span>}
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full py-3 ${icon ? 'pl-10' : 'pl-4'} ${trailing ? 'pr-10' : 'pr-4'} rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 transition`}
    />
    {trailing && <span className="absolute right-3">{trailing}</span>}
  </div>
);

const AuthError: React.FC<{ message: string }> = ({ message }) => (
  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
    {message}
  </div>
);
