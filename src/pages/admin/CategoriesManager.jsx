import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FolderTree, Folder, Tag, Plus, Pencil, Check, Trash2, Users, ShieldAlert } from 'lucide-react';
import api, { getStoredUser } from '../../services/api';
import PageShell from '@/components/ui/page-shell';
import PageHeader from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import FormField from '@/components/ui/form-field';
import ImagePicker from '@/components/ui/ImagePicker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import EmptyState from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { isAdmin } from '@/lib/roles';
import { normalizeCategory } from '../../utils/constants';

export default function CategoriesManager() {
  const currentUser = getStoredUser();
  const userIsAdmin = isAdmin(currentUser);

  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const tree = useMemo(() => buildCategoryTree(items), [items]);

  useEffect(() => {
    if (!userIsAdmin) return;

    let isMounted = true;
    async function loadCategoriesTree() {
      try {
        setLoading(true);
        const rootResponse = await api.get('/categories/root');
        const rootCategories = rootResponse.data.map((category) => normalizeCategory(category));

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
  }, [userIsAdmin]);

  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg('');
        setErrorMsg('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  if (!userIsAdmin) {
    return (
      <PageShell>
        <Card className="mx-auto flex max-w-md flex-col items-center gap-4 p-10 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-error-soft text-error">
            <ShieldAlert className="size-7" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">غير مصرح بالدخول</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              عذراً، تحتاج لصلاحية مدير النظام (Admin) للتمكن من تعديل أقسام الفهرس الأكاديمي.
            </p>
          </div>
          <Button as={Link} to="/">
            العودة للرئيسية
          </Button>
        </Card>
      </PageShell>
    );
  }

  async function addCategory(event) {
    event.preventDefault();
    if (!name.trim()) return;

    const parentCategoryObj = parentId ? { id: Number(parentId) } : null;

    try {
      const response = await api.post('/categories', {
        name: name.trim(),
        parent: parentCategoryObj,
      });

      let created = response.data;

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        try {
          const imageResponse = await api.post(`/categories/${created.id}/image`, formData);
          created = imageResponse.data;
        } catch (imageErr) {
          console.warn('Failed to upload category image.', imageErr);
        }
      }

      setItems((current) => [...current, normalizeCategory(created, parentId ? Number(parentId) : null)]);
      setSuccessMsg(`تم إنشاء التصنيف الأكاديمي "${name}" بنجاح.`);
      setName('');
      setParentId('');
      setImageFile(null);
    } catch (err) {
      console.error('Failed to create category:', err);
      setErrorMsg('فشل حفظ القسم الجديد بالخلفية. تأكد من إعدادات الاتصال.');
    }
  }

  async function handleConfirmDelete() {
    try {
      await api.delete(`/categories/${deleteTarget.id}`);
      setItems((current) => current.filter((item) => item.id !== deleteTarget.id && item.parentId !== deleteTarget.id));
      setSuccessMsg('تم حذف التصنيف المحدد بنجاح.');
    } catch (err) {
      console.error('Failed to delete category:', err);
      const backendMessage = err.response?.data?.error || '';
      setErrorMsg(
        backendMessage.includes('parent category')
          ? 'لا يمكن حذف هذا القسم لأنه يحتوي على أقسام فرعية نشطة. يرجى حذف الأقسام الفرعية أولاً.'
          : backendMessage || 'تعذر حذف هذا التصنيف. يرجى التحقق من اتصال الخادم والمحاولة مرة أخرى.'
      );
    }
  }

  async function renameCategory(category, nextName) {
    if (!nextName.trim() || nextName === category.name) return;

    try {
      await api.put(`/categories/${category.id}`, {
        name: nextName,
        parent: category.parentId ? { id: category.parentId } : null,
      });

      setItems((current) => current.map((item) => (item.id === category.id ? { ...item, name: nextName } : item)));
      setSuccessMsg('تم تحديث وتعديل اسم القسم الأكاديمي.');
    } catch (err) {
      console.error('Failed to rename category:', err);
      setErrorMsg('عذراً، فشل تحديث التسمية بقاعدة البيانات.');
    }
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="لوحة التحكم الإشرافية"
        title="مخطط شجرة التصنيفات التعليمية"
        actions={
          <Button as={Link} to="/admin/users" variant="outline">
            <Users className="size-4" />
            التحكم بالأعضاء والكورسات
          </Button>
        }
      />

      {(successMsg || errorMsg) && (
        <div className="mb-6">
          {successMsg && (
            <Alert variant="success">
              <AlertDescription>{successMsg}</AlertDescription>
            </Alert>
          )}
          {errorMsg && (
            <Alert variant="destructive">
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-2">
        <Card className="p-7">
          <h2 className="mb-5 flex items-center gap-2 border-b border-border pb-4 font-display text-lg font-semibold text-foreground">
            <Plus className="size-5 text-muted-foreground" />
            إضافة تصنيف أكاديمي جديد
          </h2>

          <form onSubmit={addCategory} className="flex flex-col gap-5">
            <FormField label="اسم التصنيف (بالعربية أو الإنجليزية)" htmlFor="category-name">
              <Input
                id="category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: هندسة البرمجيات، قواعد البيانات"
              />
            </FormField>

            <FormField
              label="التصنيف الأب الحاضن (Parent Category)"
              htmlFor="category-parent"
              hint="اختر قسماً رئيسياً لجعله فرعاً تحته، أو اتركه فارغاً لجعله قسماً رئيسياً بالفهرس."
            >
              <Select id="category-parent" value={parentId} onChange={(e) => setParentId(e.target.value)}>
                <option value="">قسم رئيسي مستقل (بدون أب)</option>
                {items
                  .filter((item) => !item.parentId)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </Select>
            </FormField>

            <ImagePicker
              label="صورة التصنيف (اختياري)"
              hint="تظهر كأيقونة تعريفية للتصنيف في الفهرس."
              onChange={setImageFile}
            />

            <Button type="submit" size="lg">
              حفظ وتثبيت التصنيف
            </Button>
          </form>
        </Card>

        <Card className="p-7">
          <h2 className="mb-5 flex items-center gap-2 border-b border-border pb-4 font-display text-lg font-semibold text-foreground">
            <FolderTree className="size-5 text-muted-foreground" />
            الهيكل التنظيمي للتصنيفات الأكاديمية
          </h2>

          {loading ? (
            <div className="flex flex-col gap-2.5">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-11 animate-pulse rounded-md bg-surface-raised" />
              ))}
            </div>
          ) : tree.length === 0 ? (
            <EmptyState
              icon={FolderTree}
              title="لا توجد تصنيفات معرفة حتى الآن"
              description="ابدأ بإضافة تصنيف جديد من النموذج المجاور."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {tree.map((category) => (
                <CategoryNode key={category.id} category={category} onRequestDelete={setDeleteTarget} onRename={renameCategory} />
              ))}
            </div>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف التصنيف"
        description={`هل أنت متأكد من حذف تصنيف "${deleteTarget?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف"
        destructive
        onConfirm={handleConfirmDelete}
      />
    </PageShell>
  );
}

function CategoryNode({ category, onRequestDelete, onRename }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(category.name);

  function saveLabel() {
    if (label.trim()) {
      onRename(category, label.trim());
    }
    setEditing(false);
  }

  const isRoot = !category.parentId;

  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          'flex items-center justify-between gap-3 rounded-md px-3.5 py-2.5',
          isRoot ? 'border border-border bg-background shadow-soft' : 'border border-dashed border-border'
        )}
      >
        <div className="flex flex-1 items-center gap-2">
          {isRoot ? (
            <Folder className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <Tag className="size-4 shrink-0 text-muted-foreground" />
          )}

          {editing ? (
            <Input
              autoFocus
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveLabel();
              }}
              className="h-8 w-44 px-2 text-sm"
            />
          ) : (
            <strong className={cn('text-sm text-foreground', isRoot ? 'font-bold' : 'font-medium')}>{label}</strong>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs" onClick={editing ? saveLabel : () => setEditing(true)}>
            {editing ? <Check className="size-3.5" /> : <Pencil className="size-3.5" />}
            {editing ? 'حفظ' : 'تعديل'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 border-error-border px-2.5 text-xs text-error hover:bg-error-soft"
            onClick={() => onRequestDelete(category)}
          >
            <Trash2 className="size-3.5" />
            حذف
          </Button>
        </div>
      </div>

      {category.children.length > 0 && (
        <div className="me-3.5 flex flex-col gap-2 border-e border-dashed border-border pe-5">
          {category.children.map((child) => (
            <CategoryNode key={child.id} category={child} onRequestDelete={onRequestDelete} onRename={onRename} />
          ))}
        </div>
      )}
    </div>
  );
}

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
