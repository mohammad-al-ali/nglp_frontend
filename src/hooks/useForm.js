import { useCallback, useState } from 'react';
import { runRules, validateSchema } from '@/lib/validation';

/**
 * Hook موحّد لإدارة النماذج المتحكَّم بها + التحقق — يستبدل نمط
 * (form / errors / validate()) المكرّر يدوياً في كل صفحة.
 *
 * @param {object} initialValues القيم الابتدائية
 * @param {object} schema        خريطة: اسم الحقل → قائمة قواعد (من lib/validation)
 *
 * الاستخدام:
 *   const { values, errors, setValue, handleBlur, validateAll, setServerErrors } =
 *     useForm({ email: '', password: '' }, {
 *       email: [required('البريد الإلكتروني'), email()],
 *       password: [required('كلمة المرور'), password()],
 *     });
 */
export function useForm(initialValues, schema = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const setValue = useCallback(
    (field, value) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      // امسح خطأ الحقل فور تعديله (تجربة ألطف من إبقاء الخطأ حتى الإرسال التالي)
      setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
    },
    []
  );

  /** لتحديث عدة حقول دفعة واحدة (مثل تحميل بيانات من الخادم). */
  const setValuesBulk = useCallback((patch) => {
    setValues((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleBlur = useCallback(
    (field) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      setValues((current) => {
        const message = runRules(schema[field], current[field], current);
        setErrors((prev) => ({ ...prev, [field]: message || undefined }));
        return current;
      });
    },
    [schema]
  );

  /** يتحقق من كل الحقول ويُحدّث errors؛ يُعيد true إذا كان النموذج صالحاً. */
  const validateAll = useCallback(() => {
    const nextErrors = validateSchema(schema, values);
    setErrors(nextErrors);
    setTouched(
      Object.keys(schema).reduce((acc, k) => ({ ...acc, [k]: true }), {})
    );
    return Object.keys(nextErrors).length === 0;
  }, [schema, values]);

  /** لدمج أخطاء الحقول القادمة من الـ backend (fieldErrors). */
  const setServerErrors = useCallback((serverErrors) => {
    if (serverErrors && Object.keys(serverErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...serverErrors }));
    }
  }, []);

  const setError = useCallback((field, message) => {
    setErrors((prev) => ({ ...prev, [field]: message || undefined }));
  }, []);

  const reset = useCallback(
    (nextValues) => {
      setValues(nextValues || initialValues);
      setErrors({});
      setTouched({});
    },
    [initialValues]
  );

  return {
    values,
    errors,
    touched,
    setValue,
    setValuesBulk,
    handleBlur,
    validateAll,
    setServerErrors,
    setError,
    reset,
  };
}

export default useForm;
