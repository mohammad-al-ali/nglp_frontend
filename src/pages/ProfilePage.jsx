import { useState, useEffect, useRef } from 'react';
import { Camera } from 'lucide-react';
import api, { getStoredUser, saveStoredUser, getCurrentUserId } from '../services/api';
import { resolveMediaUrl } from '../utils/constants';
import PageShell from '@/components/ui/page-shell';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ROLE_LABELS = {
  ROLE_ADMIN: 'مشرف النظام',
  ROLE_TEACHER: 'معلّم',
  ROLE_STUDENT: 'طالب',
};

/**
 * Follows the Aduca template's profile-page anatomy — a large avatar + name
 * header, then a flat list of label/value rows with hairline dividers
 * (dashboard-profile.html). That reference page is read-only; the rows here
 * stay editable, since this app has no separate settings page to hold that.
 */
export default function ProfilePage() {
  const storedUser = getStoredUser();
  const [user, setUser] = useState(storedUser);
  const [form, setForm] = useState({
    fullName: storedUser?.fullName || '',
    email: storedUser?.email || '',
    password: '',
  });
  const [status, setStatus] = useState('idle'); // idle | saving | saved | error
  const [avatarStatus, setAvatarStatus] = useState('idle'); // idle | uploading | error
  const fileInputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    api
      .get('/users/' + getCurrentUserId())
      .then((response) => {
        if (isMounted) {
          saveStoredUser(response.data);
          setUser(response.data);
          setForm({
            fullName: response.data.fullName || '',
            email: response.data.email || '',
            password: '',
          });
        }
      })
      .catch((err) => console.warn('Could not fetch latest user profile info from backend.', err));
    return () => {
      isMounted = false;
    };
  }, []);

  async function submitForm(event) {
    event.preventDefault();
    setStatus('saving');
    try {
      const response = await api.put('/users/' + getCurrentUserId(), {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
      });
      saveStoredUser(response.data);
      setUser(response.data);
      setStatus('saved');
    } catch (err) {
      console.warn('Update profile API request failed.', err);
      setStatus('error');
    }
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setAvatarStatus('uploading');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await api.post(`/users/${getCurrentUserId()}/image`, formData);
      saveStoredUser(response.data);
      setUser(response.data);
      setAvatarStatus('idle');
    } catch (err) {
      console.warn('Failed to upload avatar.', err);
      setAvatarStatus('error');
    }
  }

  const roleName = String(user?.role?.name || '').toUpperCase();

  return (
    <PageShell>
      <div className="mb-10 flex flex-wrap items-center gap-5 border-b border-border pb-8">
        <div className="relative shrink-0">
          <div className="flex size-20 items-center justify-center overflow-hidden rounded-full border border-primary-border bg-primary-soft text-2xl font-bold text-primary">
            {user?.avatarUrl ? (
              <img src={resolveMediaUrl(user.avatarUrl)} alt="" className="size-full object-cover" />
            ) : (
              user?.fullName?.charAt(0) || 'U'
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarStatus === 'uploading'}
            title="تغيير الصورة الشخصية"
            className="absolute -end-1 -bottom-1 flex size-8 items-center justify-center rounded-full border-2 border-surface bg-primary text-primary-foreground shadow-soft transition-colors duration-200 ease-in-out hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Camera className="size-4" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
        </div>

        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">{user?.fullName || 'المستخدم'}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Badge>{ROLE_LABELS[roleName] || 'مستخدم'}</Badge>
            <span className="text-sm text-muted-foreground">{user?.email}</span>
          </div>
          {avatarStatus === 'uploading' && <p className="mt-1.5 text-xs text-muted-foreground">جاري رفع الصورة...</p>}
          {avatarStatus === 'error' && <p className="mt-1.5 text-xs text-error">تعذّر رفع الصورة، حاول مرة أخرى.</p>}
        </div>
      </div>

      <Card className="max-w-2xl p-8">
        <h2 className="mb-2 text-lg font-semibold text-foreground">بيانات الحساب</h2>
        <form onSubmit={submitForm} className="flex flex-col">
          <ProfileRow label="الاسم الكامل" htmlFor="profile-name">
            <Input
              id="profile-name"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="محمد أحمد"
            />
          </ProfileRow>

          <ProfileRow label="البريد الإلكتروني" htmlFor="profile-email">
            <Input
              id="profile-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@example.com"
            />
          </ProfileRow>

          <ProfileRow label="كلمة مرور جديدة" htmlFor="profile-password" hint="اتركها فارغة للإبقاء على كلمة المرور الحالية">
            <Input
              id="profile-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
          </ProfileRow>

          {status === 'saved' && (
            <Alert variant="success" className="mt-5">
              <AlertDescription>تم حفظ التغييرات بنجاح.</AlertDescription>
            </Alert>
          )}
          {status === 'error' && (
            <Alert variant="destructive" className="mt-5">
              <AlertDescription>تعذّر حفظ التغييرات. يرجى المحاولة مرة أخرى.</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={status === 'saving'} className="mt-6 self-start">
            {status === 'saving' ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </Button>
        </form>
      </Card>
    </PageShell>
  );
}

function ProfileRow({ label, htmlFor, hint, children }) {
  return (
    <div className="flex flex-col gap-2 border-b border-border py-5 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:gap-6">
      <Label htmlFor={htmlFor} className="shrink-0 sm:w-48">
        {label}
      </Label>
      <div className="flex-1">
        {children}
        {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}
