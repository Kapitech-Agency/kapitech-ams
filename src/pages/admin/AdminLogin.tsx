import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, KeyRound, Mail, Eye, EyeOff, AlertCircle, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/apiClient';
import { authenticateAdmin, cacheAdminSession } from '../../lib/adminAuth';
import { useLanguage } from '../../lib/LanguageContext';

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
      const result = await api.auth.mfaVerify(normalizedCode);
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
    <div data-kapi-admin="true" className="ams-shell min-h-screen bg-bg text-fg flex items-center justify-center px-4 py-6 sm:px-6 sm:py-10 font-sans">
      <div className="w-full max-w-[420px]">
        <a
          href="https://kapitech.id/"
          className="inline-flex items-center gap-2 min-h-10 text-xs font-sans text-muted hover:text-fg mb-4 sm:mb-5"
        >
          <ArrowLeft size={14} />
          {language === 'id' ? 'Kembali ke Website' : 'Back to Website'}
        </a>

        <div className="bg-panel border border-line rounded-card p-5 sm:p-6">
          <div className="text-left mb-5 pb-5 border-b border-line">
            <div className="w-10 h-10 rounded-control bg-accent/10 border border-accent/30 flex items-center justify-center text-accent-text mb-4">
              <Lock size={24} />
            </div>
            <h1 className="text-xl leading-7 font-semibold tracking-[-0.01em]">
              {language === 'id' ? 'Portal Admin Internal' : 'Internal Admin Portal'}
            </h1>
            <p className="text-[13px] leading-[18px] text-muted mt-1.5 max-w-[38rem]">
              {language === 'id'
                ? 'Masuk untuk mengelola operasi, CRM, proyek, keuangan, dan konten Kapitech.'
                : 'Sign in to manage Kapitech operations, CRM, projects, finance, and content.'}
            </p>
          </div>

          {mfaEnabledNotice && (
            <div className="mb-5 p-3.5 rounded-control bg-success/10 border border-success/30 text-success text-xs flex items-start gap-2">
              <ShieldCheck size={16} className="shrink-0 mt-0.5" />
              <span>{language === 'id' ? 'MFA berhasil diaktifkan. Silakan login ulang untuk melanjutkan.' : 'MFA is enabled. Sign in again to continue.'}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-control bg-danger/10 border border-danger/30 text-danger text-xs flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!mfaRequired ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-sans text-muted mb-1.5">
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
                  className="w-full pl-10 pr-4 h-10 min-h-10 bg-bg border border-line rounded-control text-sm text-fg focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent focus:border-accent font-sans"
                  placeholder="admin atau email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1.5">
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
                  className="w-full pl-10 pr-10 h-10 min-h-10 bg-panel border border-line rounded-control text-sm text-fg focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent focus:border-accent font-sans"
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-10 min-w-10 sm:min-h-9 sm:min-w-9 flex items-center justify-center rounded-control text-muted hover:text-fg"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
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
              className="w-full min-h-10 h-10 rounded-control bg-accent hover:bg-accent disabled:bg-panel text-white disabled:text-muted text-xs font-medium font-sans normal-case tracking-normal flex items-center justify-center gap-2 transition-colors"
            >
              {loading
                ? (language === 'id' ? 'Memverifikasiâ€¦' : 'Verifyingâ€¦')
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

            <div>
              <label className="block text-xs font-sans text-muted mb-1.5">
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
                  className="w-full h-9 px-3 rounded-control bg-panel border border-line text-center text-sm text-fg font-sans focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
                      autoComplete={index === 0 ? "one-time-code" : "off"}
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
              )}           </div>

            <button
              type="submit"
              disabled={loading || (mfaRecoveryMode ? mfaCode.trim().length < 12 : mfaCode.length !== 6)}
              className="w-full h-11 rounded-control bg-accent hover:bg-accent disabled:bg-panel text-white disabled:text-muted text-xs font-medium font-sans normal-case tracking-normal flex items-center justify-center gap-2 transition-colors"
            >
              {loading
                ? (language === 'id' ? 'Memverifikasiâ€¦' : 'Verifyingâ€¦')
                : (language === 'id' ? 'Verifikasi & Masuk' : 'Verify & Sign In')}
              {!loading && <ArrowRight size={14} />}
            </button>

            <button
              type="button"
              onClick={() => {
                setMfaRecoveryMode((current) => !current);
                setMfaCode('');
                setErrorMessage(null);
              }}
              disabled={loading}
              className="w-full h-10 rounded-control bg-transparent border border-line text-muted hover:text-fg text-xs font-sans font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {mfaRecoveryMode ? (language === 'id' ? 'Gunakan kode authenticator' : 'Use authenticator code') : (language === 'id' ? 'Gunakan recovery code' : 'Use recovery code')}
            </button>

            <button
              type="button"
              onClick={handleBackToPassword}
              disabled={loading}
              className="w-full h-10 rounded-control bg-panel text-muted hover:text-fg text-xs font-sans font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft size={14} />
              {language === 'id' ? 'Kembali ke login password' : 'Back to password sign-in'}
            </button>
          </form>
          )}

          <p className="mt-5 pt-4 border-t border-line text-xs text-muted font-sans text-center">
            {language === 'id'
              ? 'Sesi diverifikasi oleh server.'
              : 'Session is verified by the server.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
