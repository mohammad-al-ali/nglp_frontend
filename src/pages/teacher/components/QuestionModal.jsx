import { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';

const overlayStyle = {
  position: 'fixed', inset: 0, zIndex: 9999,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
};

const modalStyle = {
  width: 'min(600px, calc(100% - 40px))', maxHeight: '80vh', overflowY: 'auto',
  padding: '32px', direction: 'rtl',
  background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-premium)', border: '1px solid var(--glass-border)',
};

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
  const isEdit = !!question;
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
          ? question.choices.map((c) => ({ choiceText: c.choiceText || '', isCorrect: !!c.isCorrect }))
          : emptyQuestion().choices,
      });
    }
  }, [question]);

  const updateChoice = (index, field, value) => {
    setForm((prev) => {
      const choices = [...prev.choices];
      if (field === 'isCorrect') {
        choices.forEach((c, i) => { c.isCorrect = i === index; });
      } else {
        choices[index] = { ...choices[index], [field]: value };
      }
      return { ...prev, choices };
    });
  };

  const handleSave = async () => {
    if (!form.questionText.trim()) { setError('Please enter question text'); return; }
    if (form.choices.some((c) => !c.choiceText.trim())) { setError('Please fill all choices'); return; }
    if (!form.choices.some((c) => c.isCorrect)) { setError('Please select one correct choice'); return; }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem' }}>{isEdit ? 'Edit Question' : 'Add Question'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ color: 'var(--text-main)', fontSize: '0.875rem', fontWeight: 600 }}>Question Text</label>
            <textarea
              value={form.questionText}
              onChange={(e) => setForm((p) => ({ ...p, questionText: e.target.value }))}
              placeholder="Write question text..."
              rows={3}
              style={{
                width: '100%', padding: '10px 14px', fontSize: '0.95rem',
                color: 'var(--text-main)', backgroundColor: 'var(--glass-input-bg)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                outline: 'none', resize: 'vertical', fontFamily: 'var(--font-sans)',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ color: 'var(--text-main)', fontSize: '0.875rem', fontWeight: 600 }}>Weight (Points)</label>
            <input type="number" value={form.difficultyWeight}
              onChange={(e) => setForm((p) => ({ ...p, difficultyWeight: Number(e.target.value) }))}
              style={{
                width: '100%', minHeight: '44px', padding: '0 14px', fontSize: '0.95rem',
                color: 'var(--text-main)', backgroundColor: 'var(--glass-input-bg)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ color: 'var(--text-main)', fontSize: '0.875rem', fontWeight: 600 }}>Explanation (shown after answer)</label>
            <textarea
              value={form.explanation}
              onChange={(e) => setForm((p) => ({ ...p, explanation: e.target.value }))}
              placeholder="Explain the correct answer..."
              rows={2}
              style={{
                width: '100%', padding: '10px 14px', fontSize: '0.95rem',
                color: 'var(--text-main)', backgroundColor: 'var(--glass-input-bg)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                outline: 'none', resize: 'vertical', fontFamily: 'var(--font-sans)',
              }}
            />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>Choices (select one correct)</p>
            {form.choices.map((choice, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <button
                  onClick={() => updateChoice(i, 'isCorrect', true)}
                  style={{
                    width: '28px', height: '28px', borderRadius: '50%', border: '2px solid',
                    borderColor: choice.isCorrect ? 'var(--success)' : 'var(--border)',
                    background: choice.isCorrect ? 'var(--success)' : 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}
                >
                  {choice.isCorrect && <CheckCircle size={16} color="#fff" />}
                </button>
                <input
                  value={choice.choiceText}
                  onChange={(e) => updateChoice(i, 'choiceText', e.target.value)}
                  placeholder={`Choice ${i + 1}`}
                  style={{
                    flex: 1, padding: '10px 14px', fontSize: '0.9rem',
                    color: 'var(--text-main)', backgroundColor: 'var(--glass-input-bg)',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                    outline: 'none',
                  }}
                />
              </div>
            ))}
          </div>
          {error && <p style={{ color: 'var(--error)', fontSize: '0.85rem', margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button onClick={onClose} style={{
              flex: 1, padding: '12px', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)', cursor: 'pointer',
              background: 'transparent', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 600,
            }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{
              flex: 1, padding: '12px', borderRadius: 'var(--radius-md)',
              border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
              background: 'var(--primary)', color: '#fff', fontSize: '0.9rem', fontWeight: 600,
              opacity: saving ? 0.6 : 1,
            }}>
              {saving ? 'Saving...' : (isEdit ? 'Update Question' : 'Add Question')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
