import PageShell from './page-shell';
import PageHeader from './page-header';

/**
 * Thin compatibility wrapper over PageShell + PageHeader. Kept so the
 * 14 existing call sites need no changes right now and inherit the
 * new styling in this one commit; each is migrated to the split API
 * directly as its own page is refactored, and this file deletes
 * itself once nothing imports it.
 */
export default function PageFrame({ eyebrow, title, actions, children }) {
  return (
    <PageShell>
      <PageHeader eyebrow={eyebrow} title={title} actions={actions} />
      {children}
    </PageShell>
  );
}
