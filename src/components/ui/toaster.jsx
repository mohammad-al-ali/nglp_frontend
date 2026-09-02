import { Toaster as SonnerToaster } from 'sonner';

/**
 * طبقة الإشعارات (Toasts) الموحّدة للتطبيق — تُركَّب مرة واحدة في App.jsx.
 *
 * - تظهر أعلى الوسط، بمحاذاة RTL.
 * - تختفي تلقائياً بعد 3 ثواني (تُضبط المدة مركزياً في lib/toast.js).
 * - زر إغلاق يدوي + تكديس حتى 4 إشعارات.
 * - الألوان والخط يرثان نظام تصميم المشروع عبر متغيّرات CSS في index.css.
 */
export default function Toaster() {
  return (
    <SonnerToaster
      dir="rtl"
      position="top-center"
      closeButton
      richColors
      visibleToasts={4}
      gap={10}
      offset={{ top: '20px' }}
      toastOptions={{
        duration: 3000,
        classNames: {
          toast: 'nglp-toast',
          title: 'nglp-toast__title',
          description: 'nglp-toast__description',
          closeButton: 'nglp-toast__close',
        },
      }}
    />
  );
}
