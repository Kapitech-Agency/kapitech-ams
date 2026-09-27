import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Modal } from '../../components/ui/Modal';
import { 
  Settings, 
  ShieldCheck, 
  Check, 
  AlertCircle, 
  Save, 
  Trash2, 
  Download, 
  Lock, 
  Clock3,
  RefreshCw,
  UserCheck,
  Palette,
  Layers,
  Database,
  Smartphone,
  UserPlus,
  X,
  Key,
  Edit3,
  Shield,
  Briefcase,
  Terminal,
  Users
} from 'lucide-react';
import { 
  getAdminSession, 
  updateAdminCredentials, 
  fetchServerAuditLogs,
  SecurityAuditLog,
  getStoredAdminCredentials,
  AdminAccount,
  AdminTier,
  fetchAdminAccounts,
  createAdminAccount,
  deleteAdminAccount,
} from '../../lib/adminAuth';
import { SiteMetaSettings } from '../../lib/cmsStore';
import { useLanguage } from '../../lib/LanguageContext';
import { api } from '../../lib/apiClient';
import { ProductionReadinessCard } from '../../components/admin/ProductionReadinessCard';
import Button from '../../components/ui/Button';

export const AdminSettings: React.FC = () => {
  const { language, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const session = getAdminSession();
  const storedCreds = getStoredAdminCredentials() ?? {
    username: '',
    email: '',
    displayName: '',
    role: 'Unknown',
    division: 'Operations',
    mfaEnabled: false
  };
  const canAccessServer = session?.user?.stakeholderType === 'Master' || Boolean(session?.user?.permissions?.canAccessServerAndApi);
  const canManageAdminAccounts = session?.user?.stakeholderType === 'Master' || Boolean(session?.user?.permissions?.canManageAdminAccounts);
  const canViewAuditLogs = session?.user?.stakeholderType === 'Master' || Boolean(session?.user?.permissions?.canViewSecurityAuditLogs);

  // Tab: profile, branding, rbac, security, api, audit
  const paramTab = searchParams.get('tab');
  const initialTab = (
    paramTab === 'team' || paramTab === 'rbac' ? 'rbac' :
    paramTab === 'audit' ? 'audit' :
    paramTab === 'system' || paramTab === 'branding' ? 'branding' :
    paramTab === 'security' ? 'security' :
    paramTab === 'api' ? 'api' : 'profile'
  ) as 'profile' | 'branding' | 'rbac' | 'security' | 'api' | 'audit';

  const [activeTab, setActiveTab] = useState<'profile' | 'branding' | 'rbac' | 'security' | 'api' | 'audit'>(initialTab);
  const isCurrentMaster = session?.user?.stakeholderType === 'Master' || session?.user?.username === 'admin';

  const handleTabChange = (tab: 'profile' | 'branding' | 'rbac' | 'security' | 'api' | 'audit') => {
    if (tab === 'rbac' && !canManageAdminAccounts) return;
    if (tab === 'api' && !canAccessServer) return;
    if (tab === 'audit' && !canViewAuditLogs) return;
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    const requestedTab =
      paramTab === 'team' || paramTab === 'rbac' ? 'rbac' :
      paramTab === 'audit' ? 'audit' :
      paramTab === 'system' || paramTab === 'branding' ? 'branding' :
      paramTab === 'security' ? 'security' :
      paramTab === 'api' ? 'api' :
      'profile';

    const allowed =
      requestedTab !== 'rbac' || canManageAdminAccounts
        ? requestedTab === 'api'
          ? canAccessServer ? requestedTab : 'profile'
          : requestedTab === 'audit'
            ? canViewAuditLogs ? requestedTab : 'profile'
            : requestedTab
        : 'profile';

    if (activeTab !== allowed) setActiveTab(allowed);
    if (paramTab && allowed !== requestedTab) setSearchParams({ tab: allowed }, { replace: true });
  }, [paramTab, canManageAdminAccounts, canAccessServer, canViewAuditLogs, activeTab, setSearchParams]);

  // Security Credentials state
  const [username, setUsername] = useState(storedCreds.username);
  const [email, setEmail] = useState(storedCreds.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityStatus, setSecurityStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [securityLoading, setSecurityLoading] = useState(false);

  // Security / MFA state
  const mfaActive = storedCreds.mfaEnabled === true;

  // Meta & Branding Settings state
  const [metaSettings, setMetaSettings] = useState<SiteMetaSettings>({
    siteTitle: '', siteDescription: '', contactReceiverEmail: '', defaultLanguage: language, enableLiveChat: false, enableSoundAlerts: false, maintenanceMode: false
  });
  const [metaStatus, setMetaStatus] = useState<string | null>(null);

  // Audit Logs state
  const [logs, setLogs] = useState<SecurityAuditLog[]>([]);
  const [backupRetentionDays, setBackupRetentionDays] = useState(14);

  // Accounts Management state (Stakeholder Executive & Teknisi IT)
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'account'; id?: string; name?: string } | null>(null);
  const [accountActionMessage, setAccountActionMessage] = useState<{ success: boolean; message: string } | null>(null);

  // New Account Form State
  const [newAccName, setNewAccName] = useState('');
  const [newAccUsername, setNewAccUsername] = useState('');
  const [newAccEmail, setNewAccEmail] = useState('');
  const [newAccPassword, setNewAccPassword] = useState('');
  const [newAccRole, setNewAccRole] = useState<AdminTier>('Stakeholder Executive');
  const [newAccDivision, setNewAccDivision] = useState<'Management' | 'Engineering' | 'Design' | 'Finance' | 'Operations'>('Management');

  useEffect(() => {
    let mounted = true;
    if (activeTab === 'audit' && canViewAuditLogs) {
      void fetchServerAuditLogs().then((next) => { if (mounted) setLogs(next); });
    }
    if (activeTab === 'rbac' && canManageAdminAccounts) {
      void fetchAdminAccounts().then((next) => { if (mounted) setAccounts(next); });
    }
    if (activeTab === 'branding') {
      void api.cms.getSettings().then((res) => {
        if (mounted && res.success && res.data?.settings) setMetaSettings(res.data.settings as SiteMetaSettings);
      });
    }
    return () => { mounted = false; };
  }, [activeTab, canViewAuditLogs, canManageAdminAccounts]);

  useEffect(() => {
    if (!canAccessServer || activeTab !== 'api') return;
    let mounted = true;
    void api.system.getBackups().then((res) => {
      if (!mounted || !res.data) return;
      const retention = res.data.retention ?? res.data.retentionDays ?? 14;
      setBackupRetentionDays(Number(retention) || 14);
    }).catch(() => {
      if (mounted) setBackupRetentionDays(14);
    });
    return () => { mounted = false; };
  }, [activeTab, canAccessServer]);

  const refreshAccounts = async () => {
    const next = await fetchAdminAccounts();
    setAccounts(next);
  };

  const handleOpenAddAccount = () => {
    setNewAccName('');
    setNewAccUsername('');
    setNewAccEmail('');
    setNewAccPassword('Kapi_' + crypto.randomUUID().replace(/-/g, ''));
    setNewAccRole('Stakeholder Executive');
    setNewAccDivision('Management');
    setAccountActionMessage(null);
    setIsAddAccountModalOpen(true);
  };

  const handleRoleChangeForNewAccount = (role: AdminTier) => {
    setNewAccRole(role);
    if (role === 'Teknisi IT / Systems Engineer' || role.includes('Internal IT')) {
      setNewAccDivision('Engineering');
    } else if (role === 'Stakeholder Executive' || role.includes('Top Management')) {
      setNewAccDivision('Management');
    }
  };

  const handleCreateAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountActionMessage(null);

    if (newAccPassword.length < 12) {
      setAccountActionMessage({
        success: false,
        message: language === 'id' ? 'Password sementara harus 12 sampai 128 karakter.' : 'Temporary password must be 12 to 128 characters.'
      });
      return;
    }

    const res = await createAdminAccount({
      name: newAccName,
      username: newAccUsername,
      email: newAccEmail,
      passwordPlain: newAccPassword,
      role: newAccRole,
      division: newAccDivision
    });

    if (res.success) {
      await refreshAccounts();
      setAccountActionMessage({
        success: true,
        message: language === 'id' 
          ? `Akun baru "${newAccName}" (${newAccRole}) berhasil dibuat & disimpan secara terenkripsi!` 
          : `New account "${newAccName}" (${newAccRole}) created & securely stored!`
      });
      setIsAddAccountModalOpen(false);
      setTimeout(() => setAccountActionMessage(null), 5000);
    } else {
      setAccountActionMessage({
        success: false,
        message: res.error || 'Gagal membuat akun.'
      });
    }
  };

  const handleDeleteAccountClick = (id: string, name: string) => {
    setConfirmAction({ type: 'account', id, name });
  };

  const confirmDeleteAccount = async (id: string, name: string) => {
    const res = await deleteAdminAccount(id);
    if (res.success) {
      await refreshAccounts();
      setAccountActionMessage({ success: true, message: language === 'id' ? `Akun "${name}" berhasil dihapus.` : `Account "${name}" deleted.` });
      setTimeout(() => setAccountActionMessage(null), 4000);
    } else {
      setAccountActionMessage({ success: false, message: res.error || (language === 'id' ? 'Gagal menghapus akun.' : 'Failed to delete account.') });
    }
    setConfirmAction(null);
  };


  // Handle credentials update
  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityStatus(null);

    if (!currentPassword) {
      setSecurityStatus({ 
        success: false, 
        message: language === 'id' 
          ? 'Password saat ini wajib diisi untuk verifikasi keamanan.' 
          : 'Current password is required for security verification.' 
      });
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setSecurityStatus({ 
        success: false, 
        message: language === 'id' 
          ? 'Konfirmasi password baru tidak cocok.' 
          : 'New password confirmation does not match.' 
      });
      return;
    }

    if (newPassword && newPassword.length < 8) {
      setSecurityStatus({ 
        success: false, 
        message: language === 'id' 
          ? 'Password baru minimal 8 karakter.' 
          : 'New password must be at least 8 characters long.' 
      });
      return;
    }

    setSecurityLoading(true);

    try {
      const res = await updateAdminCredentials(currentPassword, {
        newPassword: newPassword || undefined
      });

      if (res.success) {
        setSecurityStatus({ 
          success: true, 
          message: language === 'id'
            ? (newPassword ? 'Password admin berhasil diperbarui.' : 'Tidak ada perubahan password yang disimpan.')
            : (newPassword ? 'Admin password updated successfully.' : 'No password change was saved.') 
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setSecurityStatus({ 
          success: false, 
          message: res.error || (language === 'id' ? 'Gagal memperbarui kredensial.' : 'Failed to update credentials.') 
        });
      }
    } catch (err: any) {
      setSecurityStatus({ 
        success: false, 
        message: err.message || (language === 'id' ? 'Terjadi kesalahan sistem.' : 'A system error occurred.') 
      });
    } finally {
      setSecurityLoading(false);
    }
  };

  // Handle Meta Settings save
  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.cms.updateSettings(metaSettings);
    if (!res.success) {
      setMetaStatus(res.error || (language === 'id' ? 'Gagal menyimpan pengaturan.' : 'Failed to save settings.'));
      return;
    }
    setMetaStatus(
      language === 'id' 
        ? 'Pengaturan sistem dan metadata website berhasil disimpan!' 
        : 'System settings and site metadata successfully saved!'
    );
    setTimeout(() => setMetaStatus(null), 3000);
  };

  const handleExportLogs = () => {
    if (logs.length === 0) return;
    const jsonStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kapitech_security_audit_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="ams-page-header flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        <div>
          <h1 className="ams-page-title">
            <Settings className="text-accent-text shrink-0" size={22} />
            <span>{language === 'id' ? 'Pengaturan Sistem & Keamanan' : 'Settings'}</span>
          </h1>
          <p className="text-xs text-muted mt-1 font-sans">
            {language === 'id'
              ? 'Konfigurasi akun master admin, hak akses RBAC, integrasi API, dan log audit keamanan terenkripsi.'
              : 'Configure master admin identity, 4-tier RBAC access matrix, API cloud integrations, and encrypted audit trail.'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-2 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => handleTabChange('profile')}
          className={`px-4 py-2.5 rounded-control text-xs font-sans transition-all flex items-center gap-2 shrink-0 min-h-10 ${
            activeTab === 'profile'
              ? 'bg-accent text-white font-semibold '
              : 'text-muted hover:text-fg hover:bg-panel'
          }`}
        >
          <UserCheck size={15} />
          <span>{language === 'id' ? 'Profil & Akun Master' : 'Profile & Master Account'}</span>
        </button>

        <button
          onClick={() => handleTabChange('branding')}
          className={`px-4 py-2.5 rounded-control text-xs font-sans transition-all flex items-center gap-2 shrink-0 min-h-10 ${
            activeTab === 'branding'
              ? 'bg-accent text-white font-semibold '
              : 'text-muted hover:text-fg hover:bg-panel'
          }`}
        >
          <Palette size={15} />
          <span>{language === 'id' ? 'Brand & SEO' : 'Brand & SEO'}</span>
        </button>

        <button
          onClick={() => handleTabChange('rbac')}
           disabled={!canManageAdminAccounts}
          className={`px-4 py-2.5 rounded-control text-xs font-sans transition-all flex items-center gap-2 shrink-0 min-h-10 ${
            activeTab === 'rbac'
              ? 'bg-accent text-white font-semibold '
              : 'text-muted hover:text-fg hover:bg-panel'
          }`}
        >
          <Layers size={15} />
          <span>{language === 'id' ? 'Matriks Hak Akses (RBAC)' : 'RBAC Matrix'}</span>
        </button>

        <button
          onClick={() => handleTabChange('security')}
          className={`px-4 py-2.5 rounded-control text-xs font-sans transition-all flex items-center gap-2 shrink-0 min-h-10 ${
            activeTab === 'security'
              ? 'bg-accent text-white font-semibold '
              : 'text-muted hover:text-fg hover:bg-panel'
          }`}
        >
          <Lock size={15} />
          <span>{language === 'id' ? 'Keamanan & MFA' : 'Security & MFA'}</span>
        </button>

        <button
          onClick={() => handleTabChange('api')}
           disabled={!canAccessServer}
          className={`px-4 py-2.5 rounded-control text-xs font-sans transition-all flex items-center gap-2 shrink-0 min-h-10 ${
            activeTab === 'api'
              ? 'bg-accent text-white font-semibold '
              : 'text-muted hover:text-fg hover:bg-panel'
          }`}
        >
          <Database size={15} />
          <span>{language === 'id' ? 'API & Cloud' : 'API & Cloud'}</span>
        </button>

        <button
          onClick={() => handleTabChange('audit')}
           disabled={!canViewAuditLogs}
          className={`px-4 py-2.5 rounded-control text-xs font-sans transition-all flex items-center gap-2 shrink-0 min-h-10 ${
            activeTab === 'audit'
              ? 'bg-accent text-white font-semibold '
              : 'text-muted hover:text-fg hover:bg-panel'
          }`}
        >
          <ShieldCheck size={15} />
          <span>{language === 'id' ? `Riwayat Audit (${logs.length})` : `Audit Trail (${logs.length})`}</span>
        </button>
      </div>

      {/* TAB 1: PROFILE & MASTER ACCOUNT */}
      {activeTab === 'profile' && (
        <div className="w-full bg-panel border border-line rounded-card p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-line">
            <div className="w-10 h-10 rounded-card bg-accent/10 border border-accent/30 flex items-center justify-center text-accent shrink-0">
              <UserCheck size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold font-sans text-fg">
                {language === 'id' ? 'Profil & Identitas Master' : 'Master Profile & Identity'}
              </h2>
              <p className="text-xs text-muted font-sans">
                {language === 'id' 
                  ? 'Konfigurasi identitas login pengelola sistem dan kredensial utama.' 
                  : 'Configure system administrator login identity and primary credentials.'}
              </p>
            </div>
          </div>

          {securityStatus && (
            <div className={`mb-6 p-4 rounded-card text-xs font-sans flex items-start gap-2.5 ${
              securityStatus.success 
                ? 'bg-success/10 border border-success/30 text-success' 
                : 'bg-danger/10 border border-danger/30 text-danger'
            }`}>
              {securityStatus.success ? <Check size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
              <span>{securityStatus.message}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-sans text-muted mb-1 font-semibold">
                  {language === 'id' ? 'Nama Pengguna (Username)' : 'Username'}
                </label>
                <input
                  type="text"
                  value={username}
                  readOnly
                  aria-readonly="true"
                  className="w-full min-h-10 rounded-control border border-line bg-bg px-3 text-xs text-muted cursor-default font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-muted mb-1 font-semibold">
                  {language === 'id' ? 'Email Notifikasi' : 'Notification Email'}
                </label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  aria-readonly="true"
                  className="w-full min-h-10 rounded-control border border-line bg-bg px-3 text-xs text-muted cursor-default font-sans"
                />
              </div>
            </div>

            <div className="p-4 bg-panel border border-line rounded-card space-y-2">
              <div className="flex items-center justify-between text-xs font-sans">
                <span className="text-muted">{language === 'id' ? 'Tingkat Akses (Role Tier):' : 'Role Tier Level:'}</span>
                <span className="text-accent font-semibold">{session?.user.role || storedCreds.role}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-sans">
                <span className="text-muted">{language === 'id' ? 'Divisi Agensi:' : 'Agency Division:'}</span>
                <span className="text-fg font-semibold">{storedCreds.division || 'Management'}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-sans">
                <span className="text-muted">{language === 'id' ? 'Terakhir Login:' : 'Last Login:'}</span>
                <span className="text-muted">{new Date(session?.user.lastLogin || Date.now()).toLocaleString()}</span>
              </div>
            </div>

            <div className="rounded-card border border-line bg-bg p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-accent-text" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-fg">Server-managed credentials</p>
                  <p className="mt-1 text-[11px] leading-5 text-muted">
                    {language === 'id'
                      ? 'Username dan email akun Master dikelola oleh server. Perubahan password dilakukan melalui tab Security & MFA.'
                      : 'Master username and email are server-managed. Change the password from the Security & MFA tab.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BRAND IDENTITY & SEO */}
      {activeTab === 'branding' && (
        <div className="w-full max-w-4xl bg-panel border border-line rounded-card p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-line">
            <div className="w-10 h-10 rounded-card bg-series-3/10 border border-series-3/30 flex items-center justify-center text-series-3 shrink-0">
              <Palette size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold font-sans text-fg">
                {language === 'id' ? 'Identitas Brand, Metadata & Notifikasi' : 'Brand Identity, Metadata & Notification Rules'}
              </h2>
              <p className="text-xs text-muted font-sans">
                {language === 'id'
                  ? 'Konfigurasi representasi visual dan aturan SEO global untuk kapitech.id dan ams.kapitech.id.'
                  : 'Configure visual branding, search meta tags, and global agency settings for kapitech.id.'}
              </p>
            </div>
          </div>

          {metaStatus && (
            <div className="mb-6 p-4 rounded-card text-xs font-sans flex items-start gap-2.5 bg-success/10 border border-success/30 text-success">
              <Check size={16} className="shrink-0 mt-0.5" />
              <span>{metaStatus}</span>
            </div>
          )}

          <form onSubmit={handleSaveMeta} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-sans text-muted mb-1 font-semibold">
                  {language === 'id' ? 'Nama Agensi Global' : 'Global Agency Name'}
                </label>
                <input
                  type="text"
                  value={metaSettings.agencyName}
                  onChange={(e) => setMetaSettings({ ...metaSettings, agencyName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-panel border border-line rounded-control text-xs text-fg focus:outline-none focus:border-accent font-sans min-h-10"
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-muted mb-1 font-semibold">
                  {language === 'id' ? 'Domain Publik' : 'Public Domain'}
                </label>
                <input
                  type="text"
                  value="https://kapitech.id"
                  disabled
                  className="w-full px-3.5 py-2.5 bg-panel/50 border border-line rounded-control text-xs text-muted font-sans cursor-not-allowed min-h-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 font-semibold">
                {language === 'id' ? 'Tagline / Slogan Utama' : 'Hero Tagline / Catchphrase'}
              </label>
              <input
                type="text"
                value={metaSettings.tagline}
                onChange={(e) => setMetaSettings({ ...metaSettings, tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-panel border border-line rounded-control text-xs text-fg focus:outline-none focus:border-accent font-sans min-h-10"
              />
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 font-semibold">
                {language === 'id' ? 'Deskripsi Meta (SEO Global)' : 'Meta Description (Global SEO)'}
              </label>
              <textarea
                rows={3}
                value={metaSettings.metaDescription}
                onChange={(e) => setMetaSettings({ ...metaSettings, metaDescription: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-panel border border-line rounded-control text-xs text-fg focus:outline-none focus:border-accent font-sans"
              />
            </div>

            <div className="pt-4 border-t border-line space-y-3">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={metaSettings.soundEffectsEnabled}
                  onChange={(e) => setMetaSettings({ ...metaSettings, soundEffectsEnabled: e.target.checked })}
                  className="w-4 h-4 rounded bg-panel border-line text-accent accent-accent"
                />
                <span className="text-xs text-fg font-sans">
                  {language === 'id' 
                    ? 'Aktifkan Notifikasi Suara (Chime) saat ada lead baru masuk' 
                    : 'Enable audio chime notification on new incoming lead submission'}
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={metaSettings.enableLiveChat}
                  onChange={(e) => setMetaSettings({ ...metaSettings, enableLiveChat: e.target.checked })}
                  className="w-4 h-4 rounded bg-panel border-line text-accent accent-accent"
                />
                <span className="text-xs text-fg font-sans">
                  {language === 'id' 
                    ? 'Tampilkan Floating Contact & WhatsApp Widget di pojok kanan bawah' 
                    : 'Display Floating WhatsApp & Contact Widget on bottom-right'}
                </span>
              </label>
            </div>

            <div className="pt-4 flex items-center justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-control bg-accent text-white text-xs font-sans font-semibold hover:bg-accent-hover transition-all flex items-center gap-2 min-h-10"
              >
                <Save size={14} />
                <span>{language === 'id' ? 'Simpan Pengaturan Brand' : 'Save Brand Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: ROLE MATRIX & ACCOUNTS MANAGEMENT (STAKEHOLDER EXECUTIVE & TEKNISI IT) */}
      {activeTab === 'rbac' && canManageAdminAccounts && (
        <div className="w-full space-y-6">
          {/* Notification banner */}
          {accountActionMessage && (
            <div className={`p-4 rounded-card border flex items-center gap-3 text-xs font-sans animate-fadeIn ${
              accountActionMessage.success
                ? 'bg-success/10 border-success/30 text-success'
                : 'bg-danger/10 border-danger/30 text-danger'
            }`}>
              {accountActionMessage.success ? <Check size={16} className="shrink-0 text-success" /> : <AlertCircle size={16} className="shrink-0 text-danger" />}
              <span>{accountActionMessage.message}</span>
            </div>
          )}

          {/* Accounts Management Section */}
          <div className="bg-panel border border-line rounded-card p-5 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-5 border-b border-line">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-card bg-accent/10 border border-accent/30 flex items-center justify-center text-danger shrink-0">
                  <Users size={20} />
                </div>
                <div>
                  <h2 className="text-base font-semibold font-sans text-fg">
                    {language === 'id' ? 'Manajemen Akun Stakeholder & Teknisi' : 'Stakeholder & Technical Accounts'}
                  </h2>
                  <p className="text-xs text-muted font-sans">
                    {language === 'id'
                      ? 'Kelola akun khusus Stakeholder Executive, Teknisi IT, dan staf dengan hak akses granular.'
                      : 'Manage dedicated accounts for Executive Stakeholders, IT Engineers, and operations.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenAddAccount}
                className="h-10 px-4 min-h-10 rounded-control bg-accent text-white text-xs font-sans font-semibold hover:bg-accent-hover transition-all flex items-center justify-center gap-2 self-start sm:self-auto shrink-0"
              >
                <UserPlus size={15} />
                <span>{language === 'id' ? 'Tambah Akun Baru' : 'Add New Account'}</span>
              </button>
            </div>

            {/* Accounts Grid / List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {accounts.map((acc) => {
                const isExecutive = acc.role === 'Stakeholder Executive' || acc.stakeholderType === 'Executive';
                const isIT = acc.role === 'Teknisi IT / Systems Engineer' || acc.stakeholderType === 'IT_Technical';
                const isMasterAccount = acc.username === 'admin' || acc.stakeholderType === 'Master';

                return (
                  <div 
                    key={acc.id}
                    className="p-4 rounded-card bg-panel border border-line flex flex-col justify-between hover:border-line transition-all space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-card flex items-center justify-center font-semibold text-xs font-sans ${
                            isMasterAccount ? 'bg-danger/20 text-danger border border-danger/30' :
                            isExecutive ? 'bg-warning/20 text-warning border border-warning/30' :
                            isIT ? 'bg-success/20 text-success border border-success/30' :
                            'bg-series-3/20 text-series-3 border border-series-3/30'
                          }`}>
                            {acc.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-fg leading-snug">{acc.name}</h3>
                            <p className="text-[11px] font-sans text-muted">@{acc.username}</p>
                          </div>
                        </div>

                        <span className={`text-[10px] font-sans px-2 py-0.5 rounded-badge border shrink-0 ${
                          isMasterAccount ? 'bg-danger/10 text-danger border-danger/30' :
                          isExecutive ? 'bg-warning/10 text-warning border-warning/30' :
                          isIT ? 'bg-success/10 text-success border-success/30' :
                          'bg-series-3/10 text-series-3 border-series-3/30'
                        }`}>
                          {acc.division || 'Operations'}
                        </span>
                      </div>

                      <div className="space-y-1.5 pt-1 text-[11px] font-sans">
                        <div className="text-muted flex items-center justify-between">
                          <span>Role:</span>
                          <span className="font-semibold text-fg truncate max-w-[170px]">{acc.role}</span>
                        </div>
                        <div className="text-muted flex items-center justify-between">
                          <span>Email:</span>
                          <span className="text-muted truncate max-w-[170px]">{acc.email}</span>
                        </div>
                        <div className="text-muted flex items-center justify-between">
                          <span>Status:</span>
                          <span className="text-success flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-success" />
                            Aktif
                          </span>
                        </div>
                      </div>

                      {/* Permissions Summary Badges */}
                      <div className="mt-3 pt-3 border-t border-line flex flex-wrap gap-1">
                        {acc.permissions?.canManageInvoices && (
                          <span className="text-[9px] font-sans px-1.5 py-0.5 bg-success/10 text-success border border-success/30 rounded">
                            Invoice
                          </span>
                        )}
                        {acc.permissions?.canApproveBudgets && (
                          <span className="text-[9px] font-sans px-1.5 py-0.5 bg-warning/10 text-warning border border-warning/30 rounded-badge">
                            Budget Approval
                          </span>
                        )}
                        {acc.permissions?.canAccessServerAndApi && (
                          <span className="text-[9px] font-sans px-1.5 py-0.5 bg-info/10 text-info border border-info/30 rounded-badge">
                            DevOps / Cloud
                          </span>
                        )}
                        {acc.permissions?.canViewSecurityAuditLogs && (
                          <span className="text-[9px] font-sans px-1.5 py-0.5 bg-panel text-muted border border-line rounded">
                            Audit Logs
                          </span>
                        )}
                        {acc.permissions?.canManageCrm && (
                          <span className="text-[9px] font-sans px-1.5 py-0.5 bg-series-3/10 text-series-3 border border-series-3/30 rounded-badge">
                            CRM
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-line flex items-center justify-between gap-2">
                      <span className="text-[10px] leading-4 text-muted">
                        {language === 'id' ? 'Hak akses mengikuti policy role dari server.' : 'Access follows the server-managed role policy.'}
                      </span>

                      {isCurrentMaster && !isMasterAccount ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteAccountClick(acc.id, acc.name)}
                          className="min-h-10 sm:min-h-9 px-2 rounded-control border border-line bg-panel text-muted hover:border-danger/30 hover:bg-danger/10 hover:text-danger text-[11px] font-medium transition-colors flex items-center gap-1"
                          title="Delete account"
                        >
                          <Trash2 size={13} />
                          <span className="hidden sm:inline">{language === 'id' ? 'Hapus' : 'Delete'}</span>
                        </button>
                      ) : (
                        <span className="text-[10px] font-sans text-muted italic">
                          {isMasterAccount ? 'Root Master' : 'Master access required'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reference RBAC Matrix */}
          <div className="w-full bg-panel border border-line rounded-card p-5 sm:p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-line">
              <div className="w-10 h-10 rounded-card bg-info/10 border border-info/30 flex items-center justify-center text-info shrink-0">
                <Layers size={20} />
              </div>
              <div>
                <h2 className="text-base font-semibold font-sans text-fg">
                  {language === 'id' ? 'Standar Hirarki Hak Akses Stakeholder Kapitech' : 'Kapitech Stakeholder Access Standards'}
                </h2>
                <p className="text-xs text-muted font-sans">
                  {language === 'id'
                    ? 'Struktur hirarki hak akses dan izin operasi di seluruh modul AMS Kapitech.'
                    : 'Enterprise permission matrix across financial, pipeline, sprint delivery, and system configurations.'}
                </p>
              </div>
            </div>

            <div className="ams-table-scroll overflow-x-auto custom-scrollbar">
              <table className="ams-table w-full text-xs font-sans text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-line text-muted">
                    <th className="py-3 px-4 font-semibold">{language === 'id' ? 'Tingkatan & Peran' : 'Tier Level & Role'}</th>
                    <th className="py-3 px-4 font-semibold">{language === 'id' ? 'Finansial & Invoice' : 'Financial & Invoicing'}</th>
                    <th className="py-3 px-4 font-semibold">{language === 'id' ? 'CRM & Pipeline Prospek' : 'CRM & Client Leads'}</th>
                    <th className="py-3 px-4 font-semibold">{language === 'id' ? 'Sprint & Kanban Task' : 'Sprint & Tasks'}</th>
                    <th className="py-3 px-4 font-semibold">{language === 'id' ? 'Sistem & Cloud API' : 'System & Cloud API'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  <tr className="hover:bg-panel/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-fg flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-warning shrink-0"></span>
                      <span>Stakeholder Executive (Managing Partner)</span>
                    </td>
                    <td className="py-3.5 px-4 text-success font-semibold">{language === 'id' ? 'Approval & Audit Finansial Penuh' : 'Financial Approval & Audit'}</td>
                    <td className="py-3.5 px-4 text-success font-semibold">{language === 'id' ? 'Akses Penuh Pipeline' : 'Full Pipeline View'}</td>
                    <td className="py-3.5 px-4 text-warning">{language === 'id' ? 'Review Milestone & Delivery' : 'Milestone & Delivery Review'}</td>
                    <td className="py-3.5 px-4 text-muted">{language === 'id' ? 'Audit Log & Governance' : 'Audit Logs & Governance'}</td>
                  </tr>
                  <tr className="hover:bg-panel/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-fg flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-success shrink-0"></span>
                      <span>Teknisi IT / Systems Engineer</span>
                    </td>
                    <td className="py-3.5 px-4 text-muted">{language === 'id' ? 'Tanpa Akses Finansial' : 'No Financial Access'}</td>
                    <td className="py-3.5 px-4 text-muted">{language === 'id' ? 'Tanpa Akses' : 'No Access'}</td>
                    <td className="py-3.5 px-4 text-success font-semibold">{language === 'id' ? 'Teknis Penuh & Sprint Tasks' : 'Technical & Sprint Tasks'}</td>
                    <td className="py-3.5 px-4 text-success font-semibold">{language === 'id' ? 'Server, Cloud Run, API & Diagnostics' : 'Full Server, Cloud & Diagnostics'}</td>
                  </tr>
                  <tr className="hover:bg-panel/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-fg flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-series-3 shrink-0"></span>
                      <span>Tier 2: Project Manager (PM)</span>
                    </td>
                    <td className="py-3.5 px-4 text-warning">{language === 'id' ? 'Lihat & Draf Invoice' : 'View & Draft Invoices'}</td>
                    <td className="py-3.5 px-4 text-success font-semibold">{language === 'id' ? 'Kelola Pipeline & Delegasi' : 'Manage Pipeline & Assign'}</td>
                    <td className="py-3.5 px-4 text-success font-semibold">{language === 'id' ? 'Sprint Planning & Kelola Task' : 'Sprint Planning & Task Mgmt'}</td>
                    <td className="py-3.5 px-4 text-muted">{language === 'id' ? 'Hanya Lihat' : 'View Only'}</td>
                  </tr>
                  <tr className="hover:bg-panel/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-fg flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-info shrink-0"></span>
                      <span>Tier 3: Operational Staff</span>
                    </td>
                    <td className="py-3.5 px-4 text-muted">{language === 'id' ? 'Tanpa Akses' : 'No Access'}</td>
                    <td className="py-3.5 px-4 text-info">{language === 'id' ? 'Lihat Prospek Terkait' : 'View Assigned Deals'}</td>
                    <td className="py-3.5 px-4 text-success font-semibold">{language === 'id' ? 'Update Task Terkait' : 'Update Assigned Tasks'}</td>
                    <td className="py-3.5 px-4 text-muted">{language === 'id' ? 'Tanpa Akses' : 'No Access'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

      {/* MODAL: TAMBAH AKUN BARU (MOBILE FULLSCREEN + STICKY HEADER & FOOTER) */}
      <Modal open={isAddAccountModalOpen} onClose={() => setIsAddAccountModalOpen(false)} size="lg" title={language === 'id' ? 'Tambah Akun Stakeholder / Teknisi' : 'Add Stakeholder / Technical Account'} description={language === 'id' ? 'Pilih peran dan sesuaikan hak akses sistem.' : 'Select role and configure granular permissions.'}>
            <form onSubmit={handleCreateAccountSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar">
              
              {/* Role Selection Cards */}
              <div>
                <label className="block text-xs font-sans text-muted normal-case tracking-normal mb-2 font-semibold">
                  {language === 'id' ? 'Pilih Tipe Peran Stakeholder' : 'Select Stakeholder Role'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleRoleChangeForNewAccount('Stakeholder Executive')}
                    className={`p-3.5 rounded-card border text-left transition-all ${
                      newAccRole === 'Stakeholder Executive'
                        ? 'bg-warning/10 border-warning/50 ring-1 ring-warning/30'
                        : 'bg-panel border-line hover:border-line'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase size={16} className="text-warning" />
                      <span className="font-semibold text-xs text-fg">Stakeholder Executive</span>
                    </div>
                    <p className="text-[11px] text-muted leading-relaxed font-sans">
                      C-Level, Managing Partner, Sponsor. Akses approval finansial & review strategis.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChangeForNewAccount('Teknisi IT / Systems Engineer')}
                    className={`p-3.5 rounded-card border text-left transition-all ${
                      newAccRole === 'Teknisi IT / Systems Engineer'
                        ? 'bg-success/10 border-success/50 ring-1 ring-success/30'
                        : 'bg-panel border-line hover:border-line'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Terminal size={16} className="text-success" />
                      <span className="font-semibold text-xs text-fg">Teknisi IT / Engineer</span>
                    </div>
                    <p className="text-[11px] text-muted leading-relaxed font-sans">
                      Lead DevOps, Infrastructure, Cloud Run & API. Akses teknis penuh tanpa finansial.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChangeForNewAccount('Tier 2: Project Manager (PM)')}
                    className={`p-3.5 rounded-card border text-left transition-all ${
                      newAccRole === 'Tier 2: Project Manager (PM)'
                        ? 'bg-series-3/10 border-series-3/50 ring-1 ring-series-3/30'
                        : 'bg-panel border-line hover:border-line'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Layers size={16} className="text-series-3" />
                      <span className="font-semibold text-xs text-fg">Project Manager (PM)</span>
                    </div>
                    <p className="text-[11px] text-muted leading-relaxed font-sans">
                      Sprint planning, delivery klien, task delegation & draf faktur invoice.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChangeForNewAccount('Tier 3: Operational Staff')}
                    className={`p-3.5 rounded-card border text-left transition-all ${
                      newAccRole === 'Tier 3: Operational Staff'
                        ? 'bg-info/10 border-info/50 ring-1 ring-info/30'
                        : 'bg-panel border-line hover:border-line'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <UserCheck size={16} className="text-info" />
                      <span className="font-semibold text-xs text-fg">Operational Staff</span>
                    </div>
                    <p className="text-[11px] text-muted leading-relaxed font-sans">
                      Staf teknis / desainer operasional untuk update tugas harian.
                    </p>
                  </button>
                </div>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-sans text-muted normal-case tracking-normal mb-1.5 font-semibold">
                    {language === 'id' ? 'Nama Lengkap' : 'Full Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAccName}
                    onChange={(e) => setNewAccName(e.target.value)}
                    placeholder="Contoh: Alexander Hartanto"
                    className="w-full min-h-10 px-3.5 py-2.5 bg-panel border border-line rounded-control text-sm text-fg font-sans focus:outline-none focus:border-accent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans text-muted normal-case tracking-normal mb-1.5 font-semibold">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAccUsername}
                    onChange={(e) => setNewAccUsername(e.target.value)}
                    placeholder="Contoh: exec.alex"
                    className="w-full min-h-10 px-3.5 py-2.5 bg-panel border border-line rounded-control text-sm text-fg font-sans focus:outline-none focus:border-accent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans text-muted normal-case tracking-normal mb-1.5 font-semibold">
                    Email Resmi *
                  </label>
                  <input
                    type="email"
                    required
                    value={newAccEmail}
                    onChange={(e) => setNewAccEmail(e.target.value)}
                    placeholder="alex@kapitech.id"
                    className="w-full min-h-10 px-3.5 py-2.5 bg-panel border border-line rounded-control text-sm text-fg font-sans focus:outline-none focus:border-accent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans text-muted normal-case tracking-normal mb-1.5 font-semibold">
                    {language === 'id' ? 'Password Sementara' : 'Temporary Password'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAccPassword}
                    onChange={(e) => setNewAccPassword(e.target.value)}
                    minLength={12}
                    maxLength={128}
                    placeholder="12–128 characters"
                    className="w-full min-h-10 px-3.5 py-2.5 bg-panel border border-line rounded-control text-sm text-fg font-sans focus:outline-none focus:border-accent transition-all"
                  />
                </div>
              </div>

              <section className="rounded-card border border-line bg-bg p-4" aria-labelledby="account-policy-note">
                <h3 id="account-policy-note" className="text-xs font-semibold text-fg">Access policy</h3>
                <p className="mt-1 text-[11px] leading-5 text-muted">
                  {language === 'id'
                    ? 'Hak akses tidak diubah satu per satu di browser. Server menerapkan permission berdasarkan role yang dipilih.'
                    : 'Permissions are not overridden in the browser. The server applies the access policy associated with the selected role.'}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-badge border border-line bg-panel px-2 py-1 text-[10px] font-medium text-muted">{newAccRole}</span>
                  <span className="rounded-badge border border-info/20 bg-info/10 px-2 py-1 text-[10px] font-medium text-info">
                    {language === 'id' ? 'Server policy' : 'Server policy'}
                  </span>
                </div>
              </section>

            </form>
      </Modal>

      {/* TAB 4: SECURITY & MFA POLICY */}
      {activeTab === 'security' && (
        <div className="w-full bg-panel border border-line rounded-card p-5 sm:p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-line">
            <div className="w-10 h-10 rounded-card bg-warning/10 border border-warning/30 flex items-center justify-center text-warning shrink-0">
              <Lock size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold font-sans text-fg">
                {language === 'id' ? 'Kebijakan Keamanan, MFA & Password' : 'Security, MFA & Password Policy'}
              </h2>
              <p className="text-xs text-muted font-sans">
                {language === 'id'
                  ? 'Enkripsi SHA-256 tersimulasi, autentikasi multi-faktor, dan proteksi durasi sesi login.'
                  : 'SHA-256 secure hashing simulation, multi-factor authentication enforcement, and idle session limits.'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-panel border border-line rounded-card">
              <div className="flex items-start gap-3">
                <Smartphone size={15} className={mfaActive ? 'text-success shrink-0 mt-0.5' : 'text-warning shrink-0 mt-0.5'} />
                <div className="min-w-0">
                  <div className="text-fg font-sans font-semibold flex items-center gap-2 text-xs">
                    <span>Multi-factor authentication (MFA)</span>
                    <span className={`rounded-badge border px-1.5 py-0.5 text-[10px] font-semibold ${mfaActive ? 'border-success/30 bg-success/10 text-success' : 'border-warning/30 bg-warning/10 text-warning'}`}>
                      {mfaActive ? (language === 'id' ? 'Aktif' : 'Enabled') : (language === 'id' ? 'Belum dikonfigurasi' : 'Not configured')}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-5 text-muted">
                    {language === 'id'
                      ? 'Status mengikuti sesi server. Enrollment MFA dilakukan melalui alur autentikasi dan bukan melalui toggle lokal.'
                      : 'Status follows the server-backed session. MFA enrollment is an authentication flow, not a local policy toggle.'}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-panel border border-line rounded-card">
              <div className="flex items-start gap-3">
                <Clock3 size={15} className="mt-0.5 shrink-0 text-info" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-fg">
                    {language === 'id' ? 'Kebijakan kedaluwarsa sesi' : 'Session expiry policy'}
                  </div>
                  <p className="mt-1 text-[11px] leading-5 text-muted">
                    {language === 'id'
                      ? 'Aturan sesi dikelola oleh server authentication layer. Nilai client tidak dapat mengubah kebijakan sesi.'
                      : 'Session rules are enforced by the server authentication layer. Client-side settings cannot override the session policy.'}
                  </p>
                </div>
              </div>
            </div>
            <form onSubmit={handleUpdateSecurity} className="space-y-3 pt-3 border-t border-line">
              <h3 className="text-xs font-semibold text-fg font-sans">
                {language === 'id' ? 'Ganti Password Master' : 'Change Master Password'}
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-sans text-muted mb-1 font-semibold">
                    {language === 'id' ? 'Password Baru (min 8 karakter)' : 'New Password (min 8 characters)'}
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-panel border border-line rounded-control text-xs text-fg focus:outline-none focus:border-accent font-sans min-h-10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans text-muted mb-1 font-semibold">
                    {language === 'id' ? 'Konfirmasi Password Baru' : 'Confirm New Password'}
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-panel border border-line rounded-control text-xs text-fg focus:outline-none focus:border-accent font-sans min-h-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-sans text-muted mb-1 font-semibold">
                  {language === 'id' ? 'Password Saat Ini (Wajib Konfirmasi) *' : 'Current Password (Required for verification) *'}
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={language === 'id' ? 'Masukkan password admin saat ini...' : 'Enter your current admin password...'}
                  className="w-full px-3.5 py-2.5 bg-panel border border-line rounded-control text-xs text-fg focus:outline-none focus:border-accent font-sans min-h-10"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={securityLoading}
                  className="px-5 py-2.5 rounded-control bg-accent text-white text-xs font-sans font-semibold hover:bg-accent-hover transition-all flex items-center gap-2 min-h-10"
                >
                  <Save size={14} />
                  <span>{language === 'id' ? 'Update Password Terenkripsi' : 'Update Encrypted Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: API & CLOUD CONNECTIONS */}
      {activeTab === 'api' && canAccessServer && (
        <div className="w-full space-y-4">
          <ProductionReadinessCard language={language} />
          <div className="w-full rounded-card border border-line bg-panel p-5 sm:p-6">
            <div className="flex items-start gap-3 border-b border-line pb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card border border-info/30 bg-info/10 text-info">
                <Database size={20} />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-fg">
                  {language === 'id' ? 'Koneksi yang dikelola server' : 'Server-managed connections'}
                </h2>
                <p className="mt-1 text-xs leading-5 text-muted">
                  {language === 'id'
                    ? 'Credential, endpoint, dan koneksi produksi dikelola melalui environment server, bukan dari browser.'
                    : 'Production credentials, endpoints, and connection settings are managed by the server environment, not the browser.'}
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-card border border-line bg-bg p-4">
                <div className="text-xs font-semibold text-fg">Database</div>
                <div className="mt-1 text-sm font-medium text-fg">PostgreSQL</div>
                <div className="mt-1 text-xs leading-5 text-muted">
                  {language === 'id' ? 'Sumber data production' : 'Production data source'}
                </div>
              </div>
              <div className="rounded-card border border-line bg-bg p-4">
                <div className="text-xs font-semibold text-fg">{language === 'id' ? 'Backup terkelola provider' : 'Provider-managed backup'}</div>
                <div className="mt-1 text-sm font-medium text-fg">Provider-managed</div>
                <div className="mt-1 text-xs leading-5 text-muted">
                  {backupRetentionDays} {language === 'id' ? 'hari retensi' : 'days retention'}
                </div>
              </div>
              <div className="rounded-card border border-line bg-bg p-4">
                <div className="text-xs font-semibold text-fg">Document vault</div>
                <div className="mt-1 text-sm font-medium text-fg">Server-managed</div>
                <div className="mt-1 text-xs leading-5 text-muted">
                  {language === 'id' ? 'Storage durable dikelola infrastructure' : 'Durable storage is managed by infrastructure'}
                </div>
              </div>
              <div className="rounded-card border border-line bg-bg p-4">
                <div className="text-xs font-semibold text-fg">{language === 'id' ? 'Notifikasi' : 'Notifications'}</div>
                <div className="mt-1 text-sm font-medium text-fg">Server-managed</div>
                <div className="mt-1 text-xs leading-5 text-muted">
                  {language === 'id' ? 'Credential tidak ditampilkan di client' : 'Credentials are never exposed in the client'}
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-control border border-line bg-bg px-3.5 py-3">
              <p className="text-xs leading-5 text-muted">
                {language === 'id'
                  ? 'Tidak ada field credential editable di sini. Perubahan production dilakukan melalui environment/deployment configuration dan mengikuti readiness gate.'
                  : 'There are no editable credential fields here. Production changes are made through deployment environment configuration and remain subject to the readiness gate.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT TRAIL */}
      {activeTab === 'audit' && canViewAuditLogs && (
        <div className="w-full bg-panel border border-line rounded-card p-5 sm:p-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 mb-6 pb-4 border-b border-line">
            <div>
              <h2 className="text-base font-semibold font-sans text-fg flex items-center gap-2">
                <ShieldCheck size={18} className="text-accent" />
                <span>{language === 'id' ? 'Riwayat Audit Aktivitas & Keamanan' : 'Security & Activity Audit Trail'}</span>
              </h2>
              <p className="text-xs text-muted font-sans mt-0.5">
                {language === 'id'
                  ? 'Catatan terenkripsi dari aktivitas autentikasi, akses RBAC, dan perubahan data sistem.'
                  : 'Immutable encrypted trail of user authentication, RBAC transitions, and security operations.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportLogs}
                disabled={logs.length === 0}
                className="px-3.5 py-2 rounded-control bg-panel hover:bg-panel text-fg border border-line text-xs font-sans transition-colors flex items-center gap-1.5 disabled:opacity-50 min-h-10"
              >
                <Download size={13} />
                <span>Export JSON</span>
              </button>

            </div>
          </div>

          {logs.length === 0 ? (
            <div className="py-12 text-center text-muted text-xs font-sans">
              {language === 'id' ? 'Belum ada log aktivitas keamanan yang tercatat.' : 'No security audit logs recorded yet.'}
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-card bg-panel border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-sans"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`px-2 py-0.5 rounded-badge text-[10px] font-semibold ${
                        log.severity === 'critical' 
                          ? 'bg-danger/15 text-danger border border-danger/30' 
                          : log.severity === 'warning' 
                          ? 'bg-warning/10 text-warning border border-warning/30' 
                          : 'bg-success/10 text-success border border-success/30'
                      }`}>
                        {log.action}
                      </span>
                      <span className="text-muted text-[11px] font-semibold">{log.actor}</span>
                    </div>
                    <p className="text-muted text-xs">{log.details}</p>
                  </div>

                  <div className="text-[10px] text-muted shrink-0 sm:text-right font-sans">
                    <div>{new Date(log.timestamp).toLocaleTimeString()}</div>
                    <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      <Modal
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        size="sm"
        title={language === 'id' ? 'Hapus akun stakeholder?' : 'Delete stakeholder account?'}
        description={language === 'id' ? `Akun ${confirmAction?.name || ''} akan dihapus secara permanen.` : `Account ${confirmAction?.name || ''} will be permanently deleted.`}
        footer={(
          <>
            <Button type="button" variant="secondary" onClick={() => setConfirmAction(null)}>
              {language === 'id' ? 'Batal' : 'Cancel'}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => confirmAction?.id
                ? void confirmDeleteAccount(confirmAction.id, confirmAction.name || '')
                : undefined}
            >
              {language === 'id' ? 'Hapus' : 'Delete'}
            </Button>
          </>
        )}
      >
        <div className="rounded-card border border-danger/20 bg-danger/5 p-3.5 text-xs text-muted">
          {language === 'id' ? 'Tindakan ini tidak dapat dibatalkan.' : 'This action cannot be undone.'}
        </div>
      </Modal>

    </div>
  );
};

export default AdminSettings;
