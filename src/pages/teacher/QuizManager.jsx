import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Plus, Eye, Sparkles, FileQuestion } from 'lucide-react';
import PageFrame from './../../components/ui/PageFrame';
import Skeleton from './../../components/ui/Skeleton';
import { normalizeQuiz } from './../../utils/constants';
import { useFetchQuizzes } from './../../hooks/useQuiz';
import GenerateQuizModal from './components/GenerateQuizModal';
import { getStoredUser } from './../../services/api';

const cardStyle = {
  background: 'var(--glass-bg)', backdropFilter: 'blur(var(--glass-blur))',
  border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)',
  padding: '20px', boxShadow: 'var(--glass-shadow)',
};

export default function QuizManager() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { quizzes, loading, fetchQuizzes } = useFetchQuizzes(lessonId);
  const [showGenerate, setShowGenerate] = useState(false);
  const user = getStoredUser();

  useEffect(() => { fetchQuizzes(); }, [lessonId]);

  const handleGenerated = () => { fetchQuizzes(); };

  return (
    <PageFrame
      eyebrow="Quiz Management"
      title="Quizzes"
      actions={
        <button onClick={() => setShowGenerate(true)} style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px',
          borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
          color: '#fff', fontSize: '0.85rem', fontWeight: 600,
        }}>
          <Sparkles size={16} /> Generate Quiz with AI
        </button>
      }
    >
      {showGenerate && (
        <GenerateQuizModal
          lessonId={lessonId}
          teacherId={user?.id}
          onClose={() => setShowGenerate(false)}
          onGenerated={handleGenerated}
        />
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Skeleton height="80px" count={3} />
        </div>
      ) : quizzes.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '60px 20px' }}>
          <FileQuestion size={48} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 8px' }}>No quizzes yet</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Use "Generate Quiz with AI" to create the first quiz for this lesson</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {quizzes.map((raw) => {
            const q = normalizeQuiz(raw);
            const isDraft = q.status === 'DRAFT';
            return (
              <div key={q.id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{q.title}</h3>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 700, padding: '2px 10px', borderRadius: 'var(--radius-full)',
                        background: isDraft ? 'var(--warning-soft)' : 'var(--success-soft)',
                        color: isDraft ? '#92400e' : '#065f46',
                        border: '1px solid',
                        borderColor: isDraft ? 'var(--warning-border)' : 'var(--success-border)',
                      }}>
                        {isDraft ? 'DRAFT' : 'PUBLISHED'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <span>{q.questions?.length || 0} questions</span>
                      {q.createdAt && <span>{new Date(q.createdAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link
                      to={`/teacher/quizzes/${q.id}?courseId=${courseId}&lessonId=${lessonId}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 14px',
                        borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                        cursor: 'pointer', background: 'transparent', color: 'var(--text-main)',
                        fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none',
                      }}
                    >
                      <Eye size={14} /> Preview
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageFrame>
  );
}
