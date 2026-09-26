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
  const [mfaActive, setMfaActive] = useState(storedCreds.mfaEnabled ?? true);
  const [sessionTimeoutMin, setSessionTimeoutMin] = useState(120);

  // Meta & Branding Settings state
  const [metaSettings, setMetaSettings] = useState<SiteMetaSettings>({
    siteTitle: '', siteDescription: '', contactReceiverEmail: '', defaultLanguage: language, enableLiveChat: false, enableSoundAlerts: false, maintenanceMode: false
  });
  const [metaStatus, setMetaStatus] = useState<string | null>(null);

  // API Connections state
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [webhookUrl, setWebhookUrl] = useState('https://discord.com/api/webhooks/kapitech-agency-leads');
  const [cloudRunRegion, setCloudRunRegion] = useState('asia-southeast2 (Jakarta)');
  const [apiSaveStatus, setApiSaveStatus] = useState<string | null>(null);

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

            <div className="pt-2 border-t border-line">
              <label className="block text-xs font-sans text-muted mb-1 font-semibold">
                {language === 'id' ? 'Password Saat Ini (Wajib Konfirmasi Perubahan) *' : 'Current Password (Required for confirmation) *'}
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={language === 'id' ? 'Masukkan password admin saat ini...' : 'Enter your current password...'}
                className="w-full px-3.5 py-2.5 bg-panel border border-line rounded-control text-xs text-fg focus:outline-none focus:border-accent font-sans min-h-10"
              />
            </div>

            <div className="pt-4 flex items-center justify-end">
              <button
                type="submit"
                disabled={securityLoading}
                className="px-5 py-2.5 rounded-control bg-accent text-white text-xs font-sans font-semibold hover:bg-accent-hover transition-all flex items-center gap-2 disabled:opacity-50 min-h-10"
              >
                {securityLoading ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                <span>{language === 'id' ? 'Perbarui Akun Master' : 'Update Master Account'}</span>
              </button>
            </div>
          </form>
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
                const isMaster = acc.username === 'admin' || acc.stakeholderType === 'Master';

                return (
                  <div 
                    key={acc.id}
                    className="p-4 rounded-card bg-panel border border-line flex flex-col justify-between hover:border-line transition-all space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-card flex items-center justify-center font-semibold text-xs font-sans ${
                            isMaster ? 'bg-danger/20 text-danger border border-danger/30' :
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
                          isMaster ? 'bg-danger/10 text-danger border-danger/30' :
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
                        {acc.permissions?.canManageInvoicing && (
                          <span className="text-[9px] font-sans px-1.5 py-0.5 bg-success/10 text-success border border-success/30 rounded">
                            Invoice
                          </span>
                        )}
                        {acc.permissions?.canApproveBudgets && (
                          <span className="text-[9px] font-sans px-1.5 py-0.5 bg-warning/10 text-warning border border-warning/30 rounded-badge">
                            Budget Approval
                          </span>
                        )}
                        {acc.permissions?.canManageInfrastructure && (
                          <span className="text-[9px] font-sans px-1.5 py-0.5 bg-info/10 text-info border border-info/30 rounded-badge">
                            DevOps / Cloud
                          </span>
                        )}
                        {acc.permissions?.canViewAuditLogs && (
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
                      <button
                        type="button"
                        onClick={() => handleOpenEditPermissions(acc)}
                        className="min-h-10 px-2.5 rounded-control bg-panel hover:bg-panel text-fg text-[11px] font-sans font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Sliders size={13} className="text-danger" />
                        <span>{language === 'id' ? 'Atur Izin' : 'Permissions'}</span>
                      </button>

                      {!isMaster ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteAccountClick(acc.id, acc.name)}
                          className="h-8 px-2 rounded-control hover:bg-danger/10 text-muted hover:text-danger text-[11px] font-sans transition-colors flex items-center gap-1"
                          title="Hapus Akun"
                        >
                          <Trash2 size={13} />
                          <span className="hidden sm:inline">{language === 'id' ? 'Hapus' : 'Delete'}</span>
                        </button>
                      ) : (
                        <span className="text-[10px] font-sans text-muted italic">Root Master</span>
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
                    placeholder="Minimal 6 karakter"
                    className="w-full min-h-10 px-3.5 py-2.5 bg-panel border border-line rounded-control text-sm text-fg font-sans focus:outline-none focus:border-accent transition-all"
                  />
                </div>
              </div>

              {/* Granular Hak Akses Checkboxes */}
              <div>
                <label className="block text-xs font-sans text-muted normal-case tracking-normal mb-2 font-semibold flex items-center justify-between">
                  <span>{language === 'id' ? 'Hak Akses Granular (RBAC Matrix)' : 'Granular Permissions Matrix'}</span>
                  <span className="text-[10px] text-success lowercase">otomatis tersinkron dengan peran</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-bg border border-line rounded-card max-h-48 overflow-y-auto custom-scrollbar">
                  {[
                    { key: 'canManageInvoicing', label: 'Finansial & Invoice (Buat / Hapus)' },
                    { key: 'canViewInvoicing', label: 'Lihat Data & Laporan Keuangan' },
                    { key: 'canApproveBudgets', label: 'Approval Anggaran & Kontrak' },
                    { key: 'canManageCrm', label: 'CRM & Kelola Pipeline Prospek' },
                    { key: 'canViewCrm', label: 'Lihat Data Prospek & Klien' },
                    { key: 'canManageProjects', label: 'Manajemen Proyek & Delivery' },
                    { key: 'canManageTasks', label: 'Sprint Kanban & Eksekusi Task' },
                    { key: 'canManageClients', label: 'Kelola Master Data Klien' },
                    { key: 'canManageVendors', label: 'Kelola Vendor & Mitra Pihak Ke-3' },
                    { key: 'canAccessSystemSettings', label: 'Akses Konfigurasi Sistem AMS' },
                    { key: 'canViewAuditLogs', label: 'Audit Trail & Log Keamanan' },
                    { key: 'canManageInfrastructure', label: 'Server, Cloud Run, API & Diagnostik' },
                    { key: 'canManageAdminAccounts', label: 'Manajemen Akun Internal AMS' }
                  ].map((item) => (
                    <label 
                      key={item.key}
                      className="flex items-center gap-2 p-2 rounded-control bg-panel/50 hover:bg-panel cursor-pointer text-xs font-sans transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={!!newAccPermissions[item.key as keyof StakeholderPermissions]}
                        onChange={(e) => setNewAccPermissions({
                          ...newAccPermissions,
                          [item.key]: e.target.checked
                        })}
                        className="w-4 h-4 rounded bg-bg border-line text-accent accent-accent"
                      />
                      <span className="text-fg text-[11px] truncate">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="sticky bottom-0 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 mt-4 bg-panel  px-5 sm:px-6 py-3.5 border-t border-line flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddAccountModalOpen(false)}
                  className="h-10 px-4 rounded-control bg-panel text-muted hover:text-fg text-xs font-sans font-semibold transition-colors"
                >
                  {language === 'id' ? 'Batal' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-control bg-accent text-white text-xs font-sans font-semibold hover:bg-accent transition-all flex items-center gap-2"
                >
                  <Save size={14} />
                  <span>{language === 'id' ? 'Simpan Akun Baru' : 'Save Account'}</span>
                </button>
              </div>

            </form>
      </Modal>

      {/* MODAL: EDIT PERMISSIONS (MOBILE FULLSCREEN + STICKY HEADER & FOOTER) */}
      <Modal open={isEditPermsModalOpen && !!editingAccount} onClose={() => setIsEditPermsModalOpen(false)} size="lg" title={language === 'id' ? 'Atur Hak Akses Granular' : 'Manage Granular Permissions'} description={editingAccount ? editingAccount.name + ' (' + editingAccount.role + ')' : undefined}>
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-2.5 custom-scrollbar">
              {[
                { key: 'canManageInvoicing', label: 'Finansial & Invoicing (Buat & Hapus Invoice)' },
                { key: 'canViewInvoicing', label: 'Lihat Data & Laporan Keuangan' },
                { key: 'canApproveBudgets', label: 'Approval Anggaran & Kontrak Eksekutif' },
                { key: 'canManageCrm', label: 'CRM & Kelola Pipeline Leads' },
                { key: 'canViewCrm', label: 'Lihat Data Prospek & Klien' },
                { key: 'canManageProjects', label: 'Manajemen Proyek & Delivery' },
                { key: 'canManageTasks', label: 'Sprint Planning & Eksekusi Tasks' },
                { key: 'canManageClients', label: 'Kelola Master Data Klien' },
                { key: 'canManageVendors', label: 'Kelola Vendor & Mitra Eksternal' },
                { key: 'canAccessSystemSettings', label: 'Akses Konfigurasi Sistem AMS' },
                { key: 'canViewAuditLogs', label: 'Audit Trail & Log Keamanan' },
                { key: 'canManageInfrastructure', label: 'Server, Cloud Run, API & Diagnostik Sistem' },
                { key: 'canManageAdminAccounts', label: 'Manajemen Akun Internal AMS' }
              ].map((item) => (
                <label 
                  key={item.key}
                  className="flex items-center justify-between p-3 rounded-card bg-panel border border-line hover:border-line cursor-pointer text-xs font-sans transition-colors"
                >
                  <span className="text-fg font-medium">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={!!tempPermissions[item.key as keyof StakeholderPermissions]}
                    onChange={(e) => setTempPermissions({
                      ...tempPermissions,
                      [item.key]: e.target.checked
                    })}
                    className="w-4 h-4 rounded bg-bg border-line text-accent accent-accent"
                  />
                </label>
              ))}
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 bg-panel  px-5 sm:px-6 py-3.5 border-t border-line flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsEditPermsModalOpen(false)}
                className="h-10 px-4 rounded-control bg-panel text-muted hover:text-fg text-xs font-sans font-semibold transition-colors"
              >
                {language === 'id' ? 'Batal' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSavePermissions}
                className="h-10 px-5 rounded-control bg-accent text-white text-xs font-sans font-semibold hover:bg-accent transition-all flex items-center gap-2"
              >
                <Save size={14} />
                <span>{language === 'id' ? 'Simpan Perubahan Hak Akses' : 'Save Permissions'}</span>
              </button>
            </div>

      </Modal>
        </div>
      )}

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
            <div className="p-4 bg-panel border border-line rounded-card flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
              <div className="space-y-1">
                <div className="text-fg font-sans font-semibold flex items-center gap-2 text-xs">
                  <Smartphone size={15} className="text-success shrink-0" />
                  <span>{language === 'id' ? 'Wajibkan Multi-Factor Authentication (MFA)' : 'Enforce Multi-Factor Authentication (MFA)'}</span>
                </div>
                <p className="text-muted text-[11px] font-sans">
                  {language === 'id'
                    ? 'Wajibkan verifikasi OTP untuk Tier 1 (Top Management) dan Tier 4 (System Admin).'
                    : 'Mandate time-based OTP verification for Tier 1 Sponsors and Tier 4 IT Administrators.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMfaActive(!mfaActive)}
                className={`px-3.5 py-1.5 rounded-control text-xs font-sans font-semibold transition-all self-start sm:self-auto min-h-10 ${
                  mfaActive ? 'bg-success/10 text-success border border-success/30' : 'bg-panel text-muted'
                }`}
              >
                {mfaActive ? (language === 'id' ? 'AKTIF' : 'ACTIVE') : (language === 'id' ? 'NONAKTIF' : 'DISABLED')}
              </button>
            </div>

            <div className="p-4 bg-panel border border-line rounded-card space-y-2">
              <label className="block text-xs font-sans text-muted font-semibold">
                {language === 'id' ? 'Batas Waktu Ketidakaktifan Sesi (Menit)' : 'Session Inactivity Timeout (Minutes)'}
              </label>
              <input
                type="number"
                value={sessionTimeoutMin}
                onChange={(e) => setSessionTimeoutMin(parseInt(e.target.value) || 60)}
                className="w-full px-3.5 py-2.5 bg-panel border border-line rounded-control text-xs text-fg font-sans focus:outline-none focus:border-accent min-h-10"
              />
              <p className="text-[10px] text-muted font-sans">
                {language === 'id'
                  ? 'Sesi login admin akan otomatis keluar jika tidak ada aktivitas dalam rentang waktu di atas.'
                  : 'Admin login session automatically terminates if no active interaction occurs within this threshold.'}
              </p>
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
          {canAccessServer && <ProductionReadinessCard language={language} />}
          {canAccessServer && (
            <div className="p-4 rounded-card bg-panel border border-line">
              <div className="text-[10px] font-sans normal-case tracking-normal text-muted">Backup Retention</div>
              <div className="text-sm font-semibold text-fg mt-1">{backupRetentionDays} days</div>
              <p className="text-[11px] text-muted font-sans mt-1">Provider-managed backup retention reported by the server.</p>
            </div>
          )}
          <div className="w-full max-w-4xl bg-panel border border-line rounded-card p-5 sm:p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-line">
            <div className="w-10 h-10 rounded-card bg-success/10 border border-success/30 flex items-center justify-center text-success shrink-0">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold font-sans text-fg">
                {language === 'id' ? 'Integrasi API & Cloud' : 'API & Cloud Integrations'}
              </h2>
              <p className="text-xs text-muted font-sans">
                {language === 'id'
                  ? 'Webhook notifikasi masuk, server SMTP, dan konfigurasi region Cloud Run.'
                  : 'Inbound notification webhooks, transactional SMTP credentials, and Cloud Run container regions.'}
              </p>
            </div>
          </div>

          {apiSaveStatus && (
            <div className="p-4 rounded-card text-xs font-sans flex items-start gap-2.5 bg-success/10 border border-success/30 text-success">
              <Check size={16} className="shrink-0 mt-0.5" />
              <span>{apiSaveStatus}</span>
            </div>
          )}

          <div className="space-y-4 text-xs font-sans">
            <div>
              <label className="block text-muted mb-1 font-semibold">
                {language === 'id' ? 'Webhook Notifikasi Prospek (Discord / Slack)' : 'Inbound Lead Webhook (Discord / Slack)'}
              </label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-panel border border-line rounded-control text-fg focus:outline-none focus:border-accent font-sans min-h-10"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-muted mb-1 font-semibold">
                  {language === 'id' ? 'Host Server SMTP' : 'SMTP Server Host'}
                </label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-panel border border-line rounded-control text-fg focus:outline-none focus:border-accent font-sans min-h-10"
                />
              </div>

              <div>
                <label className="block text-muted mb-1 font-semibold">
                  {language === 'id' ? 'Port SMTP' : 'SMTP Port'}
                </label>
                <input
                  type="text"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-panel border border-line rounded-control text-fg focus:outline-none focus:border-accent font-sans min-h-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-muted mb-1 font-semibold">
                {language === 'id' ? 'Region Deployment Cloud Run' : 'Cloud Run Deployment Region'}
              </label>
              <input
                type="text"
                value={cloudRunRegion}
                onChange={(e) => setCloudRunRegion(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-panel border border-line rounded-control text-fg focus:outline-none focus:border-accent font-sans min-h-10"
              />
            </div>
            <div className="pt-3 border-t border-line">
              <p className="text-[11px] text-muted font-sans">
                {language === 'id'
                  ? 'Konfigurasi koneksi ini dikelola oleh environment dan server. Panel ini tidak menyimpan perubahan koneksi.'
                  : 'These connection values are managed by the environment and server. This panel does not persist connection changes.'}
              </p>
            </div>
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
