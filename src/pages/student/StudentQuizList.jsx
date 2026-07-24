import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowRight, FileQuestion, Play } from 'lucide-react';
import PageFrame from './../../components/ui/PageFrame';
import Skeleton from './../../components/ui/Skeleton';
import api from './../../services/api';

const cardStyle = {
  background: 'var(--glass-bg)', backdropFilter: 'blur(var(--glass-blur))',
  border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)',
  padding: '20px', boxShadow: 'var(--glass-shadow)',
};

export default function StudentQuizList() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/quizzes?lessonId=${lessonId}`);
        setQuizzes(res.data);
      } catch (e) {
        console.error('Failed to fetch quizzes', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [lessonId]);

  return (
    <PageFrame eyebrow="\u0627\u0644\u0643\u0648\u064a\u0632\u0627\u062a" title="\u0627\u0644\u0643\u0648\u064a\u0632\u0627\u062a \u0627\u0644\u0645\u062a\u0627\u062d\u0629">
      <div style={{ marginBottom: '16px' }}>
        <button onClick={() => navigate(-1)} style={{
          display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 14px',
          borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
          cursor: 'pointer', background: 'transparent', color: 'var(--text-main)',
          fontSize: '0.8rem', fontWeight: 600,
        }}>
          <ArrowRight size={14} /> \u0631\u062c\u0648\u0639
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Skeleton height="80px" count={3} />
        </div>
      ) : quizzes.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '60px 20px' }}>
          <FileQuestion size={48} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 8px' }}>\u0644\u0627 \u062a\u0648\u062c\u062f \u0643\u0648\u064a\u0632\u0627\u062a \u0645\u062a\u0627\u062d\u0629</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>\u0644\u0645 \u064a\u062a\u0645 \u0646\u0634\u0631 \u0623\u064a \u0643\u0648\u064a\u0632 \u0644\u0647\u0630\u0627 \u0627\u0644\u062f\u0631\u0633 \u0628\u0639\u062f</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {quizzes.map((q) => (
            <Link
              key={q.id}
              to={`/study/${courseId}/lesson/${lessonId}/quiz/${q.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{ ...cardStyle, cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem' }}>{q.title}</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {(q.questions || []).length} \u0623\u0633\u0626\u0644\u0629
                    </p>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
                    borderRadius: 'var(--radius-md)', background: 'var(--primary)',
                    color: '#fff', fontSize: '0.85rem', fontWeight: 600,
                  }}>
                    <Play size={14} /> \u0628\u062f\u0621
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageFrame>
  );
}
