import { toast } from 'sonner';

/**
 * غلاف رفيع حول مكتبة sonner — نقطة مركزية واحدة لكل إشعارات النجاح/الخطأ في التطبيق.
 *
 * الفائدة:
 *  - توحيد المدة (3 ثواني) والأسلوب في مكان واحد.
 *  - عزل بقية الكود عن اسم المكتبة (يمكن استبدالها لاحقاً دون لمس الصفحات).
 *
 * الاستخدام:
 *  import { notify } from '@/lib/toast';
 *  notify.success('تم حفظ التغييرات');
 *  notify.error('تعذّر الاتصال بالخادم');
 */
const DEFAULT_DURATION = 3000;

export const notify = {
  success: (message, options) =>
    toast.success(message, { duration: DEFAULT_DURATION, ...options }),

  error: (message, options) =>
    toast.error(message, { duration: DEFAULT_DURATION, ...options }),

  warning: (message, options) =>
    toast.warning(message, { duration: DEFAULT_DURATION, ...options }),

  info: (message, options) =>
    toast.info(message, { duration: DEFAULT_DURATION, ...options }),

  /** إشعار محايد بدون أيقونة نوع. */
  message: (message, options) =>
    toast(message, { duration: DEFAULT_DURATION, ...options }),

  /** لإخفاء إشعار بعينه أو الكل. */
  dismiss: (id) => toast.dismiss(id),
};

export default notify;
