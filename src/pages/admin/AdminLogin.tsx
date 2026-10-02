import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, KeyRound, Mail, Eye, EyeOff, AlertCircle, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/apiClient';
import { authenticateAdmin, cacheAdminSession } from '../../lib/adminAuth';
import { useLanguage } from '../../lib/LanguageContext';
import { Button } from '../../components/ui/Button';
import PatternWaves from '../../components/ui/PatternWaves';

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
      className="ams-shell relative isolate min-h-screen overflow-hidden bg-bg text-fg font-sans"
    >
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <PatternWaves
          preset="silk"
          color="#dc143c"
          backgroundColor="#170f0f"
          opacity={0.58}
          fade="edges"
          fadeSize={0.7}
          interactive
          cursorSize={50}
          cursorStrength={0.6}
          speed={0.28}
          scale={1.05}
          depth={0.72}
          shine={0.7}
          contrast={1.08}
          intro
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(9,9,12,0.16),rgba(9,9,12,0.84))]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg to-transparent" />
      </div>

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[minmax(420px,520px)_minmax(0,1fr)]">
        <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-[420px]">
            <a
              href="https://kapitech.id/"
              className="mb-4 inline-flex min-h-10 items-center gap-2 text-xs font-sans text-muted transition-colors hover:text-fg sm:mb-5"
            >
              <ArrowLeft size={14} />
              {language === 'id' ? 'Kembali ke Website' : 'Back to Website'}
            </a>

            <div className="bg-panel/92 border border-line rounded-card p-5 shadow-[0_24px_70px_-36px_rgba(0,0,0,0.85)] backdrop-blur-xl sm:p-6">
              <div className="mb-5 border-b border-line pb-5 text-left">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-control border border-accent/30 bg-accent/10 text-accent-text">
                  <Lock size={24} />
                </div>
                <h1 className="text-xl leading-7 font-semibold tracking-[-0.01em]">
                  {language === 'id' ? 'Portal Admin Internal' : 'Internal Admin Portal'}
                </h1>
                <p className="mt-1.5 max-w-[38rem] text-[13px] leading-[18px] text-muted">
                  {language === 'id'
                    ? 'Masuk untuk mengelola operasi, CRM, proyek, keuangan, dan konten Kapitech.'
                    : 'Sign in to manage Kapitech operations, CRM, projects, finance, and content.'}
                </p>
              </div>

              {mfaEnabledNotice && (
                <div className="mb-5 flex items-start gap-2 rounded-control border border-success/30 bg-success/10 p-3.5 text-xs text-success">
                  <ShieldCheck size={16} className="mt-0.5 shrink-0" />
                  <span>{language === 'id' ? 'MFA berhasil diaktifkan. Silakan login ulang untuk melanjutkan.' : 'MFA is enabled. Sign in again to continue.'}</span>
                </div>
              )}

              {errorMessage && (
                <div className="mb-5 flex items-start gap-2 rounded-control border border-danger/30 bg-danger/10 p-3.5 text-xs text-danger">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {!mfaRequired ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-sans text-muted">
                      {language === 'id' ? 'Username / Email' : 'Username / Email'}
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-accent-text" />
                      <input
                        type="text"
                        required
                        autoFocus
                        disabled={loading}
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="h-10 min-h-10 w-full rounded-control border border-line bg-bg pl-10 pr-4 text-sm text-fg focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent font-sans"
                        placeholder="admin atau email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-sans text-muted">
                      Password
                    </label>
                    <div className="relative">
                      <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-accent-text" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        disabled={loading}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-10 min-h-10 w-full rounded-control border border-line bg-panel pl-10 pr-10 text-sm text-fg focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent font-sans"
                        placeholder="••••••••"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute right-1.5 top-1/2 h-8 min-h-8 w-8 min-w-8 -translate-y-1/2 p-0"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="accent-accent"
                    />
                    {language === 'id' ? 'Pertahankan sesi di perangkat ini' : 'Keep this session on this device'}
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-10 min-h-10 w-full items-center justify-center gap-2 rounded-control bg-accent text-xs font-medium normal-case tracking-normal text-white transition-colors hover:bg-accent disabled:bg-panel disabled:text-muted font-sans"
                  >
                    {loading
                      ? (language === 'id' ? 'Memverifikasi…' : 'Verifying…')
                      : (language === 'id' ? 'Masuk' : 'Sign In')}
                    {!loading && <ArrowRight size={14} />}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleMfaSubmit} className="space-y-5">
                  <div className="rounded-control border border-warning/30 bg-warning/10 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-fg">
                      <ShieldCheck size={18} className="text-warning" />
                      {language === 'id' ? 'Verifikasi MFA diperlukan' : 'MFA verification required'}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-muted">
                      {mfaRecoveryMode
                        ? (language === 'id' ? 'Masukkan salah satu recovery code yang Anda simpan saat MFA diaktifkan. Kode yang berhasil digunakan akan langsung tidak dapat digunakan lagi.' : 'Enter one of the recovery codes saved when MFA was enabled. A successfully used code is immediately invalidated.')
                        : (language === 'id' ? 'Buka aplikasi authenticator Anda dan masukkan kode TOTP 6 digit untuk menyelesaikan login.' : 'Open your authenticator app and enter the 6-digit TOTP code to complete sign-in.')}
                    </p>
                  </div>

                  <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
                    <input
                      type="checkbox"
                      checked={trustDevice}
                      onChange={(e) => setTrustDevice(e.target.checked)}
                      className="accent-accent"
                    />
                    {language === 'id' ? 'Percayai perangkat ini selama 30 hari' : 'Trust this device for 30 days'}
                  </label>

                  <div>
                    <label className="mb-1.5 block text-xs font-sans text-muted">
                      {mfaRecoveryMode ? 'Recovery code' : (language === 'id' ? 'Kode TOTP' : 'TOTP code')}
                    </label>
                    {mfaRecoveryMode ? (
                      <input
                        type="text"
                        inputMode="text"
                        autoComplete="off"
                        maxLength={128}
                        required
                        autoFocus
                        disabled={loading}
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value.toUpperCase().slice(0, 128))}
                        className="h-9 w-full rounded-control border border-line bg-panel px-3 text-center text-sm text-fg font-sans focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
                            value={mfaCode[index] || ''}
                            aria-label={`TOTP digit ${index + 1}`}
                            onChange={(e) => {
                              const digit = e.target.value.replace(/\D/g, '').slice(-1);
                              const next = mfaCode.split('');
                              next[index] = digit;
                              setMfaCode(next.join('').slice(0, 6));
                              if (digit && index < 5) mfaInputRefs.current[index + 1]?.focus();
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Backspace' && !mfaCode[index] && index > 0) mfaInputRefs.current[index - 1]?.focus();
                            }}
                            onPaste={(e) => {
                              e.preventDefault();
                              const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                              setMfaCode(pasted);
                              requestAnimationFrame(() => mfaInputRefs.current[Math.min(pasted.length, 5)]?.focus());
                            }}
                            className="h-11 w-full rounded-control border border-line bg-panel text-center text-lg font-medium tabular-nums text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || (mfaRecoveryMode ? mfaCode.trim().length < 12 : mfaCode.length !== 6)}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-control bg-accent text-xs font-medium normal-case tracking-normal text-white transition-colors hover:bg-accent disabled:bg-panel disabled:text-muted font-sans"
                  >
                    {loading
                      ? (language === 'id' ? 'Memverifikasi…' : 'Verifying…')
                      : (language === 'id' ? 'Verifikasi & Masuk' : 'Verify & Sign In')}
                    {!loading && <ArrowRight size={14} />}
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

        <aside className="relative hidden min-h-screen items-center justify-center overflow-hidden border-l border-white/[0.08] bg-[#09090c]/24 px-8 lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_50%,rgba(220,20,60,0.18),transparent_30%),radial-gradient(circle_at_72%_32%,rgba(255,255,255,0.035),transparent_24%)]" />
          <div className="relative z-10 flex max-w-lg flex-col items-center text-center">
            <img
              src="https://raw.githubusercontent.com/Kapitech-Agency/Kapitech-Agency.github.io/main/public/white.png"
              alt="Kapitech Agency"
              className="mb-8 h-auto w-[220px] max-w-[62%] object-contain opacity-95 drop-shadow-[0_18px_48px_rgba(0,0,0,0.45)] xl:w-[280px]"
              loading="eager"
              decoding="async"
            />
            <div className="h-px w-16 bg-accent/70" aria-hidden="true" />
            <p className="mt-6 max-w-md text-sm leading-7 text-white/58">
              {language === 'id'
                ? 'Digital product design, development, dan visual experience untuk bisnis yang ingin bergerak lebih jauh.'
                : 'Digital product design, development, and visual experiences for businesses ready to move further.'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AdminLogin;
