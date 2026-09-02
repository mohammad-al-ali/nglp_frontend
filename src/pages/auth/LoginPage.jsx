import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { saveStoredUser } from '../../services/api';
import { useForm } from '@/hooks/useForm';
import { required, email as emailRule, password as passwordRule } from '@/lib/validation';
import { notify } from '@/lib/toast';
import { SUCCESS } from '@/lib/messages';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import FormField from '@/components/ui/form-field';

const schema = {
  email: [required('البريد الإلكتروني'), emailRule()],
  password: [required('كلمة المرور'), passwordRule()],
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { values, errors, setValue, handleBlur, validateAll, setServerErrors } = useForm(
    { email: '', password: '' },
    schema
  );

  async function submitForm(event) {
    event.preventDefault();
    if (!validateAll()) return;

    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/login', {
        email: values.email.trim(),
        password: values.password,
      });
      const user = response.data.user || response.data;
      saveStoredUser(user);
      notify.success(SUCCESS.LOGIN);

      const roleName = user.role?.name || user.role || '';
      if (/ADMIN/i.test(roleName)) {
        navigate('/admin/categories');
      } else if (/TEACHER/i.test(roleName)) {
        navigate('/teacher');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setServerErrors(err.fieldErrors);
      notify.error(err.friendlyMessage);
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
              value={values.email}
              onChange={(e) => setValue('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              placeholder="name@example.com"
              aria-invalid={Boolean(errors.email)}
            />
          </FormField>

          <FormField label="كلمة المرور" error={errors.password} htmlFor="login-password">
            <Input
              id="login-password"
              type="password"
              value={values.password}
              onChange={(e) => setValue('password', e.target.value)}
              onBlur={() => handleBlur('password')}
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
