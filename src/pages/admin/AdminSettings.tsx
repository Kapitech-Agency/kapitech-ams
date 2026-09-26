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
  Sliders,
  Shield,
  Briefcase,
  Terminal,
  Users
} from 'lucide-react';
import { 
  getAdminSession, 
  updateAdminCredentials, 
  fetchServerAuditLogs,
  clearAuditLogs, 
  SecurityAuditLog,
  getStoredAdminCredentials,
  AdminAccount,
  AdminTier,
  StakeholderPermissions,
  fetchAdminAccounts,
  createAdminAccount,
  deleteAdminAccount,
    getDefaultPermissionsForRole
} from '../../lib/adminAuth';
import { SiteMetaSettings } from '../../lib/cmsStore';
import { useLanguage } from '../../lib/LanguageContext';
import { api } from '../../lib/apiClient';
import { ProductionReadinessCard } from '../../components/admin/ProductionReadinessCard';

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

  const handleTabChange = (tab: 'profile' | 'branding' | 'rbac' | 'security' | 'api' | 'audit') => {
    if (tab === 'rbac' && !canManageAdminAccounts) return;
    if (tab === 'api' && !canAccessServer) return;
    if (tab === 'audit' && !canViewAuditLogs) return;
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    if (paramTab) {
      if (paramTab === 'team' || paramTab === 'rbac') setActiveTab('rbac');
      else if (paramTab === 'audit') setActiveTab('audit');
      else if (paramTab === 'system' || paramTab === 'branding') setActiveTab('branding');
      else if (paramTab === 'security') setActiveTab('security');
      else if (paramTab === 'api') setActiveTab('api');
      else if (paramTab === 'profile') setActiveTab('profile');
    }
  }, [paramTab]);

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
  const [confirmAction, setConfirmAction] = useState<{ type: 'account' | 'logs'; id?: string; name?: string } | null>(null);
  const [isEditPermsModalOpen, setIsEditPermsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AdminAccount | null>(null);
  const [accountActionMessage, setAccountActionMessage] = useState<{ success: boolean; message: string } | null>(null);

  // New Account Form State
  const [newAccName, setNewAccName] = useState('');
  const [newAccUsername, setNewAccUsername] = useState('');
  const [newAccEmail, setNewAccEmail] = useState('');
  const [newAccPassword, setNewAccPassword] = useState('');
  const [newAccRole, setNewAccRole] = useState<AdminTier>('Stakeholder Executive');
  const [newAccDivision, setNewAccDivision] = useState<'Management' | 'Engineering' | 'Design' | 'Finance' | 'Operations'>('Management');
  const [newAccPermissions, setNewAccPermissions] = useState<StakeholderPermissions>(getDefaultPermissionsForRole('Stakeholder Executive'));

  // Editable permissions state
  const [tempPermissions, setTempPermissions] = useState<StakeholderPermissions>(getDefaultPermissionsForRole('Stakeholder Executive'));

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
    setNewAccPassword('kapi_' + Math.random().toString(36).substring(2, 7) + '25');
    setNewAccRole('Stakeholder Executive');
    setNewAccDivision('Management');
    setNewAccPermissions(getDefaultPermissionsForRole('Stakeholder Executive'));
    setAccountActionMessage(null);
    setIsAddAccountModalOpen(true);
  };

  const handleRoleChangeForNewAccount = (role: AdminTier) => {
    setNewAccRole(role);
    const perms = getDefaultPermissionsForRole(role);
    setNewAccPermissions(perms);
    if (role === 'Teknisi IT / Systems Engineer' || role.includes('Internal IT')) {
      setNewAccDivision('Engineering');
    } else if (role === 'Stakeholder Executive' || role.includes('Top Management')) {
      setNewAccDivision('Management');
    }
  };

  const handleCreateAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountActionMessage(null);

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


  const handleOpenEditPermissions = (acc: AdminAccount) => {
    setEditingAccount(acc);
    setTempPermissions({ ...acc.permissions });
    setIsEditPermsModalOpen(true);
  };

  const handleSavePermissions = async () => {
    if (!editingAccount) return;
    const res = await api.auth.updateUser(editingAccount.id, { permissions: tempPermissions });
    if (res.success) {
      refreshAccounts();
      setIsEditPermsModalOpen(false);
      setAccountActionMessage({
        success: true,
        message: language === 'id' 
          ? `Hak akses untuk "${editingAccount.name}" berhasil diperbarui!` 
          : `Permissions for "${editingAccount.name}" updated successfully!`
      });
      setTimeout(() => setAccountActionMessage(null), 4000);
    } else {
      setAccountActionMessage({ success: false, message: res.error || (language === 'id' ? 'Gagal memperbarui hak akses.' : 'Failed to update permissions.') });
    }
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
        username,
        email,
        newPassword: newPassword || undefined
      });

      if (res.success) {
        setSecurityStatus({ 
          success: true, 
          message: language === 'id' 
            ? 'Kredensial dan password admin berhasil diperbarui dengan enkripsi aman!' 
            : 'Admin credentials and password updated successfully with secure encryption!' 
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

  const handleClearLogs = () => {
    if (logs.length === 0) {
      setAccountActionMessage({ success: false, message: language === 'id' ? 'Tidak ada audit log untuk dihapus.' : 'There are no audit logs to clear.' });
      return;
    }
    setConfirmAction({ type: 'logs' });
  };

  const confirmClearLogs = () => {
    clearAuditLogs();
    setLogs([]);
    setConfirmAction(null);
    setAccountActionMessage({ success: true, message: language === 'id' ? 'Audit log berhasil dihapus.' : 'Audit logs cleared.' });
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

          <form onSubmit={handleUpdateSecurity} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-sans text-muted mb-1 font-semibold">
                  {language === 'id' ? 'Nama Pengguna (Username)' : 'Username'}
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-panel border border-line rounded-control text-xs text-fg focus:outline-none focus:border-accent font-sans min-h-10"
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-muted mb-1 font-semibold">
                  {language === 'id' ? 'Email Notifikasi' : 'Notification Email'}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-panel border border-line rounded-control text-xs text-fg focus:outline-none focus:border-accent font-sans min-h-10"
                />
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

          <section className="rounded-card border border-line bg-panel p-5 sm:p-6">
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
                <div className="text-xs font-semibold text-fg">{language === 'id' ? 'Backup' : 'Backups'}</div>
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
          </section>
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

              <button
                onClick={handleClearLogs}
                disabled={logs.length === 0}
                className="px-3.5 py-2 rounded-control bg-panel hover:bg-danger/10 text-muted hover:text-danger border border-line hover:border-danger/30 text-xs font-sans transition-colors flex items-center gap-1.5 disabled:opacity-50 min-h-10"
              >
                <Trash2 size={13} />
                <span>{language === 'id' ? 'Hapus Log' : 'Clear Logs'}</span>
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
        title={confirmAction?.type === 'account' ? (language === 'id' ? 'Hapus akun stakeholder?' : 'Delete stakeholder account?') : (language === 'id' ? 'Hapus audit log?' : 'Clear audit logs?')}
        description={confirmAction?.type === 'account' ? (language === 'id' ? `Akun ${confirmAction.name || ''} akan dihapus secara permanen.` : `Account ${confirmAction.name || ''} will be permanently deleted.`) : (language === 'id' ? 'Seluruh riwayat audit log keamanan akan dihapus.' : 'All security audit log history will be cleared.')}
      >
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
          <button type="button" onClick={() => setConfirmAction(null)} className="min-h-10 px-4 rounded-control border border-line bg-panel text-xs text-muted">Cancel</button>
          <button type="button" onClick={() => confirmAction?.type === 'account' && confirmAction.id ? void confirmDeleteAccount(confirmAction.id, confirmAction.name || '') : confirmAction?.type === 'logs' ? void confirmClearLogs() : undefined} className="min-h-10 px-4 rounded-control bg-danger text-white text-xs font-semibold">Delete</button>
        </div>
      </Modal>

    </div>
  );
};

export default AdminSettings;
