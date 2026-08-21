import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { saveStoredUser } from '../../services/api';
import { isTeacher } from '@/lib/roles';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import FormField from '@/components/ui/form-field';
import ImagePicker from '@/components/ui/ImagePicker';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    roleId: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | submitting | error

  useEffect(() => {
    let isMounted = true;

    async function loadRoles() {
      try {
        const response = await api.get('/roles');
        const studentTeacherRoles = response.data.filter((role) => /STUDENT|TEACHER/i.test(role.name));
        if (isMounted) {
          setRoles(studentTeacherRoles);
          if (studentTeacherRoles.length > 0) {
            setForm((current) => ({ ...current, roleId: String(studentTeacherRoles[0]?.id || '') }));
          }
        }
      } catch (err) {
        console.warn('Failed to load user roles from backend.', err);
        if (isMounted) setRoles([]);
      }
    }

    loadRoles();
    return () => {
      isMounted = false;
    };
  }, []);

  function validate() {
    const nextErrors = {};
    if (!form.fullName.trim()) nextErrors.fullName = 'الاسم مطلوب.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'أدخل بريداً إلكترونياً صحيحاً.';
    }
    if (form.password.length < 6) {
      nextErrors.password = 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.';
    }
    if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'كلمتا المرور غير متطابقتين.';
    }
    return nextErrors;
  }

  async function submitForm(event) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus('submitting');
    try {
      const response = await api.post('/auth/register', {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        role: form.roleId ? { id: Number(form.roleId) } : undefined,
      });
      const user = response.data.user || response.data;
      saveStoredUser(user);

      if (avatarFile && user?.id) {
        const formData = new FormData();
        formData.append('image', avatarFile);
        try {
          const avatarResponse = await api.post(`/users/${user.id}/image`, formData);
          saveStoredUser(avatarResponse.data);
        } catch (avatarErr) {
          console.warn('Failed to upload avatar.', avatarErr);
        }
      }

      navigate(isTeacher(user) ? '/teacher' : '/dashboard');
    } catch (err) {
      console.error('Registration failed.', err);
      setStatus('error');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <Card className="w-full max-w-lg p-10">
        <p className="mb-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-primary">إنشاء حساب</p>
        <h1 className="font-display text-3xl font-semibold text-foreground">حساب جديد</h1>
        <p className="mb-8 mt-2 text-sm text-muted-foreground">
          سجّل كطالب أو معلّم وابدأ مسارك التعليمي.
        </p>

        <form onSubmit={submitForm} className="flex flex-col gap-5" noValidate>
          <FormField label="الاسم الكامل" error={errors.fullName} htmlFor="reg-name">
            <Input
              id="reg-name"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="محمد أحمد"
              aria-invalid={Boolean(errors.fullName)}
            />
          </FormField>

          <FormField label="البريد الإلكتروني" error={errors.email} htmlFor="reg-email">
            <Input
              id="reg-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@example.com"
              aria-invalid={Boolean(errors.email)}
            />
          </FormField>

          <FormField label="كلمة المرور" error={errors.password} htmlFor="reg-password" hint={!errors.password ? '6 أحرف على الأقل' : undefined}>
            <Input
              id="reg-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              aria-invalid={Boolean(errors.password)}
            />
          </FormField>

          <FormField label="تأكيد كلمة المرور" error={errors.confirmPassword} htmlFor="reg-confirm">
            <Input
              id="reg-confirm"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="••••••••"
              aria-invalid={Boolean(errors.confirmPassword)}
            />
          </FormField>

          <FormField label="نوع الحساب" htmlFor="reg-role">
            <Select
              id="reg-role"
              value={form.roleId}
              onChange={(e) => setForm({ ...form, roleId: e.target.value })}
            >
              {roles.length > 0 ? (
                roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {/TEACHER/i.test(role.name) ? 'معلّم' : 'طالب'}
                  </option>
                ))
              ) : (
                <>
                  <option value="1">طالب</option>
                  <option value="2">معلّم</option>
                </>
              )}
            </Select>
          </FormField>

          <ImagePicker
            label="صورة شخصية (اختياري)"
            hint="تظهر بجانب اسمك في القائمة الجانبية."
            onChange={setAvatarFile}
          />

          {status === 'error' && (
            <Alert variant="destructive">
              <AlertDescription>تعذّر إنشاء الحساب. تحقق من البيانات المدخلة أو حاول مرة أخرى لاحقاً.</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={status === 'submitting'} className="mt-2">
            {status === 'submitting' ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="font-medium text-primary transition-colors duration-200 ease-in-out hover:text-primary-hover">
            تسجيل الدخول
          </Link>
        </p>
      </Card>
    </div>
  );
}
