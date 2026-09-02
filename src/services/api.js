import axios from 'axios';
import { getApiErrorMessage, getFieldErrors, getApiErrorCode } from '@/lib/apiError';

// عنوان الـ API الأساسي — مصدر واحد، بدل ثلاث نسخ متفرقة بأشكال مختلفة
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// 1. إعداد عميل Axios للاتصال بخادم Spring Boot
const api = axios.create({
  baseURL: API_BASE_URL,

  // 🌟 مهم جداً: هذا السطر يخبر المتصفح بإرسال ملفات تعريف الارتباط (Cookies/JSESSIONID) 
  // مع كل طلب. وهو ضروري جداً إذا كان Spring Security لديك يعتمد على الجلسات حالياً.
  withCredentials: true, 
});

const CURRENT_USER_KEY = 'nglp.currentUser';

// دوال إدارة المستخدم في التخزين المحلي
export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
  } catch {
    return null;
  }
}

export function saveStoredUser(user) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

// يعيد null إذا لا يوجد مستخدم مسجّل دخول فعلياً — لا افتراض صامت لهوية "المستخدم رقم 1"،
// فذلك كان يجعل أي زائر غير مسجّل يُعامَل ضمنياً كأنه المستخدم صاحب المعرّف 1 دون أي إشارة لذلك.
export function getCurrentUserId() {
  return getStoredUser()?.id ?? null;
}

// ==========================================
// 🌟 هنا يكمن السحر: Axios Request Interceptor
// ==========================================
api.interceptors.request.use(
  (config) => {
    // 1. جلب بيانات المستخدم الحالي قبل خروج الطلب
    const user = getStoredUser();

    if (user) {
      // 2. مستقبلاً عندما تفعل الـ JWT، ستقوم بفك التعليق عن هذا السطر فقط:
      // config.headers.Authorization = Bearer ${user.token};

      // حالياً كحل إضافي، يمكنك إرسال رقم المستخدم في الهيدر ليتعرف عليه الـ Backend
      config.headers['X-User-Id'] = user.id;
      config.headers['X-User-Role'] = user.role?.name || user.role;
    }

    // السماح للطلب بالخروج بعد تعديله
    return config;
  },
  (error) => {
    // في حال حدوث خطأ قبل إرسال الطلب
    return Promise.reject(error);
  }
);

// ==========================================
// 🌟 معترض الاستجابة (Response Interceptor) - اختياري ولكنه مفيد
// ==========================================
api.interceptors.response.use(
  (response) => {
    return response; // إذا كان الرد سليماً، مرره
  },
  (error) => {
    // إرفاق رسالة عربية موحّدة + أخطاء الحقول بكائن الخطأ ليستهلكها أي مستدعٍ مباشرة.
    error.friendlyMessage = getApiErrorMessage(error);
    error.fieldErrors = getFieldErrors(error);
    error.apiErrorCode = getApiErrorCode(error);

    // انتهاء الجلسة (401) — نُخرج المستخدم لصفحة الدخول (مع تجاهل نداءات auth نفسها).
    // ملاحظة: 403 (صلاحية غير كافية) يبقى خطأ عادياً تعرضه الصفحة، لا يسبب تسجيل خروج.
    const status = error.response && error.response.status;
    const url = (error.config && error.config.url) || '';
    const isAuthCall = url.includes('/auth/');
    if (status === 401 && !isAuthCall && getStoredUser()) {
      console.warn('انتهت الجلسة — إعادة توجيه لصفحة الدخول.');
      localStorage.removeItem(CURRENT_USER_KEY);
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;