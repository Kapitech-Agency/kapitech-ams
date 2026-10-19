import React, { useEffect, useMemo, useState } from 'react';
import { Briefcase, Building2, Camera, Mail, Phone, Save, Trash2, UserRound } from 'lucide-react';
import { Drawer } from '../ui/Drawer';
import Button from '../ui/Button';
import UserAvatar from './UserAvatar';
import { api } from '../../lib/apiClient';
import { cacheAdminSession, getAdminSession } from '../../lib/adminAuth';

interface UserProfileSettingsModalProps {
  open: boolean;
  onClose: () => void;
  displayName: string;
  title: string;
  slug?: string;
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
  title,
  slug = 'profile-edit'
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
  const [emailError, setEmailError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [initialDraft, setInitialDraft] = useState({
    name: displayName,
    bio: '',
    personalEmail: '',
    additionalPhone: '',
    avatarUrl: null as string | null
  });

  useEffect(() => {
    if (!open) return;
    const nextDraft = {
      name: String((user as any)?.profileDisplayName || displayName),
      bio: String((user as any)?.bio || ''),
      personalEmail: String((user as any)?.personalEmail || ''),
      additionalPhone: String((user as any)?.additionalPhone || ''),
      avatarUrl: (user as any)?.avatarUrl || null
    };
    setName(nextDraft.name);
    setBio(nextDraft.bio);
    setPersonalEmail(nextDraft.personalEmail);
    setAdditionalPhone(nextDraft.additionalPhone);
    setAvatarUrl(nextDraft.avatarUrl);
    setInitialDraft(nextDraft);
    setPhotoError(null);
    setStatus(null);
  }, [open, displayName, user?.id]);

  const companyEmail = user?.email || '';
  const primaryPhone = String((user as any)?.phone || '');

  const initialsPreview = useMemo(() => avatarUrl || undefined, [avatarUrl]);
  const currentDraft = useMemo(() => ({
    name,
    bio,
    personalEmail,
    additionalPhone,
    avatarUrl
  }), [name, bio, personalEmail, additionalPhone, avatarUrl]);
  const isDirty = JSON.stringify(currentDraft) !== JSON.stringify(initialDraft);
  const emailValid = !personalEmail.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalEmail.trim());

  const removePhoto = () => {
    if (saving) return;
    setAvatarUrl(null);
    setPhotoError(null);
  };

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
    if (!user?.id || !isDirty || saving) return;
    if (!name.trim()) {
      setStatus({ success: false, message: 'Full name is required.' });
      return;
    }
    if (!emailValid) {
      setEmailError('Enter a valid personal email address.');
      return;
    }
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
          detail: { name: payload.name, avatarUrl: payload.avatarUrl || null, bio: payload.bio, personalEmail: payload.personalEmail, additionalPhone: payload.additionalPhone, phone: current.user.phone || '' }
        }));
      }

      setInitialDraft({
        name: payload.name,
        bio: payload.bio,
        personalEmail: payload.personalEmail,
        additionalPhone: payload.additionalPhone,
        avatarUrl: payload.avatarUrl
      });
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

  const requestClose = () => {
    if (saving || isDirty) return;
    onClose();
  };

  const cancelChanges = () => {
    if (saving) return;
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={requestClose}
      closeOnOutsideClick={!isDirty && !saving}
      size="xl"
      slug={slug}
      title="Edit profile"
      description={isDirty ? 'You have unsaved changes. Save them or choose Cancel to discard them.' : 'Update the information shown on your AMS public profile.'}
      footer={(
        <>
          <Button type="button" variant="secondary" slug={slug + '-cancel'} onClick={cancelChanges} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            loading={saving}
            disabled={!isDirty || !emailValid}
            slug={slug + '-save'}
            icon={<Save size={14} />}
            onClick={() => void handleSave()}
          >
            Save changes
          </Button>
        </>
      )}
    >
      <div className="space-y-4" data-ams-feature-slug={slug}>
        <section className="rounded-card border border-line bg-bg p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <UserAvatar name={name} imageUrl={initialsPreview} size="lg" online />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <div className="text-sm font-semibold text-fg">{name || 'Your name'}</div>
                <span className="rounded-badge border border-accent/20 bg-accent/8 px-1.5 py-0.5 text-[10px] font-semibold text-accent-text">AMS profile</span>
              </div>
              <div className="mt-1 text-xs text-muted">{title}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-control border border-line bg-panel px-3 text-xs font-medium text-muted transition-colors hover:border-muted hover:bg-panel-hover hover:text-fg">
                <Camera size={14} />
                Change photo
                  <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} />
                </label>
                {avatarUrl && <Button type="button" variant="secondary" slug={slug + '-remove-photo'} icon={<Trash2 size={14} />} onClick={removePhoto} disabled={saving}>Remove photo</Button>}
              </div>
              {photoError && <p className="mt-2 text-[11px] text-danger">{photoError}</p>}
            </div>
          </div>
        </section>

        {status && (
          <div className={status.success
            ? 'rounded-control border border-success/20 bg-success/10 px-3 py-2.5 text-xs text-success'
            : 'rounded-control border border-danger/20 bg-danger/10 px-3 py-2.5 text-xs text-danger'}>
            {status.message}
          </div>
        )}

        {isDirty && (
          <div className="rounded-control border border-accent/20 bg-accent/6 px-3.5 py-2.5 text-xs text-muted">
            Unsaved changes are protected from accidental backdrop clicks. Use Save changes or Cancel to leave the dialog.
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-card border border-line bg-panel p-4">
            <div className="mb-4 border-b border-line pb-3">
              <h3 className="text-xs font-semibold text-fg">Identity</h3>
              <p className="mt-1 text-[10px] leading-4 text-muted">Visible profile information used across the AMS shell.</p>
            </div>

            <div className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted">Full name</span>
                <input value={name} onChange={(event) => setName(event.target.value)} />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted"><Briefcase size={13} />Role</span>
                  <div className="flex min-h-9 items-center rounded-control border border-line bg-bg px-3 text-[13px] text-fg">
                    {title}
                  </div>
                  <p className="text-[10px] text-muted">Assigned by AMS access policy.</p>
                </div>

                <div className="space-y-1.5">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted"><Building2 size={13} />Division</span>
                  <div className="flex min-h-9 items-center rounded-control border border-line bg-bg px-3 text-[13px] text-fg">
                    {user?.division || 'Operations'}
                  </div>
                  <p className="text-[10px] text-muted">Managed by your AMS access policy.</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted">Username</span>
                <div className="flex min-h-9 items-center rounded-control border border-line bg-bg px-3 text-[13px] text-fg">
                  {user?.username || '—'}
                </div>
                <p className="text-[10px] text-muted">Account identifier cannot be changed from profile.</p>
              </div>
            </div>
          </section>

          <section className="rounded-card border border-line bg-panel p-4">
            <div className="mb-4 border-b border-line pb-3">
              <h3 className="text-xs font-semibold text-fg">Contact details</h3>
              <p className="mt-1 text-[10px] leading-4 text-muted">Separate company-managed and personal contact information.</p>
            </div>

            <div className="space-y-4">
              <label className="block space-y-1.5">
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted"><Mail size={13} />Company email</span>
                <input value={companyEmail} readOnly aria-readonly="true" />
                <span className="text-[10px] leading-4 text-muted">Managed by Kapitech and cannot be changed here.</span>
              </label>

              <label className="block space-y-1.5">
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted"><Mail size={13} />Personal email</span>
                <input
                  value={personalEmail}
                  onChange={(event) => { setPersonalEmail(event.target.value); setEmailError(null); }}
                  type="email"
                  placeholder="name@example.com"
                />
                {emailError ? <span className="text-[10px] leading-4 text-danger">{emailError}</span> : <span className="text-[10px] leading-4 text-muted">Optional personal contact address.</span>}
              </label>

              <label className="block space-y-1.5">
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted"><Phone size={13} />Primary phone</span>
                <input value={primaryPhone} readOnly aria-readonly="true" placeholder="Managed by company" />
                <span className="text-[10px] leading-4 text-muted">Company-managed number cannot be changed here.</span>
              </label>

              <label className="block space-y-1.5">
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted"><Phone size={13} />Additional phone</span>
                <input
                  value={additionalPhone}
                  onChange={(event) => setAdditionalPhone(event.target.value)}
                  inputMode="tel"
                  placeholder="+62 ..."
                />
                <span className="text-[10px] leading-4 text-muted">Optional additional contact number.</span>
              </label>
            </div>
          </section>
        </div>

        <section className="rounded-card border border-line bg-panel p-4">
          <div className="mb-4 border-b border-line pb-3">
            <h3 className="text-xs font-semibold text-fg">Professional bio</h3>
            <p className="mt-1 text-[10px] leading-4 text-muted">A short description shown wherever your AMS profile is presented.</p>
          </div>
          <textarea
            rows={4}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="Add a short professional bio."
            maxLength={500}
            className="w-full resize-y"
          />
          <div className="mt-1 text-right text-[10px] text-muted">{bio.length}/500</div>
        </section>

        <div className="flex items-start gap-2.5 rounded-control border border-line bg-bg p-3 text-[11px] text-muted">
          <UserRound size={14} className="mt-0.5 shrink-0 text-accent-text" />
          <span>These fields update the public profile shown from the AMS sidebar and account controls. Access role and account identity remain managed by AMS.</span>
        </div>
      </div>
    </Drawer>
  );
};

export default UserProfileSettingsModal;
