import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import FormField from '@/components/ui/form-field';
import api from '../../../services/api';

export default function GenerateQuizModal({ lessonId, teacherId, onClose, onGenerated }) {
  const [title, setTitle] = useState('');
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate() {
    if (!title.trim()) {
      setError('يرجى إدخال عنوان الكويز');
      return;
    }
    if (numberOfQuestions < 1 || numberOfQuestions > 20) {
      setError('عدد الأسئلة يجب أن يكون بين 1 و20');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/quizzes/generate', {
        lessonId: Number(lessonId),
        title: title.trim(),
        numberOfQuestions: Number(numberOfQuestions),
        teacherId: Number(teacherId),
      });
      onGenerated?.(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'فشل توليد الكويز');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            توليد كويز بالذكاء الاصطناعي
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <FormField label="عنوان الكويز" htmlFor="quiz-title">
            <Input id="quiz-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: اختبار الدرس الأول" />
          </FormField>
          <FormField label="عدد الأسئلة" htmlFor="quiz-question-count">
            <Input
              id="quiz-question-count"
              type="number"
              value={numberOfQuestions}
              onChange={(e) => setNumberOfQuestions(Number(e.target.value))}
            />
          </FormField>
          {error && <p className="text-sm text-error">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? 'جاري التوليد...' : 'توليد'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
