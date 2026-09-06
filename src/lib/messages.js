/**
 * نصوص رسائل النجاح والأخطاء الشائعة بالعربية — مصدر واحد لتوحيد النبرة عبر التطبيق.
 */

export const SUCCESS = {
  LOGIN: 'تم تسجيل الدخول بنجاح، أهلاً بعودتك',
  REGISTER: 'تم إنشاء حسابك بنجاح',
  LOGOUT: 'تم تسجيل الخروج',
  PROFILE_SAVED: 'تم حفظ التغييرات بنجاح',
  AVATAR_UPDATED: 'تم تحديث الصورة الشخصية',

  COURSE_CREATED: 'تم إنشاء الكورس بنجاح',
  COURSE_UPDATED: 'تم تحديث بيانات الكورس',
  COURSE_DELETED: 'تم حذف الكورس',
  COURSE_IMAGE_UPDATED: 'تم تحديث صورة الكورس',

  LESSON_UPLOADED: (title) => `تم رفع الدرس «${title}» بنجاح`,
  LESSONS_UPLOADED: (count) => `تم رفع ${count} درساً بنجاح`,
  LESSON_UPDATED: 'تم تحديث الدرس',
  LESSON_DELETED: 'تم حذف الدرس',

  QUIZ_GENERATED: 'تم توليد الاختبار بنجاح',
  QUIZ_PUBLISHED: 'تم نشر الاختبار، أصبح متاحاً للطلاب الآن',
  QUESTION_SAVED: 'تم حفظ السؤال',
  QUESTION_DELETED: 'تم حذف السؤال',
  QUIZ_SUBMITTED: (score) => `تم تسليم إجاباتك — نتيجتك: ${score}`,

  CATEGORY_CREATED: 'تم إنشاء التصنيف',
  CATEGORY_UPDATED: 'تم تحديث التصنيف',
  CATEGORY_DELETED: 'تم حذف التصنيف',

  USER_ROLE_UPDATED: 'تم تحديث دور المستخدم',
  USER_BLOCK_UPDATED: 'تم تحديث حالة الحساب',
  USER_DELETED: 'تم حذف المستخدم',

  ENROLLED: 'تم تسجيلك في الكورس بنجاح',
  UNENROLLED: 'تم إلغاء تسجيلك في الكورس',
  PROGRESS_SAVED: 'تم حفظ تقدّمك',
};

export const ERROR = {
  GENERIC: 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً.',
  NETWORK: 'تعذّر الاتصال بالخادم، تأكد من اتصالك بالإنترنت وحاول مجدداً.',
  FORM_INVALID: 'يرجى تصحيح الحقول المميّزة ثم إعادة المحاولة.',
  SESSION_EXPIRED: 'انتهت جلستك، يرجى تسجيل الدخول من جديد.',

  LOGIN_FAILED: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  REGISTER_FAILED: 'تعذّر إنشاء الحساب، تحقّق من البيانات وحاول مجدداً.',

  COURSE_SAVE_FAILED: 'تعذّر حفظ الكورس، حاول مجدداً.',
  LESSON_UPLOAD_FAILED: (title) => `تعذّر رفع الدرس${title ? ` «${title}»` : ''}.`,
  QUIZ_ACTION_FAILED: 'تعذّر تنفيذ العملية على الاختبار.',
};

export default { SUCCESS, ERROR };
