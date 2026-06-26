import './GlassHeroPreview.css';

export default function GlassHeroPreview() {
  return (
    <section className="glass-preview-container">
      <div className="glass-preview-bg">
        <div className="glass-preview-orbe glass-preview-orbe--1" />
        <div className="glass-preview-orbe glass-preview-orbe--2" />
        <div className="glass-preview-orbe glass-preview-orbe--3" />
      </div>

      <div className="glass-preview-content">
        <div className="glass-preview-card">
          <span className="glass-preview-badge">منصة NGLP التعليمية</span>
          <h1 className="glass-preview-title">
            تعلم بذكاء مع<br />
            <span className="glass-preview-gradient-text">المساعد الذكي</span>
          </h1>
          <p className="glass-preview-description">
            بيئة تعليمية متكاملة تدمج بين الدروس المرئية، النصوص المفرغة، والمساعد
            الذكي (AI Tutor) لتمنحك تجربة دراسية تفاعلية غير مسبوقة.
          </p>
          <div className="glass-preview-actions">
            <a href="/catalog" className="glass-preview-btn glass-preview-btn--primary">
              استكشف الكورسات
            </a>
            <a href="/dashboard" className="glass-preview-btn glass-preview-btn--secondary">
              متابعة التعلم
            </a>
          </div>
        </div>

        <div className="glass-preview-card glass-preview-card--illustration">
          <div className="glass-preview-window">
            <div className="glass-preview-window-header">
              <span className="glass-preview-dot glass-preview-dot--red" />
              <span className="glass-preview-dot glass-preview-dot--yellow" />
              <span className="glass-preview-dot glass-preview-dot--green" />
            </div>
            <div className="glass-preview-window-body">
              <div className="glass-preview-window-sidebar">
                <div className="glass-preview-window-line" style={{ width: '70%' }} />
                <div className="glass-preview-window-line" style={{ width: '50%' }} />
                <div className="glass-preview-window-line" style={{ width: '85%' }} />
                <div className="glass-preview-window-line" style={{ width: '40%' }} />
              </div>
              <div className="glass-preview-window-main">
                <div className="glass-preview-window-player">
                  <div className="glass-preview-play-icon" />
                </div>
              </div>
              <div className="glass-preview-window-chat">
                <div className="glass-preview-chat-bubble glass-preview-chat-bubble--ai" />
                <div className="glass-preview-chat-bubble glass-preview-chat-bubble--user" />
                <div className="glass-preview-chat-bubble glass-preview-chat-bubble--ai" style={{ width: '55%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
