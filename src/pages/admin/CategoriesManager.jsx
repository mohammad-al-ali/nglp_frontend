import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api, { getStoredUser } from '../../services/api';
import PageFrame from '../../components/ui/PageFrame';
import TextField from '../../components/ui/TextField';
import { normalizeCategory } from '../../utils/constants';

/**
 * لوحة إدارة التصنيفات والمناهج الدراسية (CategoriesManager)
 * تمكن المشرفين من تنظيم شجرة التخصصات الأكاديمية (إضافة، تعديل مسميات، وحذف الأقسام) 
 * مع تكوين شجرة مرئية تفاعلية ودعم كامل لاتساق الجداول بالخلفية.
 */
export default function CategoriesManager() {
  const currentUser = getStoredUser();

  // 🛡️ 1. التحقق الصارم من صلاحية الأدمن في الواجهة لحجب الصفحة عن غير المخولين
  const roleStr = String(currentUser?.role?.name || currentUser?.role || '').toUpperCase();
  const isAdmin = roleStr.includes('ADMIN');

  // حالات الواجهة (States)
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // بناء الهيكل الشجري للتصنيفات محلياً اعتماداً على الحالات المستدعاة
  const tree = useMemo(() => buildCategoryTree(items), [items]);

  // تحميل شجرة التصنيفات بالكامل من قاعدة البيانات H2
  useEffect(() => {
    if (!isAdmin) return;

    let isMounted = true;
    async function loadCategoriesTree() {
      try {
        setLoading(true);
        // 1. جلب الأقسام الرئيسية أولاً
        const rootResponse = await api.get('/categories/root');
        const rootCategories = rootResponse.data.map((category) => normalizeCategory(category));
        
        // 2. جلب الأقسام الفرعية بشكل ديناميكي لكل قسم رئيسي
        const childResponses = await Promise.all(
          rootCategories.map((category) => 
            api.get(`/categories/${category.id}/sub`).catch(() => ({ data: [] }))
          )
        );

        const childCategories = childResponses.flatMap((response, index) =>
          response.data.map((category) => normalizeCategory(category, rootCategories[index].id))
        );

        if (isMounted) {
          setItems([...rootCategories, ...childCategories]);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load categories tree:', err);
        if (isMounted) {
          setErrorMsg('فشل الاتصال بالخلفية لجلب شجرة التصنيفات الأكاديمية.');
          setLoading(false);
        }
      }
    }

    loadCategoriesTree();
    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  // إخفاء رسائل التنبيه بعد 4 ثوانٍ
  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg('');
        setErrorMsg('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  // 🛡️ عرض شاشة الرفض الأنيقة في حال الدخول غير المصرح
  if (!isAdmin) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', fontFamily: 'var(--font-sans)', direction: 'rtl', padding: '20px' }}>
        <div className="premium-card animate-fade-in" style={{ maxWidth: '500px', width: '100%', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '40px 30px', textAlign: 'center', boxShadow: '0 10px 30px rgba(239, 68, 68, 0.08)' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.08)', display: 'grid', placeItems: 'center', margin: '0 auto 24px auto', color: 'var(--error)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '40px', height: '40px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '12px' }}>غير مصرح بالدخول!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '28px' }}>
            عذراً، تحتاج لصلاحية مدير النظام (Admin) للتمكن من تعديل أقسام الفهرس الأكاديمي.
          </p>
          <Link to="/" className="primary-button" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 28px', backgroundColor: 'var(--primary)', color: 'var(--text-inverse)', textDecoration: 'none', borderRadius: 'var(--radius-md)', fontWeight: '700', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)' }}>
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  // إضافة تصنيف جديد
  async function addCategory(event) {
    event.preventDefault();
    if (!name.trim()) return;

    const parentCategoryObj = parentId ? { id: Number(parentId) } : null;

    try {
      const response = await api.post('/categories', {
        name: name.trim(),
        parent: parentCategoryObj,
      });

      // دمج القسم الجديد في شجرة الواجهة فوراً
      setItems((current) => [...current, normalizeCategory(response.data, parentId ? Number(parentId) : null)]);
      setSuccessMsg(`تم إنشاء التصنيف الأكاديمي "${name}" بنجاح.`);
      setName('');
      setParentId('');
    } catch (err) {
      console.error('Failed to create category:', err);
      setErrorMsg('فشل حفظ القسم الجديد بالخلفية. تأكد من إعدادات الاتصال.');
    }
  }

  // حذف قسم دراسي
  async function deleteCategory(id) {
    try {
      await api.delete(`/categories/${id}`);
      // إزالة التصنيف وفروعه محلياً في حال نجاح الطلب
      setItems((current) => current.filter((item) => item.id !== id && item.parentId !== id));
      setSuccessMsg('تم حذف التصنيف المحدد بنجاح.');
    } catch (err) {
      console.error('Failed to delete category:', err);
      // معالجة القيد البرمجي في حال وجود أطفال للقسم الحاضن
      setErrorMsg('لا يمكن حذف هذا القسم الرئيسي لأنه يحتوي على أقسام فرعية نشطة! يرجى إزالة الأقسام الفرعية أولاً.');
    }
  }

  // إعادة تسمية قسم
  async function renameCategory(category, nextName) {
    if (!nextName.trim() || nextName === category.name) return;

    try {
      await api.put(`/categories/${category.id}`, {
        name: nextName,
        parent: category.parentId ? { id: category.parentId } : null,
      });

      setItems((current) => current.map((item) => 
        item.id === category.id ? { ...item, name: nextName } : item
      ));
      setSuccessMsg('تم تحديث وتعديل اسم القسم الأكاديمي.');
    } catch (err) {
      console.error('Failed to rename category:', err);
      setErrorMsg('عذراً، فشل تحديث التسمية بقاعدة البيانات.');
    }
  }

  return (
    <PageFrame 
      eyebrow="لوحة التحكم الإشرافية" 
      title="مخطط شجرة التصنيفات التعليمية" 
      actions={
        <Link 
          className="secondary-button" 
          to="/admin/users"
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
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '16px', height: '16px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
          التحكم بالأعضاء والكورسات
        </Link>
      }
    >
      <div 
        style={{ 
          direction: 'rtl',
          fontFamily: 'var(--font-sans)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        {/* التنبيهات المؤقتة */}
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

        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: '30px',
            alignItems: 'start'
          }}
        >
          {/* اليمين: نموذج إضافة تصنيف أكاديمي جديد */}
          <form 
            onSubmit={addCategory}
            className="premium-card"
            style={{
              padding: '28px',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 10px 0', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              ➕ إضافة تصنيف أكاديمي جديد
            </h2>
            
            <TextField 
              label="اسم التصنيف (بالعربية أو الإنجليزية)" 
              value={name} 
              onChange={setName} 
              placeholder="مثال: هندسة البرمجيات، قواعد البيانات"
            />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: 'var(--text-main)', fontSize: '0.88rem', fontWeight: '800' }}>
                التصنيف الأب الحاضن (Parent Category)
              </label>
              <select 
                value={parentId} 
                onChange={(event) => setParentId(event.target.value)}
                style={{
                  width: '100%',
                  minHeight: '44px',
                  padding: '0 12px',
                  fontSize: '0.925rem',
                  color: 'var(--text-main)',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  outline: 'none',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer'
                }}
              >
                <option value="">📁 قسم رئيسي مستفل (بدون أب)</option>
                {items.filter(item => !item.parentId).map((item) => (
                  <option key={item.id} value={item.id}>
                    🏷️ {item.name}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                اختر قسماً رئيسياً لجعله فرعاً تحته، أو اتركه فارغاً لجعله قسماً رئيسياً كبيراً بالفهرس.
              </span>
            </div>
            
            <button 
              className="primary-button" 
              type="submit"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '44px',
                backgroundColor: 'var(--primary)',
                color: 'var(--text-inverse)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontWeight: '800',
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)',
                transition: 'all var(--transition-fast)'
              }}
            >
              حفظ وتثبيت التصنيف
            </button>
          </form>

          {/* اليسار: المعاينة الحية وشجرة التفرعات الهرمية */}
          <div 
            className="premium-card"
            style={{
              padding: '28px',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              🌳 الهيكل التنظيمي للتصنيفات الأكاديمية
            </h2>
            
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[1, 2, 3].map((n) => (
                  <div key={n} style={{ height: '40px', backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-md)' }} className="animate-pulse" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                لا توجد تصنيفات معرفة حتى الآن، ابدأ بإضافة تصنيف جديد باليمين.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '10px' }}>
                {tree.map((category) => (
                  <CategoryNode 
                    key={category.id} 
                    category={category} 
                    onDelete={deleteCategory} 
                    onRename={renameCategory} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageFrame>
  );
}

/**
 * مكون هرمي فرعي لعرض كل عقدة تصنيف أكاديمي مع أبنائه
 */
function CategoryNode({ category, onDelete, onRename }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(category.name);

  function saveLabel() {
    if (label.trim()) {
      onRename(category, label.trim());
    }
    setEditing(false);
  }

  // هل هذه العقدة هي تصنيف رئيسي (جذر)؟
  const isRoot = !category.parentId;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '10px 14px',
          backgroundColor: isRoot ? 'var(--bg)' : 'transparent',
          border: isRoot ? '1px solid var(--border)' : '1px dashed var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: isRoot ? 'var(--shadow-sm)' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <span style={{ fontSize: '1.1rem' }}>
            {isRoot ? '📁' : '🏷️'}
          </span>
          
          {editing ? (
            <input 
              value={label} 
              onChange={(event) => setLabel(event.target.value)} 
              onKeyDown={(e) => { if (e.key === 'Enter') saveLabel(); }}
              style={{
                padding: '4px 8px',
                fontSize: '0.88rem',
                border: '1px solid var(--primary)',
                borderRadius: '4px',
                backgroundColor: 'var(--surface)',
                color: 'var(--text-main)',
                outline: 'none',
                width: '180px'
              }}
            />
          ) : (
            <strong style={{ fontSize: '0.925rem', fontWeight: isRoot ? '800' : '600', color: 'var(--text-main)' }}>
              {label}
            </strong>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={editing ? saveLabel : () => setEditing(true)}
            style={{
              minHeight: '28px',
              padding: '0 10px',
              fontSize: '0.78rem',
              fontWeight: '700',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--primary)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--surface)'}
          >
            {editing ? 'حفظ التغيير' : 'تعديل التسمية'}
          </button>
          <button 
            onClick={() => onDelete(category.id)}
            style={{
              minHeight: '28px',
              padding: '0 10px',
              fontSize: '0.78rem',
              fontWeight: '700',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--error)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--surface)'}
          >
            حذف
          </button>
        </div>
      </div>
      
      {/* عرض الأبناء (التصنيفات الفرعية) هرمياً تحت هذا القسم */}
      {category.children.length > 0 && (
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px', 
            paddingRight: '20px', 
            borderRight: '1px dashed var(--border)',
            marginRight: '14px'
          }}
        >
          {category.children.map((child) => (
            <CategoryNode 
              key={child.id} 
              category={child} 
              onDelete={onDelete} 
              onRename={onRename} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * دالة مساعدة لبناء الهيكل الهرمي شجرياً من مصفوفة خطية
 */
function buildCategoryTree(items) {
  const byId = new Map(items.map((item) => [item.id, { ...item, children: [] }]));
  const roots = [];
  byId.forEach((item) => {
    if (item.parentId && byId.has(item.parentId)) {
      byId.get(item.parentId).children.push(item);
    } else {
      roots.push(item);
    }
  });
  return roots;
}
