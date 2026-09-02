/**
 * معالجة موحّدة لأخطاء الـ API القادمة من axios.
 *
 * الـ backend يرجّع الآن شكل خطأ موحّد (ApiError):
 *   { timestamp, status, code, message, path, fieldErrors: [{ field, message }] }
 * مع دعم رجعي للشكل القديم { error: "..." }.
 */

const NETWORK_ERROR_MESSAGE =
  'تعذّر الاتصال بالخادم، تأكد من اتصالك بالإنترنت وحاول مجدداً.';
const GENERIC_ERROR_MESSAGE = 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً.';

/**
 * يستخرج رسالة عربية جاهزة للعرض من كائن خطأ axios.
 * @param {unknown} err
 * @param {string} [fallback] رسالة بديلة خاصة بالسياق
 * @returns {string}
 */
export function getApiErrorMessage(err, fallback) {
  // لا يوجد رد من الخادم إطلاقاً (انقطاع شبكة، الخادم متوقف، CORS...)
  if (err && err.request && !err.response) {
    return NETWORK_ERROR_MESSAGE;
  }

  const data = err && err.response && err.response.data;
  if (data) {
    if (typeof data === 'string' && data.trim()) return data.trim();
    if (data.message) return data.message;
    if (data.error) return data.error;
  }

  if (err && err.message && !/^Request failed with status/i.test(err.message)) {
    return err.message;
  }

  return fallback || GENERIC_ERROR_MESSAGE;
}

/**
 * يحوّل fieldErrors القادمة من الـ backend إلى كائن { field: message }
 * جاهز لدمجه في حالة errors في النماذج.
 * @param {unknown} err
 * @returns {Record<string, string>}
 */
export function getFieldErrors(err) {
  const list =
    err && err.response && err.response.data && err.response.data.fieldErrors;
  if (!Array.isArray(list)) return {};

  const result = {};
  for (const item of list) {
    if (item && item.field && item.message && !result[item.field]) {
      result[item.field] = item.message;
    }
  }
  return result;
}

/** رمز الخطأ البرمجي (code) إن وُجد — مفيد للتفريع على حالات بعينها. */
export function getApiErrorCode(err) {
  return (err && err.response && err.response.data && err.response.data.code) || null;
}

export { NETWORK_ERROR_MESSAGE, GENERIC_ERROR_MESSAGE };
