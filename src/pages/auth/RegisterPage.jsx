import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { saveStoredUser } from '../../services/api';
import { isTeacher } from '@/lib/roles';
import { useForm } from '@/hooks/useForm';
import {
  required,
  email as emailRule,
  password as passwordRule,
  match,
  fileType,
  fileMaxSizeMB,
} from '@/lib/validation';
import { notify } from '@/lib/toast';
import { SUCCESS } from '@/lib/messages';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import FormField from '@/components/ui/form-field';
import ImagePicker from '@/components/ui/ImagePicker';

const schema = {
  fullName: [required('الاسم الكامل')],
  email: [required('البريد الإلكتروني'), emailRule()],
  password: [required('كلمة المرور'), passwordRule()],
  confirmPassword: [
    required(null, 'يرجى تأكيد كلمة المرور.'),
    match('password', 'كلمتا المرور غير متطابقتين.'),
  ],
  roleId: [required(null, 'يرجى اختيار نوع الحساب.')],
  avatar: [
    fileType(
      { mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], extensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'] },
      'صيغة الصورة غير مدعومة. الصيغ المسموحة: JPG، PNG، WEBP، GIF.'
    ),
    fileMaxSizeMB(5, 'حجم الصورة يتجاوز 5 ميغابايت.'),
  ],
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { values, errors, setValue, setValuesBulk, handleBlur, validateAll, setServerErrors } = useForm(
    { fullName: '', email: '', password: '', confirmPassword: '', roleId: '', avatar: null },
    schema
  );

  useEffect(() => {
    let isMounted = true;
    async function loadRoles() {
      try {
        const response = await api.get('/roles');
        const studentTeacherRoles = response.data.filter((role) => /STUDENT|TEACHER/i.test(role.name));
        if (isMounted) {
          setRoles(studentTeacherRoles);
          if (studentTeacherRoles.length > 0) {
            setValuesBulk({ roleId: String(studentTeacherRoles[0]?.id || '') });
          }
        }
      } catch {
        if (isMounted) setRoles([]);
      }
    }
    loadRoles();
    return () => {
      isMounted = false;
    };
  }, [setValuesBulk]);

  async function submitForm(event) {
    event.preventDefault();
    if (!validateAll()) return;

    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/register', {
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        password: values.password,
        roleId: values.roleId ? Number(values.roleId) : null,
      });
      const user = response.data.user || response.data;
      saveStoredUser(user);

      if (values.avatar && user?.id) {
        const formData = new FormData();
        formData.append('image', values.avatar);
        try {
          const avatarResponse = await api.post(`/users/${user.id}/image`, formData);
          saveStoredUser(avatarResponse.data);
        } catch {
          notify.warning('تم إنشاء الحساب، لكن تعذّر رفع الصورة الشخصية.');
        }
      }

      notify.success(SUCCESS.REGISTER);
      navigate(isTeacher(user) ? '/teacher' : '/dashboard');
    } catch (err) {
      setServerErrors(err.fieldErrors);
      notify.error(err.friendlyMessage);
    } finally {
      setIsSubmitting(false);
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
              value={values.fullName}
              onChange={(e) => setValue('fullName', e.target.value)}
              onBlur={() => handleBlur('fullName')}
              placeholder="محمد أحمد"
              aria-invalid={Boolean(errors.fullName)}
            />
          </FormField>

          <FormField label="البريد الإلكتروني" error={errors.email} htmlFor="reg-email">
            <Input
              id="reg-email"
              type="email"
              value={values.email}
              onChange={(e) => setValue('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              placeholder="name@example.com"
              aria-invalid={Boolean(errors.email)}
            />
          </FormField>

          <FormField
            label="كلمة المرور"
            error={errors.password}
            htmlFor="reg-password"
            hint={!errors.password ? '6 أحرف على الأقل' : undefined}
          >
            <Input
              id="reg-password"
              type="password"
              value={values.password}
              onChange={(e) => setValue('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              placeholder="••••••••"
              aria-invalid={Boolean(errors.password)}
            />
          </FormField>

          <FormField label="تأكيد كلمة المرور" error={errors.confirmPassword} htmlFor="reg-confirm">
            <Input
              id="reg-confirm"
              type="password"
              value={values.confirmPassword}
              onChange={(e) => setValue('confirmPassword', e.target.value)}
              onBlur={() => handleBlur('confirmPassword')}
              placeholder="••••••••"
              aria-invalid={Boolean(errors.confirmPassword)}
            />
          </FormField>

          <FormField label="نوع الحساب" error={errors.roleId} htmlFor="reg-role">
            <Select
              id="reg-role"
              value={values.roleId}
              onChange={(e) => setValue('roleId', e.target.value)}
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

          <FormField error={errors.avatar}>
            <ImagePicker
              label="صورة شخصية (اختياري)"
              hint="تظهر بجانب اسمك في القائمة الجانبية."
              onChange={(file) => setValue('avatar', file)}
            />
          </FormField>

          <Button type="submit" disabled={isSubmitting} className="mt-2">
            {isSubmitting ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
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
