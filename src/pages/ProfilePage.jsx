import { useState, useEffect } from 'react';
import api, { getStoredUser, saveStoredUser, getCurrentUserId } from '../services/api';
import PageShell from '@/components/ui/page-shell';
import PageHeader from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import FormField from '@/components/ui/form-field';

export default function ProfilePage() {
  const storedUser = getStoredUser();
  const [form, setForm] = useState({
    fullName: storedUser?.fullName || '',
    email: storedUser?.email || '',
    password: '',
  });
  const [status, setStatus] = useState('idle'); // idle | saving | saved | error

  useEffect(() => {
    let isMounted = true;
    api.get('/users/' + getCurrentUserId())
      .then((response) => {
        if (isMounted) {
          saveStoredUser(response.data);
          setForm({
            fullName: response.data.fullName || '',
            email: response.data.email || '',
            password: '',
          });
        }
      })
      .catch((err) => console.warn('Could not fetch latest user profile info from backend.', err));
    return () => { isMounted = false; };
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
      setStatus('saved');
    } catch (err) {
      console.warn('Update profile API request failed.', err);
      setStatus('error');
    }
  }

  return (
    <PageShell>
      <PageHeader eyebrow="إعدادات الحساب" title="الملف الشخصي" />
      <div className="flex justify-center">
        <Card className="w-full max-w-lg p-9">
          <form onSubmit={submitForm} className="flex flex-col gap-5">
            <FormField label="الاسم الكامل" htmlFor="profile-name">
              <Input
                id="profile-name"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="محمد أحمد"
              />
            </FormField>

            <FormField label="البريد الإلكتروني" htmlFor="profile-email">
              <Input
                id="profile-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="name@example.com"
              />
            </FormField>

            <FormField label="كلمة مرور جديدة" htmlFor="profile-password" hint="اتركها فارغة للإبقاء على كلمة المرور الحالية">
              <Input
                id="profile-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
              />
            </FormField>

            {status === 'saved' && (
              <Alert variant="success">
                <AlertDescription>تم حفظ التغييرات بنجاح.</AlertDescription>
              </Alert>
            )}
            {status === 'error' && (
              <Alert variant="destructive">
                <AlertDescription>تعذّر حفظ التغييرات. يرجى المحاولة مرة أخرى.</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={status === 'saving'}>
              {status === 'saving' ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </form>
        </Card>
      </div>
    </PageShell>
  );
}
