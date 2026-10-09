import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, KeyRound, Mail, Eye, EyeOff, AlertCircle, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/apiClient';
import { authenticateAdmin, cacheAdminSession } from '../../lib/adminAuth';
import { useLanguage } from '../../lib/LanguageContext';
import { Button } from '../../components/ui/Button';

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
      className="ams-shell relative isolate min-h-screen overflow-hidden bg-bg text-fg font-sans"
    >
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_12%_10%,rgba(220,20,60,0.055),transparent_34%),radial-gradient(ellipse_at_85%_100%,rgba(243,243,246,0.025),transparent_32%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-line to-transparent" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1440px] px-5 sm:px-8 lg:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)] lg:px-12 xl:px-16">
        <section className="flex min-h-screen items-center justify-center py-8 sm:py-10 lg:pr-10 xl:pr-16">
          <div className="w-full max-w-[420px]">
            <div className="mb-7 flex items-center gap-3 lg:hidden">
              <img
                src="https://raw.githubusercontent.com/Kapitech-Agency/Kapitech-Agency.github.io/main/public/white.png"
                alt="Kapitech Agency"
                className="h-7 w-auto max-w-[120px] object-contain"
                loading="eager"
                decoding="async"
              />
              <span className="border-l border-line pl-3 text-xs text-muted">AMS workspace</span>
            </div>
            <a
              href="https://kapitech.id/"
              className="mb-4 inline-flex min-h-9 items-center gap-2 text-xs font-sans text-muted transition-colors hover:text-fg sm:mb-5"
            >
              <ArrowLeft size={14} />
              {language === 'id' ? 'Kembali ke Website' : 'Back to Website'}
            </a>

            <div className="rounded-card border border-line bg-panel p-5 sm:p-7">
              <div className="mb-6 border-b border-line pb-6 text-left">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-control border border-accent/25 bg-accent/10 text-accent-text">
                  {mfaRequired ? <ShieldCheck size={21} /> : <Lock size={21} />}
                </div>
                <p className="mb-2 text-[11px] font-medium tracking-[0.08em] text-accent-text">
                  {language === 'id' ? 'KAPITECH · RUANG KERJA INTERNAL' : 'KAPITECH · INTERNAL WORKSPACE'}
                </p>
                <h1 className="text-[24px] leading-8 font-semibold tracking-[-0.035em] sm:text-[26px]">
                  {mfaRequired
                    ? (language === 'id' ? 'Verifikasi identitas Anda' : 'Verify your identity')
                    : (language === 'id' ? 'Selamat datang kembali' : 'Welcome back')}
                </h1>
                <p className="mt-2 max-w-[34rem] text-[13px] leading-5 text-muted">
                  {mfaRequired
                    ? (language === 'id' ? 'Selesaikan langkah keamanan untuk masuk ke workspace Anda.' : 'Complete this security step to access your workspace.')
                    : (language === 'id' ? 'Masuk untuk melanjutkan pekerjaan dan mengakses workspace Kapitech.' : 'Sign in to continue your work and access the Kapitech workspace.')}
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
                <form onSubmit={handleSubmit} className="space-y-4">
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
                <form onSubmit={handleMfaSubmit} className="space-y-5">
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

              <p className="mt-5 border-t border-line pt-4 text-center text-xs text-muted font-sans">
                {language === 'id'
                  ? 'Sesi diverifikasi oleh server.'
                  : 'Session is verified by the server.'}
              </p>
            </div>
          </div>
        </section>

        <aside className="relative hidden min-h-screen items-stretch justify-center overflow-hidden border-l border-line bg-bg lg:flex">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_72%_28%,rgba(220,20,60,0.075),transparent_42%)]"
            aria-hidden="true"
          />
          <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[600px] flex-col items-center px-8 py-8 xl:px-12 xl:py-10">
            <div className="flex w-full justify-start">
            <img
              src="https://raw.githubusercontent.com/Kapitech-Agency/Kapitech-Agency.github.io/main/public/white.png"
              alt="Kapitech Agency"
              className="mb-10 h-auto w-[174px] object-contain opacity-95 xl:w-[190px]"
              loading="eager"
              decoding="async"
            />
            </div>

            <div className="my-auto flex w-full flex-col items-center py-8">
              <div className="relative w-full max-w-[350px]">
                <div className="pointer-events-none absolute -inset-5 rounded-[36px] bg-[radial-gradient(ellipse_at_center,rgba(220,20,60,0.10),transparent_68%)]" aria-hidden="true" />
                <div className="relative aspect-square overflow-hidden rounded-[28px] border border-line bg-panel p-3 sm:p-4">
                  <svg
                    viewBox="0 0 420 420"
                    role="img"
                    aria-label="Abstract Kapitech AMS grid illustration"
                    className="h-full w-full"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient id="ams-login-art-background" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#17171f" />
                        <stop offset="58%" stopColor="#111116" />
                        <stop offset="100%" stopColor="#190d12" />
                      </linearGradient>
                      <radialGradient id="ams-login-art-glow" cx="50%" cy="48%" r="60%">
                        <stop offset="0%" stopColor="#dc143c" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#dc143c" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                    <rect x="1" y="1" width="418" height="418" rx="22" fill="url(#ams-login-art-background)" />
                    <rect x="1" y="1" width="418" height="418" rx="22" fill="url(#ams-login-art-glow)" />
                    <path d="M28 105H392M28 210H392M28 315H392M105 28V392M210 28V392M315 28V392" stroke="#f3f3f6" strokeOpacity="0.035" />
                    {Array.from({ length: 81 }, (_, index) => {
                      const col = index % 9;
                      const row = Math.floor(index / 9);
                      const wave = (Math.sin(col * 0.82 + row * 0.48) + Math.cos(row * 0.72 - col * 0.26) + 2) / 4;
                      const distance = Math.sqrt((col - 4) ** 2 + (row - 4) ** 2);
                      const emphasis = Math.max(0, 1 - distance / 6) * wave;
                      const fill = emphasis > 0.65 ? '#dc143c' : emphasis > 0.43 ? '#5c0819' : emphasis > 0.28 ? '#30202a' : '#24242d';
                      const opacity = Math.min(0.94, 0.38 + wave * 0.5 + emphasis * 0.12);
                      return (
                        <rect
                          key={index}
                          x={37 + col * 39}
                          y={37 + row * 39}
                          width={29 + wave * 3}
                          height={29 + wave * 3}
                          rx={7 + wave * 2}
                          fill={fill}
                          fillOpacity={opacity}
                          stroke="#f3f3f6"
                          strokeOpacity="0.04"
                        />
                      );
                    })}
                    <rect x="146" y="146" width="128" height="128" rx="24" fill="#0f0f14" fillOpacity="0.76" stroke="#ff4d6d" strokeOpacity="0.5" />
                    <path d="M175 213h17l13-24 22 49 17-34h13" fill="none" stroke="#ff4d6d" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              <div className="mt-8 w-full max-w-[420px]">
                <p className="text-[11px] font-medium leading-4 tracking-[0.08em] text-accent-text">
                  AGENCY MANAGEMENT SYSTEM
                </p>
                <h2 className="mt-3 max-w-[410px] text-[30px] font-semibold leading-[1.14] tracking-[-0.035em] text-fg xl:text-[36px]">
                  One platform for Kapitech operations
                </h2>
                <p className="mt-3 max-w-[390px] text-[13px] leading-6 text-muted xl:text-sm">
                  Manage clients, projects, team coordination, and operational records in one workspace.
                </p>
              </div>
            </div>

            <p className="w-full border-t border-line pt-4 text-[11px] leading-5 text-muted">
              © 2026 Kapitech Agency. For internal use.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AdminLogin;
