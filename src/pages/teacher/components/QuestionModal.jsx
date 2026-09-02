import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import FormField from '@/components/ui/form-field';
import { cn } from '@/lib/utils';
import { notify } from '@/lib/toast';

const emptyQuestion = () => ({
  questionText: '',
  difficultyWeight: 5,
  explanation: '',
  choices: [
    { choiceText: '', isCorrect: false },
    { choiceText: '', isCorrect: false },
    { choiceText: '', isCorrect: false },
    { choiceText: '', isCorrect: false },
  ],
});

export default function QuestionModal({ question, onClose, onSave }) {
  const isEdit = Boolean(question);
  const [form, setForm] = useState(emptyQuestion());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (question) {
      setForm({
        questionText: question.questionText || '',
        difficultyWeight: question.difficultyWeight || 5,
        explanation: question.explanation || '',
        choices: question.choices?.length === 4
          ? question.choices.map((c) => ({ choiceText: c.choiceText || '', isCorrect: Boolean(c.isCorrect) }))
          : emptyQuestion().choices,
      });
    }
  }, [question]);

  function updateChoice(index, field, value) {
    setForm((prev) => ({
      ...prev,
      choices: prev.choices.map((choice, i) => {
        if (field === 'isCorrect') return { ...choice, isCorrect: i === index };
        return i === index ? { ...choice, [field]: value } : choice;
      }),
    }));
  }

  async function handleSave() {
    if (!form.questionText.trim()) {
      setError('يرجى إدخال نص السؤال.');
      return;
    }
    if (form.choices.some((c) => !c.choiceText.trim())) {
      setError('يرجى تعبئة الخيارات الأربعة كاملةً.');
      return;
    }
    if (!form.choices.some((c) => c.isCorrect)) {
      setError('يرجى تحديد الإجابة الصحيحة.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      const message = err.message || 'تعذّر حفظ السؤال.';
      setError(message);
      notify.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'تعديل السؤال' : 'إضافة سؤال'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <FormField label="نص السؤال" htmlFor="question-text">
            <Textarea
              id="question-text"
              value={form.questionText}
              onChange={(e) => setForm((p) => ({ ...p, questionText: e.target.value }))}
              placeholder="اكتب نص السؤال..."
              rows={3}
            />
          </FormField>

          <FormField label="الوزن (النقاط)" htmlFor="question-weight">
            <Input
              id="question-weight"
              type="number"
              value={form.difficultyWeight}
              onChange={(e) => setForm((p) => ({ ...p, difficultyWeight: Number(e.target.value) }))}
            />
          </FormField>

          <FormField label="التفسير (يظهر بعد الإجابة)" htmlFor="question-explanation">
            <Textarea
              id="question-explanation"
              value={form.explanation}
              onChange={(e) => setForm((p) => ({ ...p, explanation: e.target.value }))}
              placeholder="اشرح الإجابة الصحيحة..."
              rows={2}
            />
          </FormField>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">الخيارات (حدد إجابة واحدة صحيحة)</p>
            <div className="flex flex-col gap-2">
              {form.choices.map((choice, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateChoice(i, 'isCorrect', true)}
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ease-in-out',
                      choice.isCorrect ? 'border-success bg-success' : 'border-border bg-transparent'
                    )}
                  >
                    {choice.isCorrect && <CheckCircle className="size-4 text-white" />}
                  </button>
                  <Input
                    value={choice.choiceText}
                    onChange={(e) => updateChoice(i, 'choiceText', e.target.value)}
                    placeholder={`الخيار ${i + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-error">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'جاري الحفظ...' : isEdit ? 'تحديث السؤال' : 'إضافة السؤال'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
