/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/EmptyState';
import Button from '../../components/ui/Button';
import AppLayout from '../../components/layout/AppLayout';
import { useNav } from '../../stores/nav';
import { useNavigate } from 'react-router-dom';
import Badge from '../../components/ui/Badge';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { deleteAutomationRule, listAutomationRules, toggleAutomationRule, type AutomationRule } from '../../api/automation';
import Spinner from '../../components/ui/Spinner';
import { toast } from '../../stores/ui';

export default function RulesList() {
  const { setBreadcrumbs } = useNav();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Automation Rules' }
    ]);
  }, [setBreadcrumbs]);

  async function load() {
    setLoading(true);
    try {
      const res = await listAutomationRules({ limit: 100 });
      setRules(res.rules || []);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load rules');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const summary = useMemo(() => {
    const total = rules.length;
    const active = rules.filter((r) => r.is_active).length;
    return { total, active };
  }, [rules]);

  return (
    <AppLayout>
      <div className="p-6">
        <div className="container-narrow space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Automation Rules</h1>
            <Button onClick={() => navigate('/rules/new')}>New Rule</Button>
          </div>
          <Card>
            {loading ? (
              <div className="grid place-items-center py-16"><Spinner /></div>
            ) : rules.length === 0 ? (
              <EmptyState
                title="No rules yet"
                description="Create your first rule to automate actions based on live weather conditions."
                action={<Button onClick={() => navigate('/rules/new')}>Create rule</Button>}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted">{summary.active} active of {summary.total} total</p>
                  <Button variant="ghost" onClick={load}>Refresh</Button>
                </div>
                <div className="overflow-x-auto rounded-xl ring-1 border-default">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-hover">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted">Platforms</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted">Ad Sets</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted">Created</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-subtle">
                      {rules.map((r) => {
                        const platforms = Array.from(new Set((r.campaigns || []).map((c: any) => c.platform))).join(', ') || '—';
                        const adsets = (r.campaigns || []).length;
                        const created = r.created_at ? new Date(r.created_at).toLocaleString() : '—';
                        return (
                          <tr key={r.id} className="hover:bg-surface-hover">
                            <td className="px-4 py-3 text-foreground font-medium">{r.name}</td>
                            <td className="px-4 py-3">{r.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="muted">Inactive</Badge>}</td>
                            <td className="px-4 py-3 text-foreground">{platforms}</td>
                            <td className="px-4 py-3 text-foreground">{adsets}</td>
                            <td className="px-4 py-3 text-foreground">{created}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/rules/${r.id}`)}
                                  className="text-primary hover:opacity-75"
                                >
                                  Details
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      await toggleAutomationRule(r.id);
                                      await load();
                                    } catch (e: any) {
                                      toast.error(e?.message || 'Failed to toggle');
                                    }
                                  }}
                                >
                                  {r.is_active ? 'Deactivate' : 'Activate'}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setDeleteId(r.id)}
                                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
          <ConfirmationModal
            open={!!deleteId}
            onClose={() => setDeleteId(null)}
            onConfirm={async () => {
              if (!deleteId) return;
              try {
                await deleteAutomationRule(deleteId);
                toast.success('Rule deleted');
                setDeleteId(null);
                load();
              } catch (e: any) {
                toast.error(e?.message || 'Failed to delete');
              }
            }}
            title="Delete Rule"
            message="Are you sure you want to delete this automation rule? This cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
            destructive
          />
        </div>
      </div>
    </AppLayout>
  );
}
