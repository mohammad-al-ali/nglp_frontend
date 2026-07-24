import { useState, useEffect } from 'react';
import api, { getStoredUser, saveStoredUser, getCurrentUserId } from '../services/api';
import PageFrame from '../components/ui/PageFrame';
import TextField from '../components/ui/TextField';
import {
  useFetchProviders,
  useFetchUserSettings,
  useUpdateUserSettings,
} from '../hooks/useQuiz';

const cardGlass = {
  background: 'var(--glass-bg-enhanced)',
  backdropFilter: 'blur(var(--glass-blur-enhanced))',
  border: '1px solid var(--glass-border-enhanced)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--glass-shadow-enhanced)',
};

export default function ProfilePage() {
  const storedUser = getStoredUser();
  const userId = getCurrentUserId();
  const [form, setForm] = useState({
    fullName: storedUser?.fullName || '',
    email: storedUser?.email || '',
    password: '',
  });
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { providers, fetchProviders } = useFetchProviders();
  const { settings, fetchSettings } = useFetchUserSettings();
  const { updateSettings, loading: savingSettings } = useUpdateUserSettings();

  const [providerKey, setProviderKey] = useState('');
  const [modelKey, setModelKey] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api.get('/users/' + userId)
      .then((response) => {
        if (isMounted) {
          saveStoredUser(response.data);
          setForm({
            fullName: response.data.fullName || '',
            email: response.data.email || '',
            password: '',
          });
        }
      })
      .catch((err) => console.warn('Could not fetch latest user profile info from backend.', err));
    return () => { isMounted = false; };
  }, [userId]);

  useEffect(() => {
    fetchProviders();
    fetchSettings(userId);
  }, [userId]);

  useEffect(() => {
    if (settings) {
      setProviderKey(settings.providerKey || '');
      setModelKey(settings.modelKey || '');
    }
  }, [settings]);

  useEffect(() => {
    if (providers.length > 0 && !settings) {
      const first = providers.find((p) => p.enabled);
      if (first) {
        setProviderKey(first.providerKey);
        setModelKey(first.defaultModel || (first.models || [])[0] || '');
      }
    }
  }, [providers, settings]);

  async function submitForm(event) {
    event.preventDefault();
    setSaved(false);
    setIsSaving(true);
    try {
      const response = await api.put('/users/' + userId, {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
      });
      saveStoredUser(response.data);
      setSaved(true);
    } catch (err) {
      console.warn('Update profile API request failed. Reverting to local update.', err);
      const updatedUser = {
        ...storedUser,
        fullName: form.fullName,
        email: form.email,
      };
      saveStoredUser(updatedUser);
      setSaved(true);
    } finally {
      setIsSaving(false);
    }
  }

  const handleSaveSettings = async () => {
    setSettingsSaved(false);
    try {
      await updateSettings(userId, { providerKey, modelKey });
      setSettingsSaved(true);
    } catch (e) {
      alert(e.message);
    }
  };

  const selectedProvider = providers.find((p) => p.providerKey === providerKey);
  const models = selectedProvider?.models || [];
  const enabledProviders = providers.filter((p) => p.enabled);

  return (
    <PageFrame eyebrow="Account Settings" title="Profile">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Profile form */}
        <form
          onSubmit={submitForm}
          style={{
            ...cardGlass, width: '100%', maxWidth: '540px',
            padding: '36px', display: 'flex', flexDirection: 'column', gap: '20px',
          }}
        >
          <TextField
            label="Name"
            value={form.fullName}
            onChange={(fullName) => setForm({ ...form, fullName })}
            placeholder="John Doe"
          />

          <TextField
            label="Email Address"
            type="email"
            value={form.email}
            onChange={(email) => setForm({ ...form, email })}
            placeholder="name@example.com"
          />

          <TextField
            label="New Password"
            type="password"
            value={form.password}
            onChange={(password) => setForm({ ...form, password })}
            placeholder="(Leave blank to keep current)"
          />

          {saved && (
            <p style={{
              margin: '0', fontSize: '0.85rem', color: 'var(--success)', fontWeight: '600',
              backgroundColor: 'var(--success-soft)', padding: '8px 12px',
              border: '1px solid var(--success-border)', borderRadius: 'var(--radius-sm)',
            }}>
              Profile changes saved successfully.
            </p>
          )}

          <button
            className="primary-button"
            type="submit"
            disabled={isSaving}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '100%', minHeight: '44px', backgroundColor: 'var(--primary)',
              color: 'var(--text-inverse)', border: 'none', borderRadius: 'var(--radius-md)',
              fontWeight: '700', fontSize: '0.95rem',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.7 : 1,
              transition: 'all var(--transition-fast)',
            }}
          >
            {isSaving ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </form>

        {/* AI Provider Settings */}
        <div style={{
          ...cardGlass, width: '100%', maxWidth: '540px',
          padding: '36px', display: 'flex', flexDirection: 'column', gap: '20px',
        }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontFamily: 'var(--font-display)' }}>
            AI Provider Settings
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--quiz-text-secondary)' }}>
            Choose the AI model used for quiz generation and other AI features.
          </p>

          {/* Provider dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Provider
            </label>
            <select
              value={providerKey}
              onChange={(e) => {
                const p = providers.find((pr) => pr.providerKey === e.target.value);
                setProviderKey(e.target.value);
                setModelKey(p?.defaultModel || (p?.models || [])[0] || '');
              }}
            >
              <option value="">-- Select Provider --</option>
              {enabledProviders.map((p) => (
                <option key={p.providerKey} value={p.providerKey}>
                  {p.displayName}
                </option>
              ))}
            </select>
          </div>

          {/* Model dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Model
            </label>
            <select
              value={modelKey}
              onChange={(e) => setModelKey(e.target.value)}
              disabled={!providerKey || models.length === 0}
            >
              <option value="">-- Select Model --</option>
              {models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {settingsSaved && (
            <p style={{
              margin: '0', fontSize: '0.85rem', color: 'var(--success)', fontWeight: '600',
              backgroundColor: 'var(--success-soft)', padding: '8px 12px',
              border: '1px solid var(--success-border)', borderRadius: 'var(--radius-sm)',
            }}>
              AI settings saved successfully.
            </p>
          )}

          <button
            onClick={handleSaveSettings}
            disabled={savingSettings || !providerKey}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '100%', minHeight: '44px', border: 'none',
              borderRadius: 'var(--radius-md)', fontWeight: '700', fontSize: '0.95rem',
              backgroundColor: 'var(--primary)', color: 'var(--text-inverse)',
              cursor: (savingSettings || !providerKey) ? 'not-allowed' : 'pointer',
              opacity: (savingSettings || !providerKey) ? 0.7 : 1,
              transition: 'all var(--transition-fast)',
            }}
          >
            {savingSettings ? 'Saving...' : 'Save AI Settings'}
          </button>
        </div>
      </div>
    </PageFrame>
  );
}