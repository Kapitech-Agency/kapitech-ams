import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { KeyRound, Mail, Eye, EyeOff, AlertCircle, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/apiClient';
import { authenticateAdmin, cacheAdminSession } from '../../lib/adminAuth';
import { useLanguage } from '../../lib/LanguageContext';
import { Button } from '../../components/ui/Button';

const loginSlides = [
  {
    src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=85',
    alt: 'Modern collaborative office workspace',
  },
  {
    src: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=85',
    alt: 'Minimal creative studio workspace',
  },
  {
    src: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1600&q=85',
    alt: 'Contemporary agency office interior',
  },
];

export const AdminLogin: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaRecoveryMode, setMfaRecoveryMode] = useState(false);
  const [trustDevice, setTrustDevice] = useState(true);
  const [mfaCode, setMfaCode] = useState('');
  const [artFrame, setArtFrame] = useState(0);
  const [isArtAutoplayPaused, setIsArtAutoplayPaused] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  const mfaInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const searchParams = new URLSearchParams(location.search);
  const redirectUrl = searchParams.get('redirect') || '/admin/dashboard';

  useEffect(() => {
    let mounted = true;
    api.auth.me().then((res) => {
      if (mounted && res.success && res.data?.success) {
        navigate(redirectUrl, { replace: true });
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, [navigate, redirectUrl]);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const previousStyles = {
      rootOverflow: root.style.overflow,
      rootScrollbarWidth: root.style.scrollbarWidth,
      rootOverscrollBehavior: root.style.overscrollBehavior,
      bodyOverflow: body.style.overflow,
      bodyScrollbarWidth: body.style.scrollbarWidth,
      bodyOverscrollBehavior: body.style.overscrollBehavior,
    };

    root.style.overflow = 'hidden';
    root.style.scrollbarWidth = 'none';
    root.style.overscrollBehavior = 'none';
    body.style.overflow = 'hidden';
    body.style.scrollbarWidth = 'none';
    body.style.overscrollBehavior = 'none';

    return () => {
      root.style.overflow = previousStyles.rootOverflow;
      root.style.scrollbarWidth = previousStyles.rootScrollbarWidth;
      root.style.overscrollBehavior = previousStyles.rootOverscrollBehavior;
      body.style.overflow = previousStyles.bodyOverflow;
      body.style.scrollbarWidth = previousStyles.bodyScrollbarWidth;
      body.style.overscrollBehavior = previousStyles.bodyOverscrollBehavior;
    };
  }, []);

  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionPreferenceChange = (event: MediaQueryListEvent) => {
      if (event.matches) setIsArtAutoplayPaused(true);
    };

    motionPreference.addEventListener('change', handleMotionPreferenceChange);
    const slideInterval = isArtAutoplayPaused
      ? undefined
      : window.setInterval(() => {
          setArtFrame((current) => (current + 1) % loginSlides.length);
        }, 6000);

    return () => {
      if (slideInterval !== undefined) window.clearInterval(slideInterval);
      motionPreference.removeEventListener('change', handleMotionPreferenceChange);
    };
  }, [isArtAutoplayPaused]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim() || !password) {
      setErrorMessage(language === 'id'
        ? 'Username/email dan password wajib diisi.'
        : 'Username/email and password are required.');
      return;
    }

    setLoading(true);
    try {
      const result = await authenticateAdmin(identifier, password, rememberMe);
      if (result.success && result.requiresMfa) {
        setMfaRequired(true);
        setMfaCode('');
        return;
      }
      if (result.success) {
        navigate(redirectUrl, { replace: true });
      } else {
        setErrorMessage(result.error || (language === 'id' ? 'Autentikasi gagal.' : 'Authentication failed.'));
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error
        ? err.message
        : (language === 'id' ? 'Terjadi kendala saat login.' : 'Unable to sign in.'));
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const normalizedCode = mfaCode.trim().toUpperCase();
    if (mfaRecoveryMode ? normalizedCode.length < 12 : !/^\d{6}$/.test(normalizedCode)) {
      setErrorMessage(mfaRecoveryMode
        ? (language === 'id' ? 'Masukkan recovery code yang valid.' : 'Enter a valid recovery code.')
        : (language === 'id' ? 'Masukkan kode MFA 6 digit.' : 'Enter the 6-digit MFA code.'));
      return;
    }

    setLoading(true);
    try {
      const result = await api.auth.mfaVerify(normalizedCode, trustDevice);
      if (result.success && result.data?.success && result.data.user) {
        cacheAdminSession(result.data.user, rememberMe);
        window.dispatchEvent(new Event('kapitech_auth_state_changed'));
        navigate(redirectUrl, { replace: true });
      } else {
        setErrorMessage(result.error || (language === 'id' ? 'Kode MFA tidak valid.' : 'Invalid MFA code.'));
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : (language === 'id' ? 'Verifikasi MFA gagal.' : 'MFA verification failed.'));
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPassword = () => {
    setMfaRequired(false);
    setMfaRecoveryMode(false);
    setMfaCode('');
    setErrorMessage(null);
  };

  const mfaEnabledNotice = searchParams.get('mfaEnabled') === '1';

  return (
    <div
      data-kapi-admin="true"
      data-theme="dark"
      data-login-motion="true"
      style={{
        colorScheme: 'dark',
        '--bg': '#09090c',
        '--panel': '#0f0f14',
        '--line': '#20202a',
        '--text': '#f3f3f6',
        '--muted': '#8b8b99',
        '--accent': '#dc143c',
        '--accent-text': '#ff4d6d',
        '--series-1': '#dc143c',
        '--series-2': '#34d399',
        '--series-3': '#5b8cff',
        '--series-4': '#b9b9c6',
        '--success': '#34d399',
        '--warning': '#f5a524',
        '--danger': '#f97066',
        '--info': '#5b8cff',
        '--crimson-500': '#dc143c',
        '--crimson-600': '#c40f34',
        '--crimson-700': '#a10c2b',
        '--accent-hover': '#c40f34',
        '--accent-pressed': '#a10c2b',
      } as React.CSSProperties}
      className="ams-shell relative isolate h-dvh min-h-0 overflow-hidden bg-bg text-fg font-sans"
    >
      <style>{`
        [data-login-motion] .login-reveal {
          opacity: 0;
          animation: kapi-login-reveal 850ms cubic-bezier(0.2, 0.72, 0.24, 1) forwards;
        }
        [data-login-motion] .login-reveal--one { animation-delay: 90ms; }
        [data-login-motion] .login-reveal--two { animation-delay: 190ms; }
        [data-login-motion] [data-login-form="true"] > * {
          opacity: 0;
          animation: kapi-login-reveal 680ms cubic-bezier(0.2, 0.72, 0.24, 1) forwards;
        }
        [data-login-motion] [data-login-form="true"] > *:nth-child(1) { animation-delay: 280ms; }
        [data-login-motion] [data-login-form="true"] > *:nth-child(2) { animation-delay: 350ms; }
        [data-login-motion] [data-login-form="true"] > *:nth-child(3) { animation-delay: 420ms; }
        [data-login-motion] [data-login-form="true"] > *:nth-child(4) { animation-delay: 490ms; }
        [data-login-motion] [data-login-form="true"] > *:nth-child(5) { animation-delay: 560ms; }
        [data-login-motion] .login-bg-gradient {
          background-size: 140% 140%;
          animation: kapi-gradient-drift 24s ease-in-out infinite alternate;
        }
        [data-login-motion] .login-grid-drift {
          animation: kapi-grid-drift 42s linear infinite;
          will-change: background-position;
        }
        [data-login-motion] .login-glow {
          will-change: transform, opacity;
          animation: kapi-glow-float 17s ease-in-out infinite alternate;
        }
        [data-login-motion] .login-glow--secondary {
          animation-delay: -8s;
          animation-duration: 22s;
        }
        [data-login-motion] .login-photo-frame {
          transition: border-color 400ms ease, box-shadow 500ms ease;
        }
        [data-login-motion] .login-photo-frame:hover {
          border-color: rgba(255,255,255,0.18);
          box-shadow: 0 28px 90px rgba(0,0,0,0.3), 0 0 42px rgba(220,20,60,0.08);
        }
        [data-login-motion] .login-photo-enter {
          animation: kapi-photo-enter 900ms cubic-bezier(0.2, 0.72, 0.24, 1) both;
        }
        [data-login-motion] .login-photo-sheen {
          position: relative;
          overflow: hidden;
        }
        [data-login-motion] .login-photo-sheen::after {
          content: "";
          position: absolute;
          inset: -20% auto -20% -55%;
          width: 34%;
          background: linear-gradient(105deg, transparent, rgba(255,255,255,0.065), transparent);
          opacity: 0;
          transform: skewX(-14deg);
          pointer-events: none;
          animation: kapi-sheen-pass 8s ease-in-out 1.2s infinite;
        }
        [data-login-motion] .login-caption-enter {
          animation: kapi-login-reveal 900ms 180ms cubic-bezier(0.2, 0.72, 0.24, 1) both;
        }
        [data-login-motion] .login-controls-enter {
          animation: kapi-login-reveal 800ms 360ms cubic-bezier(0.2, 0.72, 0.24, 1) both;
        }
        [data-login-motion] .login-brand-chip {
          animation: kapi-login-reveal 750ms 450ms cubic-bezier(0.2, 0.72, 0.24, 1) both;
        }
        [data-login-motion] .login-ambient-line {
          transform-origin: left center;
          animation: kapi-line-breathe 7s ease-in-out infinite;
        }
        @keyframes kapi-login-reveal {
          from { opacity: 0; transform: translate3d(0, 14px, 0); filter: blur(5px); }
          to { opacity: 1; transform: translate3d(0, 0, 0); filter: blur(0); }
        }
        @keyframes kapi-photo-enter {
          from { opacity: 0.25; filter: saturate(0.82); }
          to { opacity: 1; filter: saturate(1); }
        }
        @keyframes kapi-gradient-drift {
          0% { background-position: 0% 12%; }
          100% { background-position: 100% 88%; }
        }
        @keyframes kapi-grid-drift {
          from { background-position: 0 0, 0 0; }
          to { background-position: 64px 64px, 64px 64px; }
        }
        @keyframes kapi-glow-float {
          0% { transform: translate3d(-8px, 0, 0) scale(0.96); opacity: 0.55; }
          100% { transform: translate3d(20px, 14px, 0) scale(1.06); opacity: 1; }
        }
        @keyframes kapi-sheen-pass {
          0%, 66%, 100% { left: -55%; opacity: 0; }
          12% { opacity: 1; }
          35% { left: 125%; opacity: 0; }
        }
        @keyframes kapi-line-breathe {
          0%, 100% { transform: scaleX(0.65); opacity: 0.45; }
          50% { transform: scaleX(1); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-login-motion] .login-reveal,
          [data-login-motion] [data-login-form="true"] > *,
          [data-login-motion] .login-bg-gradient,
          [data-login-motion] .login-grid-drift,
          [data-login-motion] .login-glow,
          [data-login-motion] .login-photo-enter,
          [data-login-motion] .login-photo-sheen::after,
          [data-login-motion] .login-caption-enter,
          [data-login-motion] .login-controls-enter,
          [data-login-motion] .login-brand-chip,
          [data-login-motion] .login-ambient-line {
            animation: none;
            transition: none;
            scroll-behavior: auto;
            opacity: 1;
            transform: none;
            filter: none;
          }
        }
      `}</style>
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_12%_10%,rgba(220,20,60,0.055),transparent_34%),radial-gradient(ellipse_at_85%_100%,rgba(243,243,246,0.025),transparent_32%)]" />
        <div className="login-ambient-line absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-line to-transparent" />
      </div>

      <div className="relative z-10 grid h-dvh min-h-0 w-full lg:grid-cols-[minmax(360px,0.82fr)_minmax(0,1.18fr)]">
        <section className="flex h-full min-h-0 flex-col px-6 py-4 sm:px-8 sm:py-5 lg:px-10 xl:px-12 2xl:px-14">
          <div className="login-reveal login-reveal--one flex w-full items-center gap-3.5">
            <img
              src="https://raw.githubusercontent.com/Kapitech-Agency/Kapitech-Agency.github.io/main/public/white.png"
              alt="Kapitech logo"
              className="h-9 w-auto max-w-[76px] shrink-0 object-contain"
              loading="eager"
              decoding="async"
            />
            <span className="text-[15px] font-semibold leading-5 tracking-[-0.025em] text-fg">
              Kapitech Agency
            </span>
          </div>

          <div className="login-reveal login-reveal--two mx-auto flex w-full max-w-[390px] min-h-0 flex-1 flex-col justify-center py-[clamp(8px,2vh,24px)]">
            <div className="mb-8">
              <h1 className="text-[26px] font-semibold leading-8 tracking-[-0.035em] text-fg sm:text-[28px]">
                {mfaRequired
                  ? (language === 'id' ? 'Verifikasi identitas Anda' : 'Verify your identity')
                  : (language === 'id' ? 'Masuk ke akun Anda' : 'Log in to your account')}
              </h1>
              <p className="mt-2 text-[13px] leading-5 text-muted">
                {mfaRequired
                  ? (language === 'id' ? 'Masukkan kode autentikasi untuk melanjutkan.' : 'Enter your authentication code to continue.')
                  : (language === 'id' ? 'Masuk dengan akun Kapitech untuk mengakses AMS.' : 'Sign in with your Kapitech account to access AMS.')}
              </p>
            </div>

              {mfaEnabledNotice && (
                <div className="mb-5 flex items-start gap-2 rounded-control border border-success/30 bg-success/10 p-3.5 text-xs text-success">
                  <ShieldCheck size={16} className="mt-0.5 shrink-0" />
                  <span>{language === 'id' ? 'MFA berhasil diaktifkan. Silakan login ulang untuk melanjutkan.' : 'MFA is enabled. Sign in again to continue.'}</span>
                </div>
              )}

              {errorMessage && (
                <div role="alert" aria-live="polite" className="mb-5 flex items-start gap-2 rounded-control border border-danger/30 bg-danger/10 p-3.5 text-xs leading-5 text-danger">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {!mfaRequired ? (
                <form onSubmit={handleSubmit} data-login-form="true" className="space-y-5">
                  <div>
                    <label htmlFor="admin-identifier" className="mb-1.5 block text-xs font-medium font-sans text-fg/85">
                      {language === 'id' ? 'Username atau email' : 'Username or email'}
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-accent-text" />
                      <input
                        id="admin-identifier"
                        name="username"
                        type="text"
                        autoComplete="username"
                        autoCapitalize="none"
                        spellCheck={false}
                        required
                        autoFocus
                        disabled={loading}
                        value={identifier}
                        onChange={(e) => { setIdentifier(e.target.value); if (errorMessage) setErrorMessage(null); }}
                        className="h-11 w-full rounded-control border border-line bg-bg pl-10 pr-4 text-sm text-fg placeholder:text-muted/60 transition-colors focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent font-sans"
                        placeholder={language === 'id' ? 'nama pengguna atau email' : 'you@company.com'}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="admin-password" className="mb-1.5 block text-xs font-medium font-sans text-fg/85">
                      Password
                    </label>
                    <div className="relative">
                      <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-accent-text" />
                      <input
                        id="admin-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        disabled={loading}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); if (errorMessage) setErrorMessage(null); }}
                        className="h-11 w-full rounded-control border border-line bg-bg pl-10 pr-11 text-sm text-fg placeholder:text-muted/60 transition-colors focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent font-sans"
                        placeholder="••••••••"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute right-1.5 top-1/2 h-8 min-h-8 w-8 min-w-8 -translate-y-1/2 p-0"
                        aria-label={showPassword ? (language === 'id' ? 'Sembunyikan password' : 'Hide password') : (language === 'id' ? 'Tampilkan password' : 'Show password')}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-center gap-2.5 text-xs leading-5 text-muted">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 shrink-0 rounded border-line accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    />
                    {language === 'id' ? 'Pertahankan sesi di perangkat ini' : 'Keep me signed in on this device'}
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    aria-busy={loading}
                    className="group flex h-11 w-full items-center justify-center gap-2 rounded-control bg-accent text-sm font-medium normal-case tracking-normal text-white transition-colors duration-150 hover:bg-accent-hover active:bg-accent-pressed disabled:cursor-not-allowed disabled:bg-panel disabled:text-muted font-sans"
                  >
                    {loading
                      ? (language === 'id' ? 'Memverifikasi…' : 'Verifying…')
                      : (language === 'id' ? 'Masuk' : 'Sign In')}
                    {!loading && <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleMfaSubmit} data-login-form="true" className="space-y-5">
                  <div className="rounded-control border border-accent/20 bg-accent/5 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-fg">
                      <ShieldCheck size={18} className="text-accent-text" />
                      {language === 'id' ? 'Verifikasi MFA diperlukan' : 'MFA verification required'}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-muted">
                      {mfaRecoveryMode
                        ? (language === 'id' ? 'Masukkan salah satu recovery code yang Anda simpan saat MFA diaktifkan. Kode yang berhasil digunakan akan langsung tidak dapat digunakan lagi.' : 'Enter one of the recovery codes saved when MFA was enabled. A successfully used code is immediately invalidated.')
                        : (language === 'id' ? 'Buka aplikasi authenticator Anda dan masukkan kode TOTP 6 digit untuk menyelesaikan login.' : 'Open your authenticator app and enter the 6-digit TOTP code to complete sign-in.')}
                    </p>
                  </div>

                  <label className="flex cursor-pointer items-center gap-2.5 text-xs leading-5 text-muted">
                    <input
                      type="checkbox"
                      checked={trustDevice}
                      onChange={(e) => setTrustDevice(e.target.checked)}
                      className="h-4 w-4 shrink-0 rounded border-line accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    />
                    {language === 'id' ? 'Percayai perangkat ini selama 30 hari' : 'Trust this device for 30 days'}
                  </label>

                  <div>
                    <label htmlFor={mfaRecoveryMode ? 'mfa-recovery-code' : 'mfa-code-1'} className="mb-1.5 block text-xs font-medium font-sans text-fg/85">
                      {mfaRecoveryMode ? 'Recovery code' : (language === 'id' ? 'Kode TOTP' : 'TOTP code')}
                    </label>
                    {mfaRecoveryMode ? (
                      <input
                        id="mfa-recovery-code"
                        type="text"
                        inputMode="text"
                        autoComplete="off"
                        maxLength={128}
                        required
                        autoFocus
                        disabled={loading}
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value.toUpperCase().slice(0, 128))}
                        className="h-11 w-full rounded-control border border-line bg-bg px-3 text-center font-mono text-sm tracking-wide text-fg placeholder:text-muted/60 transition-colors focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        placeholder="XXXX-XXXX-XXXX"
                      />
                    ) : (
                      <div className="grid grid-cols-6 gap-2" role="group" aria-label="6-digit TOTP code">
                        {Array.from({ length: 6 }, (_, index) => (
                          <input
                            key={index}
                            ref={(el) => { mfaInputRefs.current[index] = el; }}
                            type="text"
                            inputMode="numeric"
                            autoComplete={index === 0 ? 'one-time-code' : 'off'}
                            maxLength={1}
                            required
                            disabled={loading}
                            id={index === 0 ? 'mfa-code-1' : undefined}
                            value={mfaCode[index] && mfaCode[index] !== '_' ? mfaCode[index] : ''}
                            aria-label={`TOTP digit ${index + 1}`}
                            onChange={(e) => {
                              const digit = e.target.value.replace(/\D/g, '').slice(-1);
                              const next = (mfaCode || '______').padEnd(6, '_').slice(0, 6).split('');
                              next[index] = digit || '_';
                              setMfaCode(next.join(''));
                              if (digit && index < 5) mfaInputRefs.current[index + 1]?.focus();
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Backspace' && (!mfaCode[index] || mfaCode[index] === '_') && index > 0) mfaInputRefs.current[index - 1]?.focus();
                              if (e.key === 'ArrowLeft' && index > 0) mfaInputRefs.current[index - 1]?.focus();
                              if (e.key === 'ArrowRight' && index < 5) mfaInputRefs.current[index + 1]?.focus();
                            }}
                            onPaste={(e) => {
                              e.preventDefault();
                              const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                              setMfaCode(pasted);
                              requestAnimationFrame(() => mfaInputRefs.current[Math.min(pasted.length, 5)]?.focus());
                            }}
                            className="h-12 w-full rounded-control border border-line bg-bg text-center text-lg font-medium tabular-nums text-fg transition-colors focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || (mfaRecoveryMode ? mfaCode.trim().length < 12 : !/^\d{6}$/.test(mfaCode))}
                    className="group flex h-11 w-full items-center justify-center gap-2 rounded-control bg-accent text-sm font-medium normal-case tracking-normal text-white transition-colors duration-150 hover:bg-accent-hover active:bg-accent-pressed disabled:cursor-not-allowed disabled:bg-panel disabled:text-muted font-sans"
                  >
                    {loading
                      ? (language === 'id' ? 'Memverifikasi…' : 'Verifying…')
                      : (language === 'id' ? 'Verifikasi & Masuk' : 'Verify & Sign In')}
                    {!loading && <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />}
                  </button>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setMfaRecoveryMode((current) => !current);
                      setMfaCode('');
                      setErrorMessage(null);
                    }}
                    disabled={loading}
                    className="h-10 w-full"
                  >
                    {mfaRecoveryMode ? (language === 'id' ? 'Gunakan kode authenticator' : 'Use authenticator code') : (language === 'id' ? 'Gunakan recovery code' : 'Use recovery code')}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleBackToPassword}
                    disabled={loading}
                    icon={<ArrowLeft size={14} />}
                    className="h-10 w-full border border-line bg-panel"
                  >
                    {language === 'id' ? 'Kembali ke login password' : 'Back to password sign-in'}
                  </Button>
                </form>
              )}

            <p className="mt-8 text-[11px] leading-5 text-muted">
              {language === 'id' ? 'Akses khusus anggota tim Kapitech.' : 'Authorized for Kapitech team members.'}
            </p>
          </div>
        </section>

        <aside className="relative hidden h-dvh min-h-0 items-stretch justify-center overflow-hidden border-l border-line bg-bg lg:flex">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="login-bg-gradient absolute inset-0 bg-[radial-gradient(ellipse_at_58%_12%,rgba(220,20,60,0.105),transparent_43%),radial-gradient(ellipse_at_92%_88%,rgba(106,76,94,0.075),transparent_35%),linear-gradient(135deg,#0d0c11_0%,#09090c_58%,#0d0b10_100%)]" />
            <div
              className="login-grid-drift absolute inset-0 opacity-35"
              style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.024) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.024) 1px, transparent 1px)',
                backgroundSize: '64px 64px',
                maskImage: 'linear-gradient(to bottom, black 0%, transparent 88%)',
              }}
            />
            <div className="login-glow absolute -left-36 -top-28 h-[390px] w-[390px] rounded-full bg-accent/[0.075] blur-[100px]" />
            <div className="login-glow login-glow--secondary absolute -bottom-44 -right-24 h-[480px] w-[480px] rounded-full bg-white/[0.025] blur-[110px]" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-bg/35 to-transparent" />
          </div>

          <div className="relative z-10 flex h-full min-h-0 w-full flex-col px-5 py-4 sm:px-7 sm:py-5 xl:px-8 2xl:px-10">
            <div className="login-reveal login-reveal--one mx-auto flex w-full max-w-[1040px] min-h-0 flex-1 flex-col justify-center py-2">
              <div
                className="mx-auto w-full"
                style={{ width: 'min(100%, 1040px, calc((100dvh - 320px) * 1.62))' }}
              >
                <div className="login-photo-frame login-photo-sheen group relative aspect-[1.62/1] w-full overflow-hidden rounded-[18px] border border-white/[0.09] bg-panel shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
                  <img
                    key={loginSlides[artFrame].src}
                    src={loginSlides[artFrame].src}
                    alt={loginSlides[artFrame].alt}
                    className="login-photo-enter absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.015]"
                    loading={artFrame === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" aria-hidden="true" />
                  <div className="login-brand-chip absolute left-4 top-4 flex items-center gap-2.5 rounded-md border border-white/10 bg-[#09090c]/75 px-3 py-2 sm:left-5 sm:top-5">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                    <span className="text-[10px] font-medium tracking-[0.1em] text-white/90">
                      KAPITECH
                    </span>
                    <span className="h-3 w-px bg-white/20" aria-hidden="true" />
                    <span className="text-[10px] tracking-[0.08em] text-white/65">
                      INTERNAL WORKSPACE
                    </span>
                  </div>
                </div>

                <div className="login-caption-enter mt-6 flex w-full items-end justify-between gap-5 sm:mt-7 sm:gap-8">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex items-center gap-2.5">
                      <span className="h-px w-5 bg-accent" aria-hidden="true" />
                      <p className="text-[10px] font-semibold leading-4 tracking-[0.14em] text-accent-text">
                        AGENCY MANAGEMENT SYSTEM
                      </p>
                    </div>
                    <h2 className="max-w-[520px] text-[27px] font-semibold leading-[1.13] tracking-[-0.04em] text-fg xl:text-[34px]">
                      One platform for Kapitech operations
                    </h2>
                    <p className="mt-3 max-w-[520px] text-[13px] leading-[1.75] text-muted xl:text-sm">
                      Manage clients, projects, team coordination, and operational records in one workspace.
                    </p>
                  </div>

                  <div className="login-controls-enter mb-1 flex shrink-0 flex-col items-end gap-3.5">
                    <p className="font-mono text-[11px] tabular-nums tracking-[0.08em]">
                      <span className="text-fg">0{artFrame + 1}</span>
                      <span className="mx-1.5 text-muted/55">/</span>
                      <span className="text-muted">0{loginSlides.length}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="Previous image"
                        onClick={() => setArtFrame((current) => (current + loginSlides.length - 1) % loginSlides.length)}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-panel/80 text-muted transition-colors duration-200 hover:border-white/25 hover:bg-white/[0.04] hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        <ArrowLeft size={15} />
                      </button>
                      <button
                        type="button"
                        aria-label={isArtAutoplayPaused
                          ? (language === 'id' ? 'Lanjutkan rotasi gambar otomatis' : 'Resume automatic image rotation')
                          : (language === 'id' ? 'Jeda rotasi gambar otomatis' : 'Pause automatic image rotation')}
                        title={isArtAutoplayPaused
                          ? (language === 'id' ? 'Putar otomatis' : 'Resume automatic rotation')
                          : (language === 'id' ? 'Jeda otomatis' : 'Pause automatic rotation')}
                        onClick={() => setIsArtAutoplayPaused((paused) => !paused)}
                        className="flex h-10 min-w-20 items-center justify-center rounded-control border border-line bg-panel/80 px-2.5 text-[10px] font-medium text-muted transition-colors duration-200 hover:border-white/25 hover:bg-white/[0.04] hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        {isArtAutoplayPaused
                          ? (language === 'id' ? 'Lanjutkan' : 'Resume')
                          : (language === 'id' ? 'Jeda' : 'Pause')}
                      </button>
                      <button
                        type="button"
                        aria-label="Next image"
                        onClick={() => setArtFrame((current) => (current + 1) % loginSlides.length)}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-panel/80 text-muted transition-colors duration-200 hover:border-white/25 hover:bg-white/[0.04] hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        <ArrowRight size={15} />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5" aria-label="Choose featured image">
                      {loginSlides.map((slide, index) => (
                        <button
                          key={slide.src}
                          type="button"
                          aria-label={`Show image ${index + 1}`}
                          aria-current={artFrame === index ? 'true' : undefined}
                          onClick={() => setArtFrame(index)}
                          className={`h-1 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${artFrame === index ? 'w-6 bg-accent' : 'w-2.5 bg-line hover:bg-muted'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mx-auto flex w-full max-w-[1040px] items-center justify-between gap-4 border-t border-line/80 pt-3 text-[10px] leading-5 text-muted">
              <p>© 2026 Kapitech Agency. For internal use.</p>
              <p className="shrink-0 tracking-[0.08em] text-muted/70">KAPITECH AMS</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AdminLogin;
