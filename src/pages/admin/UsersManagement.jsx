import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getStoredUser } from '../../services/api';
import PageFrame from '../../components/ui/PageFrame';

/**
 * لوحة تحكم المشرف الشاملة (Comprehensive Admin Dashboard)
 * تتيح التحكم الكامل في الأعضاء (ترقية، حظر، حذف) وفي الكورسات (استعراض وحذف) 
 * مع عرض إحصائيات بصرية ورسوم بيانية تفاعلية حديثة، وتأمين وصول صارم للمشرفين فقط.
 */
export default function UsersManagement() {
  const currentUser = getStoredUser();
  
  // 🛡️ 1. التحقق الصارم من حماية الصفحة في الفرونت إند لمنع أي متسلل غير المشرف
  const roleStr = String(currentUser?.role?.name || currentUser?.role || '').toUpperCase();
  const isAdmin = roleStr.includes('ADMIN');

  // تعريف حالات الواجهة (States)
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users'); // 'users' أو 'courses'
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // حالات لتأكيد الحذف
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleteType, setDeleteType] = useState(''); // 'user' أو 'course'

  // تحميل البيانات الحية من قاعدة البيانات
  useEffect(() => {
    if (!isAdmin) return; // حجب الاستدعاءات إذا كان ليس مشرفاً

    let isMounted = true;
    async function loadDashboardData() {
      try {
        setLoading(true);
        // استدعاء متوازٍ للمستخدمين، الأدوار، والكورسات لتقليل زمن الاستجابة
        const [usersRes, rolesRes, coursesRes] = await Promise.all([
          api.get('/users'),
          api.get('/roles'),
          api.get('/courses')
        ]);
        
        if (isMounted) {
          setUsers(usersRes.data);
          setRoles(rolesRes.data);
          setCourses(coursesRes.data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load admin dashboard data:', err);
        if (isMounted) {
          setErrorMsg('حدث خطأ أثناء تحميل البيانات من الخادم، يرجى التأكد من تشغيل Spring Boot.');
          setLoading(false);
        }
      }
    }

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  // إخفاء التنبيهات تلقائياً بعد 4 ثوانٍ
  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg('');
        setErrorMsg('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  // 🛡️ إذا كان المستخدم ليس مشرفاً، اعرض فوراً بطاقة الرفض الفاخرة لحماية الصفحة
  if (!isAdmin) {
    return (
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          fontFamily: 'var(--font-sans)',
          direction: 'rtl',
          padding: '20px'
        }}
      >
        <div 
          className="premium-card animate-fade-in"
          style={{
            maxWidth: '500px',
            width: '100%',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '40px 30px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(239, 68, 68, 0.08)'
          }}
        >
          <div 
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 24px auto',
              color: 'var(--error)'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '40px', height: '40px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '12px' }}>
            وصول غير مصرح به!
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '28px' }}>
            عذراً، هذه الصفحة مخصصة لمدراء النظام والمشرفين فقط. لقد تم تسجيل هذه المحاولة لأغراض الأمان الأكاديمي.
          </p>
          <Link 
            to="/" 
            className="primary-button" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: '12px 28px',
              backgroundColor: 'var(--primary)',
              color: 'var(--text-inverse)',
              textDecoration: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: '700',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)'
            }}
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  // حساب إحصائيات الأعضاء والكورسات ديناميكياً
  const totalUsersCount = users.length;
  const teachersCount = users.filter((u) => String(u.role?.name || u.role || '').toUpperCase().includes('TEACHER')).length;
  const studentsCount = users.filter((u) => String(u.role?.name || u.role || '').toUpperCase().includes('STUDENT')).length;
  const adminsCount = users.filter((u) => String(u.role?.name || u.role || '').toUpperCase().includes('ADMIN')).length;
  const totalCoursesCount = courses.length;

  // دالة تحديث بيانات الأعضاء (الحظر وتغيير الدور)
  async function handleUpdateUser(userId, changes) {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;
    
    // تكوين الكائن المحدث للحفاظ على تناسق البيانات
    const updatedUser = { ...targetUser, ...changes };
    
    // تحديث محلي فوري لإشعار المستخدم بالسرعة
    setUsers((current) => current.map((u) => (u.id === userId ? updatedUser : u)));
    
    try {
      // إرسال التحديث للخلفية مع إرفاق هيدر الحماية
      await api.put(`/users/${userId}/admin`, {
        role: updatedUser.role,
        blocked: updatedUser.blocked,
      });
      setSuccessMsg('تم تحديث صلاحيات الحساب بنجاح في قاعدة البيانات.');
    } catch (err) {
      console.error('Failed to update user in DB:', err);
      setErrorMsg('فشل تحديث الحساب بالخلفية. يرجى التحقق من الصلاحيات.');
    }
  }

  // دالة حذف مستخدم نهائياً
  async function handleDeleteUser(userId) {
    try {
      await api.delete(`/users/${userId}`);
      setUsers((current) => current.filter((u) => u.id !== userId));
      setSuccessMsg('تم حذف الحساب نهائياً من قاعدة البيانات.');
    } catch (err) {
      console.error('Failed to delete user:', err);
      setErrorMsg('تعذر حذف العضو. تأكد من عدم ارتباطه بكورسات أو سجلات نشطة.');
    }
    setConfirmDeleteId(null);
  }

  // دالة حذف كورس نهائياً
  async function handleDeleteCourse(courseId) {
    try {
      await api.delete(`/courses/${courseId}`);
      setCourses((current) => current.filter((c) => c.id !== courseId));
      setSuccessMsg('تم حذف الكورس الأكاديمي بنجاح.');
    } catch (err) {
      console.error('Failed to delete course:', err);
      setErrorMsg('تعذر حذف الكورس من قاعدة البيانات.');
    }
    setConfirmDeleteId(null);
  }

  // حساب نسب الرسم البياني SVG Donut Chart
  const graphTotal = totalUsersCount || 1;
  const studentPercent = Math.round((studentsCount / graphTotal) * 100);
  const teacherPercent = Math.round((teachersCount / graphTotal) * 100);
  const adminPercent = Math.round((adminsCount / graphTotal) * 100);

  // حساب إحداثيات رسم دائرة الـ SVG
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  
  // تحديد طول الخط لكل فئة في الدائرة
  const strokeDashStudent = (studentPercent / 100) * circumference;
  const strokeDashTeacher = (teacherPercent / 100) * circumference;
  const strokeDashAdmin = (adminPercent / 100) * circumference;

  return (
    <PageFrame 
      eyebrow="لوحة التحكم الإشرافية" 
      title="لوحة الإدارة والمتابعة الشاملة" 
      actions={
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link 
            className="secondary-button" 
            to="/admin/categories"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              minHeight: '40px',
              padding: '0 18px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontWeight: '700',
              fontSize: '0.88rem',
              backgroundColor: 'var(--surface)',
              color: 'var(--text-main)',
              textDecoration: 'none',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all var(--transition-fast)'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '16px', height: '16px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.008 1.24l.885 1.77a2.25 2.25 0 0 0 2.007 1.24h1.98a2.25 2.25 0 0 0 2.007-1.24l.885-1.77a2.25 2.25 0 0 1 2.007-1.24h3.86m-18 0h18" />
            </svg>
            إدارة التصنيفات الأكاديمية
          </Link>
        </div>
      }
    >
      <div style={{ direction: 'rtl', fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* تنبيهات النجاح والفشل التفاعلية */}
        {successMsg && (
          <div style={{ padding: '14px 20px', backgroundColor: 'rgba(34, 197, 94, 0.08)', borderRight: '4px solid var(--success)', borderRadius: 'var(--radius-md)', color: 'var(--success)', fontSize: '0.925rem', fontWeight: '700' }} className="animate-fade-in">
            ✓ {successMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{ padding: '14px 20px', backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRight: '4px solid var(--error)', borderRadius: 'var(--radius-md)', color: 'var(--error)', fontSize: '0.925rem', fontWeight: '700' }} className="animate-fade-in">
            ⚠ {errorMsg}
          </div>
        )}

        {/* 📊 بطاقات الإحصائيات الحية الأربعة */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
            gap: '20px' 
          }}
        >
          {/* كارت الأعضاء الإجمالي */}
          <div 
            className="premium-card" 
            style={{ 
              padding: '24px', 
              backgroundColor: 'var(--surface)', 
              border: '1px solid var(--border)', 
              borderRadius: 'var(--radius-lg)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '20px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(37, 99, 235, 0.08)', color: 'var(--primary)', display: 'grid', placeItems: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '28px', height: '28px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0 1 10.089 20.8c-2.113 0-4.102-.57-5.837-1.567a4.125 4.125 0 0 1 7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M14.25 5.75c1.255 0 2.364.551 3.12 1.43m-3.12-1.43a3.75 3.75 0 0 0-6.24 0m6.24 0v-.003c0-1.045-.253-2.036-.702-2.912M14.25 5.75c.449.876.702 1.867.702 2.909v.01a3.75 3.75 0 1 1-7.5 0v-.01c0-1.042.253-2.033.702-2.909m0 2.912a3.75 3.75 0 0 0-6.24 0M10.875 18.75a8.874 8.874 0 0 0 2.25-1.5M10.875 18.75a8.874 8.874 0 0 1-2.25-1.5m2.25 1.5a8.874 8.874 0 0 0 2.25-1.5" />
              </svg>
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>إجمالي الأعضاء</span>
              <strong style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {loading ? '...' : totalUsersCount}
              </strong>
            </div>
          </div>

          {/* كارت الطلاب */}
          <div 
            className="premium-card" 
            style={{ 
              padding: '24px', 
              backgroundColor: 'var(--surface)', 
              border: '1px solid var(--border)', 
              borderRadius: 'var(--radius-lg)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '20px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(34, 197, 94, 0.08)', color: 'var(--success)', display: 'grid', placeItems: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '28px', height: '28px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.57 50.57 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A57.217 57.217 0 0 1 12 13.5c1.86 0 3.69-.168 5.25-.494V15a.75.75 0 0 0 1.5 0" />
              </svg>
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>الطلاب الفاعلون</span>
              <strong style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--success)' }}>
                {loading ? '...' : studentsCount}
              </strong>
            </div>
          </div>

          {/* كارت المعلمين */}
          <div 
            className="premium-card" 
            style={{ 
              padding: '24px', 
              backgroundColor: 'var(--surface)', 
              border: '1px solid var(--border)', 
              borderRadius: 'var(--radius-lg)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '20px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(139, 92, 246, 0.08)', color: '#8b5cf6', display: 'grid', placeItems: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '28px', height: '28px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>أعضاء الهيئة التدريسية</span>
              <strong style={{ fontSize: '1.8rem', fontWeight: '800', color: '#8b5cf6' }}>
                {loading ? '...' : teachersCount}
              </strong>
            </div>
          </div>

          {/* كارت الكورسات الأكاديمية */}
          <div 
            className="premium-card" 
            style={{ 
              padding: '24px', 
              backgroundColor: 'var(--surface)', 
              border: '1px solid var(--border)', 
              borderRadius: 'var(--radius-lg)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '20px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(245, 158, 11, 0.08)', color: 'var(--warning)', display: 'grid', placeItems: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '28px', height: '28px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>إجمالي الكورسات المفتوحة</span>
              <strong style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--warning)' }}>
                {loading ? '...' : totalCoursesCount}
              </strong>
            </div>
          </div>
        </div>

        {/* 📊 الرسم البياني الحديث التفاعلي (Interactive SVG Donut & Distribution Panel) */}
        <div 
          className="premium-card"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            boxShadow: 'var(--shadow-sm)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '30px',
            alignItems: 'center'
          }}
        >
          {/* الجزء الأيمن: الرسم الدائري SVG Ring Chart */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 10px 0' }}>
              التمثيل البياني لتوزيع الأدوار
            </h3>
            
            <div style={{ position: 'relative', width: '200px', height: '200px' }}>
              <svg width="200" height="200" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                {/* خلفية الدائرة الرمادية */}
                <circle cx="60" cy="60" r={radius} fill="transparent" stroke="var(--bg)" strokeWidth="12" />
                
                {/* دائرة الطلاب (الأخضر) */}
                {studentsCount > 0 && (
                  <circle 
                    cx="60" 
                    cy="60" 
                    r={radius} 
                    fill="transparent" 
                    stroke="var(--success)" 
                    strokeWidth="12" 
                    strokeDasharray={`${strokeDashStudent} ${circumference}`}
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                )}

                {/* دائرة المعلمين (البنفسجي) */}
                {teachersCount > 0 && (
                  <circle 
                    cx="60" 
                    cy="60" 
                    r={radius} 
                    fill="transparent" 
                    stroke="#8b5cf6" 
                    strokeWidth="12" 
                    strokeDasharray={`${strokeDashTeacher} ${circumference}`}
                    strokeDashoffset={-strokeDashStudent}
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                )}

                {/* دائرة المشرفين (الأزرق) */}
                {adminsCount > 0 && (
                  <circle 
                    cx="60" 
                    cy="60" 
                    r={radius} 
                    fill="transparent" 
                    stroke="var(--primary)" 
                    strokeWidth="12" 
                    strokeDasharray={`${strokeDashAdmin} ${circumference}`}
                    strokeDashoffset={-(strokeDashStudent + strokeDashTeacher)}
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                )}
              </svg>
              
              {/* النص الداخلي للدائرة */}
              <div 
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}
              >
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>إجمالي الحسابات</span>
                <strong style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--text-main)' }}>{totalUsersCount}</strong>
              </div>
            </div>
          </div>

          {/* الجزء الأيسر: توزيع النسب الحقيقية */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)', margin: '0' }}>
              نسب المشاركة والتمثيل الفعلي
            </h4>

            {/* شريط نسبة الطلاب */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>🎓 الطلاب المنتسبون</span>
                <span style={{ fontWeight: '800', color: 'var(--success)' }}>{studentPercent}% ({studentsCount})</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${studentPercent}%`, height: '100%', backgroundColor: 'var(--success)', borderRadius: '4px', transition: 'width 1s ease' }} />
              </div>
            </div>

            {/* شريط نسبة المعلمين */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>👨‍🏫 الكادر التعليمي</span>
                <span style={{ fontWeight: '800', color: '#8b5cf6' }}>{teacherPercent}% ({teachersCount})</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${teacherPercent}%`, height: '100%', backgroundColor: '#8b5cf6', borderRadius: '4px', transition: 'width 1s ease' }} />
              </div>
            </div>

            {/* شريط نسبة المشرفين */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>🛡️ مشرفو المنظومة</span>
                <span style={{ fontWeight: '800', color: 'var(--primary)' }}>{adminPercent}% ({adminsCount})</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${adminPercent}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '4px', transition: 'width 1s ease' }} />
              </div>
            </div>
          </div>
        </div>

        {/* 🎛️ التبويبات التفاعلية (Tabs) للتبديل بين إدارة المستخدمين وإدارة الكورسات */}
        <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', gap: '10px' }}>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: '800',
              cursor: 'pointer',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'users' ? '3px solid var(--primary)' : '3px solid transparent',
              color: activeTab === 'users' ? 'var(--primary)' : 'var(--text-muted)',
              transition: 'all var(--transition-fast)'
            }}
          >
            👥 إدارة أعضاء المنصة
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            style={{
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: '800',
              cursor: 'pointer',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'courses' ? '3px solid var(--primary)' : '3px solid transparent',
              color: activeTab === 'courses' ? 'var(--primary)' : 'var(--text-muted)',
              transition: 'all var(--transition-fast)'
            }}
          >
            📚 التحكم في الكورسات الدراسية
          </button>
        </div>

        {/* 📋 محتوى التبويب الأول: جدول الأعضاء */}
        {activeTab === 'users' && (
          <div 
            className="premium-card"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', margin: '0' }}>
                دليل الأعضاء والمستخدمين الحاليين
              </h2>
              <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                يتيح لك التحكم الكامل في صلاحيات الحسابات وترقيتها لدور تدريسي أو مشرف، أو تجميد وحظر النشاط نهائياً.
              </p>
            </div>

            {loading ? (
              <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[1, 2, 3].map((n) => (
                  <div key={n} style={{ height: '48px', backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-md)' }} className="animate-pulse" />
                ))}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '16px 28px', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)' }}>الاسم الكامل</th>
                      <th style={{ padding: '16px 28px', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)' }}>البريد الإلكتروني</th>
                      <th style={{ padding: '16px 28px', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)' }}>الدور الأكاديمي</th>
                      <th style={{ padding: '16px 28px', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)' }}>حالة الحساب</th>
                      <th style={{ padding: '16px 28px', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)', textAlign: 'left' }}>إجراءات إدارية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr 
                        key={user.id} 
                        style={{ borderBottom: '1px solid var(--border)', transition: 'background-color var(--transition-fast)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <td style={{ padding: '18px 28px', fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)' }}>
                          {user.fullName}
                        </td>
                        <td style={{ padding: '18px 28px', fontSize: '0.9rem', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                          {user.email}
                        </td>
                        <td style={{ padding: '18px 28px' }}>
                          <select
                            value={user.role?.id || ''}
                            onChange={(event) => {
                              const targetRoleId = Number(event.target.value);
                              const matchingRole = roles.find((r) => r.id === targetRoleId) || { id: targetRoleId, name: targetRoleId === 1 ? 'ROLE_ADMIN' : targetRoleId === 2 ? 'ROLE_STUDENT' : 'ROLE_TEACHER' };
                              handleUpdateUser(user.id, { role: matchingRole });
                            }}
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.85rem',
                              fontWeight: '700',
                              color: 'var(--text-main)',
                              backgroundColor: 'var(--surface)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-md)',
                              outline: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            {(roles.length > 0 ? roles : [
                              { id: 1, name: 'ROLE_ADMIN' },
                              { id: 2, name: 'ROLE_STUDENT' },
                              { id: 3, name: 'ROLE_TEACHER' }
                            ]).map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.name === 'ROLE_ADMIN' ? 'مشرف النظام' : role.name === 'ROLE_TEACHER' ? 'مدرس المادة' : 'طالب منتسب'}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '18px 28px' }}>
                          <span 
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '4px 12px',
                              fontSize: '0.78rem',
                              fontWeight: '800',
                              borderRadius: '50px',
                              backgroundColor: user.blocked ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 197, 94, 0.08)',
                              color: user.blocked ? 'var(--error)' : 'var(--success)'
                            }}
                          >
                            {user.blocked ? 'محظور مؤقتاً' : 'نشط متصل'}
                          </span>
                        </td>
                        <td style={{ padding: '18px 28px', textAlign: 'left', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {/* زر حظر/تفعيل */}
                          <button
                            onClick={() => handleUpdateUser(user.id, { blocked: !user.blocked })}
                            style={{
                              minHeight: '32px',
                              padding: '0 14px',
                              fontSize: '0.8rem',
                              fontWeight: '700',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border)',
                              backgroundColor: user.blocked ? 'rgba(34, 197, 94, 0.04)' : 'rgba(239, 68, 68, 0.04)',
                              color: user.blocked ? 'var(--success)' : 'var(--error)',
                              cursor: 'pointer',
                              transition: 'all var(--transition-fast)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = user.blocked ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)';
                              e.currentTarget.style.borderColor = user.blocked ? 'var(--success)' : 'var(--error)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = user.blocked ? 'rgba(34, 197, 94, 0.04)' : 'rgba(239, 68, 68, 0.04)';
                              e.currentTarget.style.borderColor = 'var(--border)';
                            }}
                          >
                            {user.blocked ? 'تنشيط الحساب' : 'حظر العضو'}
                          </button>

                          {/* زر الحذف */}
                          {confirmDeleteId === user.id && deleteType === 'user' ? (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              style={{
                                minHeight: '32px',
                                padding: '0 14px',
                                fontSize: '0.8rem',
                                fontWeight: '900',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                backgroundColor: 'var(--error)',
                                color: 'white',
                                cursor: 'pointer'
                              }}
                            >
                              تأكيد الحذف!
                            </button>
                          ) : (
                            <button
                              onClick={() => { setConfirmDeleteId(user.id); setDeleteType('user'); }}
                              disabled={user.id === currentUser.id} // منع حذف المشرف لنفسه
                              style={{
                                minHeight: '32px',
                                padding: '0 14px',
                                fontSize: '0.8rem',
                                fontWeight: '700',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border)',
                                backgroundColor: 'rgba(239, 68, 68, 0.02)',
                                color: 'var(--error)',
                                cursor: user.id === currentUser.id ? 'not-allowed' : 'pointer',
                                opacity: user.id === currentUser.id ? 0.4 : 1,
                                transition: 'all var(--transition-fast)'
                              }}
                              onMouseEnter={(e) => {
                                if (user.id !== currentUser.id) {
                                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
                                  e.currentTarget.style.borderColor = 'var(--error)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (user.id !== currentUser.id) {
                                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.02)';
                                  e.currentTarget.style.borderColor = 'var(--border)';
                                }
                              }}
                            >
                              حذف نهائي
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 📋 محتوى التبويب الثاني: جدول الكورسات */}
        {activeTab === 'courses' && (
          <div 
            className="premium-card"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', margin: '0' }}>
                التحكم المباشر في الكورسات الدراسية
              </h2>
              <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                يتيح لك تصفح ومراقبة كافة المناهج التعليمية المفتوحة بالمنصة بواسطة المدرسين وحذف أي محتوى يخالف الشروط.
              </p>
            </div>

            {loading ? (
              <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[1, 2, 3].map((n) => (
                  <div key={n} style={{ height: '48px', backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-md)' }} className="animate-pulse" />
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                لا توجد كورسات دراسية مسجلة في قاعدة البيانات حالياً.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '16px 28px', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)' }}>عنوان الكورس الأكاديمي</th>
                      <th style={{ padding: '16px 28px', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)' }}>مدرس المادة</th>
                      <th style={{ padding: '16px 28px', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)' }}>القسم / التصنيف</th>
                      <th style={{ padding: '16px 28px', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)' }}>مستوى الدورة</th>
                      <th style={{ padding: '16px 28px', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)', textAlign: 'left' }}>إجراءات إدارية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course) => (
                      <tr 
                        key={course.id} 
                        style={{ borderBottom: '1px solid var(--border)', transition: 'background-color var(--transition-fast)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <td style={{ padding: '18px 28px', fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)' }}>
                          {course.title || 'كورس غير معنون'}
                        </td>
                        <td style={{ padding: '18px 28px', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                          {course.teacher?.fullName || 'مدرس المنصة'}
                        </td>
                        <td style={{ padding: '18px 28px', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '600' }}>
                          {course.category?.name || 'تصنيف عام'}
                        </td>
                        <td style={{ padding: '18px 28px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {course.level === 'BEGINNER' ? 'مبتدئ' : course.level === 'INTERMEDIATE' ? 'متوسط' : 'متقدم'}
                        </td>
                        <td style={{ padding: '18px 28px', textAlign: 'left' }}>
                          {confirmDeleteId === course.id && deleteType === 'course' ? (
                            <button
                              onClick={() => handleDeleteCourse(course.id)}
                              style={{
                                minHeight: '32px',
                                padding: '0 14px',
                                fontSize: '0.8rem',
                                fontWeight: '900',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                backgroundColor: 'var(--error)',
                                color: 'white',
                                cursor: 'pointer'
                              }}
                            >
                              تأكيد حذف الكورس!
                            </button>
                          ) : (
                            <button
                              onClick={() => { setConfirmDeleteId(course.id); setDeleteType('course'); }}
                              style={{
                                minHeight: '32px',
                                padding: '0 14px',
                                fontSize: '0.8rem',
                                fontWeight: '700',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border)',
                                backgroundColor: 'rgba(239, 68, 68, 0.02)',
                                color: 'var(--error)',
                                cursor: 'pointer',
                                transition: 'all var(--transition-fast)'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
                                e.currentTarget.style.borderColor = 'var(--error)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.02)';
                                e.currentTarget.style.borderColor = 'var(--border)';
                              }}
                            >
                              حذف الكورس
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </PageFrame>
  );
}
