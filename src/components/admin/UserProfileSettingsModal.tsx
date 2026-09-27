import React, { useEffect, useMemo, useState } from 'react';
import { Camera, Mail, Phone, Save, UserRound } from 'lucide-react';
import { Modal } from '../ui/Modal';
import Button from '../ui/Button';
import UserAvatar from './UserAvatar';
import { api } from '../../lib/apiClient';
import { cacheAdminSession, getAdminSession } from '../../lib/adminAuth';

interface UserProfileSettingsModalProps {
  open: boolean;
  onClose: () => void;
  displayName: string;
  title: string;
}

const MAX_PHOTO_BYTES = 1_500_000;

const readImage = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Unable to read the selected image.'));
  reader.onload = () => resolve(String(reader.result || ''));
  reader.readAsDataURL(file);
});

export const UserProfileSettingsModal: React.FC<UserProfileSettingsModalProps> = ({
  open,
  onClose,
  displayName,
  title
}) => {
  const session = getAdminSession();
  const user = session?.user;

  const [name, setName] = useState(displayName);
  const [bio, setBio] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [additionalPhone, setAdditionalPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(String((user as any)?.profileDisplayName || displayName));
    setBio(String((user as any)?.bio || ''));
    setPersonalEmail(String((user as any)?.personalEmail || ''));
    setAdditionalPhone(String((user as any)?.additionalPhone || ''));
    setAvatarUrl((user as any)?.avatarUrl || null);
    setPhotoError(null);
    setStatus(null);
  }, [open, displayName, user?.id]);

  const companyEmail = user?.email || '';
  const primaryPhone = String((user as any)?.phone || '');

  const initialsPreview = useMemo(() => avatarUrl || undefined, [avatarUrl]);

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhotoError(null);
    if (!file.type.startsWith('image/')) {
      setPhotoError('Choose an image file.');
      event.target.value = '';
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError('Profile photo must be 1.5 MB or smaller.');
      event.target.value = '';
      return;
    }

    try {
      setAvatarUrl(await readImage(file));
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : 'Unable to load the selected image.');
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);
    setStatus(null);

    try {
      const payload = {
        name: name.trim() || displayName,
        bio: bio.trim(),
        personalEmail: personalEmail.trim(),
        additionalPhone: additionalPhone.trim(),
        avatarUrl: avatarUrl || null
      };

      const response = await api.auth.updateUser(user.id, payload);
      if (!response.success) {
        setStatus({
          success: false,
          message: response.error || 'Profile settings could not be saved.'
        });
        return;
      }

      const current = getAdminSession();
      if (current) {
        cacheAdminSession(
          {
            ...current.user,
            name: payload.name,
            profileDisplayName: payload.name,
            bio: payload.bio,
            personalEmail: payload.personalEmail,
            additionalPhone: payload.additionalPhone,
            avatarUrl: payload.avatarUrl || undefined
          } as typeof current.user,
          current.rememberMe
        );
        window.dispatchEvent(new CustomEvent('kapitech_profile_updated', {
          detail: { name: payload.name, avatarUrl: payload.avatarUrl || null }
        }));
      }

      setStatus({
        success: true,
        message: 'Profile settings saved.'
      });
    } catch (error) {
      setStatus({
        success: false,
        message: error instanceof Error ? error.message : 'Profile settings could not be saved.'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Profile settings"
      description="Manage your visible identity and personal contact details."
      footer={(
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            loading={saving}
            icon={<Save size={14} />}
            onClick={() => void handleSave()}
          >
            Save changes
          </Button>
        </>
      )}
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-4 rounded-card border border-line bg-bg p-4 sm:flex-row sm:items-center">
          <UserAvatar name={name} imageUrl={initialsPreview} size="lg" online />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-fg">{name}</div>
            <div className="mt-0.5 text-xs text-muted">{title}</div>
            <label className="mt-3 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-control border border-line bg-panel px-3 text-xs font-medium text-muted transition-colors hover:border-muted hover:bg-panel-hover hover:text-fg">
              <Camera size={14} />
              Change photo
              <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} />
            </label>
            {photoError && <p className="mt-2 text-[11px] text-danger">{photoError}</p>}
          </div>
        </div>

        {status && (
          <div className={status.success
            ? 'rounded-control border border-success/20 bg-success/10 px-3 py-2.5 text-xs text-success'
            : 'rounded-control border border-danger/20 bg-danger/10 px-3 py-2.5 text-xs text-danger'}>
            {status.message}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted">Full name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>

          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted">Role</span>
            <div className="flex min-h-9 items-center rounded-control border border-line bg-bg px-3 text-[13px] text-fg">
              {title}
            </div>
          </div>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">Bio</span>
          <textarea
            rows={4}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="Add a short professional bio."
            className="w-full resize-y"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted"><Mail size={13} />Company email</span>
            <input value={companyEmail} readOnly aria-readonly="true" />
            <span className="text-[10px] text-muted">Managed by Kapitech and cannot be changed here.</span>
          </label>

          <label className="space-y-1.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted"><Mail size={13} />Personal email</span>
            <input
              value={personalEmail}
              onChange={(event) => setPersonalEmail(event.target.value)}
              type="email"
              placeholder="name@example.com"
            />
            <span className="text-[10px] text-muted">Optional personal contact address.</span>
          </label>

          <label className="space-y-1.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted"><Phone size={13} />Primary phone</span>
            <input value={primaryPhone} readOnly aria-readonly="true" placeholder="Managed by company" />
            <span className="text-[10px] text-muted">Company-managed number cannot be changed here.</span>
          </label>

          <label className="space-y-1.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted"><Phone size={13} />Additional phone</span>
            <input
              value={additionalPhone}
              onChange={(event) => setAdditionalPhone(event.target.value)}
              inputMode="tel"
              placeholder="+62 ..."
            />
            <span className="text-[10px] text-muted">Optional additional contact number.</span>
          </label>
        </div>

        <div className="flex items-start gap-2.5 rounded-control border border-line bg-bg p-3 text-[11px] text-muted">
          <UserRound size={14} className="mt-0.5 shrink-0 text-accent-text" />
          <span>Your profile changes update the AMS account shown in the sidebar and account controls.</span>
        </div>
      </div>
    </Modal>
  );
};

export default UserProfileSettingsModal;
