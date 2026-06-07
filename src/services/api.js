import axios from 'axios';

// 1. إعداد عميل Axios للاتصال بخادم Spring Boot
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  
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

export function getCurrentUserId() {
  return getStoredUser()?.id || 1;
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
    // إذا رد الخادم بخطأ 401 (غير مصرح) أو 403 (ممنوع من الدخول)
    // فهذا يعني أن الجلسة انتهت أو المستخدم غير مسجل دخول
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn("Authentication failed or session expired. Redirecting...");
      
      // يمكنك مستقبلاً تفعيل مسح البيانات وتوجيهه لشاشة الدخول تلقائياً
      // localStorage.removeItem(CURRENT_USER_KEY);
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;