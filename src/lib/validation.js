/**
 * قواعد تحقّق قابلة لإعادة الاستخدام + رسائلها العربية.
 *
 * كل قاعدة دالة تُعيد إمّا رسالة خطأ (string) أو null إذا كانت القيمة صالحة.
 * تُجمَّع القواعد في "schema" (خريطة: اسم الحقل → قائمة قواعد) ويستهلكها hook useForm.
 *
 * مثال:
 *   const schema = {
 *     email:    [required('البريد الإلكتروني'), email()],
 *     password: [required('كلمة المرور'), minLength(6)],
 *     confirm:  [match('password', 'كلمتا المرور غير متطابقتين.')],
 *   };
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isEmpty = (v) =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

export const messages = {
  required: (label) => (label ? `يرجى إدخال ${label}.` : 'هذا الحقل مطلوب.'),
  email: 'أدخل بريداً إلكترونياً صحيحاً.',
  minLength: (n) => `يجب ألا يقل عن ${n} أحرف.`,
  maxLength: (n) => `يجب ألا يزيد عن ${n} حرفاً.`,
  passwordMin: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.',
  passwordsMismatch: 'كلمتا المرور غير متطابقتين.',
  numberRange: (min, max) => `أدخل رقماً بين ${min} و ${max}.`,
  fileRequired: 'يرجى إرفاق ملف.',
  fileType: 'صيغة الملف غير مدعومة.',
  fileTooLarge: (mb) => `حجم الملف يتجاوز الحد المسموح (${mb} ميغابايت).`,
};

// ---------------------------------------------------------------
// القواعد
// ---------------------------------------------------------------

export const required = (label, customMessage) => (value) =>
  isEmpty(value) || (Array.isArray(value) && value.length === 0)
    ? customMessage || messages.required(label)
    : null;

export const email = () => (value) =>
  isEmpty(value) || EMAIL_RE.test(String(value).trim()) ? null : messages.email;

export const minLength = (n, msg) => (value) =>
  !isEmpty(value) && String(value).length < n ? msg || messages.minLength(n) : null;

export const maxLength = (n, msg) => (value) =>
  !isEmpty(value) && String(value).length > n ? msg || messages.maxLength(n) : null;

export const password = () => (value) =>
  isEmpty(value) || String(value).length >= 6 ? null : messages.passwordMin;

/** يقارن قيمة الحقل بقيمة حقل آخر في النموذج (يمرَّر كامل النموذج كوسيط ثانٍ). */
export const match = (otherField, msg) => (value, allValues) =>
  value === (allValues ? allValues[otherField] : undefined)
    ? null
    : msg || messages.passwordsMismatch;

export const range = (min, max, msg) => (value) => {
  if (isEmpty(value)) return null;
  const n = Number(value);
  return Number.isNaN(n) || n < min || n > max ? msg || messages.numberRange(min, max) : null;
};

export const fileRequired = (msg) => (file) =>
  file instanceof File ? null : msg || messages.fileRequired;

/** يتحقق أن نوع/امتداد الملف ضمن القوائم المسموحة. */
export const fileType = (accept, msg) => (file) => {
  if (!(file instanceof File)) return null; // "مطلوب" مسؤولية fileRequired
  const types = accept.mimeTypes || [];
  const exts = accept.extensions || [];
  const nameOk = exts.length === 0 || exts.some((e) => file.name.toLowerCase().endsWith(e));
  const typeOk = types.length === 0 || types.includes(file.type);
  return nameOk && typeOk ? null : msg || messages.fileType;
};

export const fileMaxSizeMB = (mb, msg) => (file) => {
  if (!(file instanceof File)) return null;
  return file.size > mb * 1024 * 1024 ? msg || messages.fileTooLarge(mb) : null;
};

/**
 * يشغّل قائمة قواعد على قيمة واحدة ويُعيد أول رسالة خطأ (أو null).
 */
export function runRules(rules, value, allValues) {
  for (const rule of rules || []) {
    const result = rule(value, allValues);
    if (result) return result;
  }
  return null;
}

/**
 * يتحقق من كامل النموذج مقابل schema ويُعيد كائن أخطاء { field: message }.
 */
export function validateSchema(schema, values) {
  const errors = {};
  for (const field of Object.keys(schema || {})) {
    const message = runRules(schema[field], values[field], values);
    if (message) errors[field] = message;
  }
  return errors;
}
