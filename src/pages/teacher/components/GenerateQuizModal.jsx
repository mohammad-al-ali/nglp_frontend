import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import TextField from './../../../components/ui/TextField';
import api from './../../../services/api';

const overlayStyle = {
  position: 'fixed', inset: 0, zIndex: 9999,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
};

const modalStyle = {
  width: 'min(520px, calc(100% - 40px))', maxHeight: '80vh', overflowY: 'auto',
  padding: '32px', direction: 'rtl',
  background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-premium)', border: '1px solid var(--glass-border)',
};

export default function GenerateQuizModal({ lessonId, teacherId, onClose, onGenerated }) {
  const [title, setTitle] = useState('');
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!title.trim()) { setError('Please enter quiz title'); return; }
    if (numberOfQuestions < 1 || numberOfQuestions > 20) { setError('Number of questions must be between 1 and 20'); return; }
    setLoading(true); setError('');
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
      setError(err.response?.data?.error || err.message || 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="var(--primary)" /> Generate Quiz with AI
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <TextField label="Quiz Title" value={title} onChange={setTitle} placeholder="e.g. Lesson 1 Test" />
          <TextField label="Number of Questions" type="number" value={numberOfQuestions} onChange={(v) => setNumberOfQuestions(Number(v))} />
          {error && <p style={{ color: 'var(--error)', fontSize: '0.85rem', margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button onClick={onClose} style={{
              flex: 1, padding: '12px', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)', cursor: 'pointer',
              background: 'transparent', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 600,
            }}>Cancel</button>
            <button onClick={handleGenerate} disabled={loading} style={{
              flex: 1, padding: '12px', borderRadius: 'var(--radius-md)',
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
              color: '#fff', fontSize: '0.9rem', fontWeight: 600,
              opacity: loading ? 0.6 : 1,
            }}>
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
