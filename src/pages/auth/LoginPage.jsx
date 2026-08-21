import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { saveStoredUser } from '../../services/api';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import FormField from '@/components/ui/form-field';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate() {
    const nextErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'أدخل بريداً إلكترونياً صحيحاً.';
    }
    if (form.password.length < 6) {
      nextErrors.password = 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.';
    }
    return nextErrors;
  }

  async function submitForm(event) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/login', form);
      const user = response.data.user || response.data;
      saveStoredUser(user);

      const roleName = user.role?.name || user.role || '';
      if (/ADMIN/i.test(roleName)) {
        navigate('/admin/categories');
      } else if (/TEACHER/i.test(roleName)) {
        navigate('/teacher');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrors({
        password: 'البريد الإلكتروني أو كلمة المرور غير صحيحة، أو أن الخادم غير متاح حالياً.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <Card className="w-full max-w-md p-10">
        <p className="mb-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-primary">
          الدخول إلى الحساب
        </p>
        <h1 className="font-display text-3xl font-semibold text-foreground">مرحباً بعودتك</h1>
        <p className="mb-8 mt-2 text-sm text-muted-foreground">
          سجّل الدخول لمتابعة كورساتك وجلسات المساعد الذكي.
        </p>

        <form onSubmit={submitForm} className="flex flex-col gap-5" noValidate>
          <FormField label="البريد الإلكتروني" error={errors.email} htmlFor="login-email">
            <Input
              id="login-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@example.com"
              aria-invalid={Boolean(errors.email)}
            />
          </FormField>

          <FormField label="كلمة المرور" error={errors.password} htmlFor="login-password">
            <Input
              id="login-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              aria-invalid={Boolean(errors.password)}
            />
          </FormField>

          <Button type="submit" disabled={isSubmitting} className="mt-2">
            {isSubmitting ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          ليس لديك حساب؟{' '}
          <Link to="/register" className="font-medium text-primary transition-colors duration-200 ease-in-out hover:text-primary-hover">
            إنشاء حساب جديد
          </Link>
        </p>
      </Card>
    </div>
  );
}
