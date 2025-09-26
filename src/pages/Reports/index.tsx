import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNav } from '../../stores/nav';
import AppLayout from '../../components/layout/AppLayout';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { deleteAutomationRule, getEngineStats, getRecentExecutions, listAutomationRules, toggleAutomationRule, type AutomationRule } from '../../api/automation';
import type { AutomationEngineStats } from '../../types/automation';
import { toast } from '../../stores/ui';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useNavigate } from 'react-router-dom';

// Chevron icons (using SVG since we don't have lucide-react)
const ChevronDown = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7-7" />
  </svg>
);

const Timer = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Enhanced type definitions
interface Worker {
  worker_id: string;
  status: string;
  current_jobs?: number;
  jobs_processed?: number;
  jobs_succeeded?: number;
  jobs_failed?: number;
  last_heartbeat?: string;
}

// Use the proper AutomationEngineStats type from our types
type EngineStats = AutomationEngineStats;

export default function Reports() {
  const { setBreadcrumbs } = useNav();
  const navigate = useNavigate();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Reports' }
    ]);
  }, [setBreadcrumbs]);

  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Types for recent executions and metrics
  type ExecutionMetrics = Partial<{
    totalExecutionTime: number | string;
    weatherApiCalls: number | string;
    metaApiCalls: number | string;
    googleApiCalls: number | string;
    actionsExecuted: number | string;
  }>;

  type ExecutionAction = {
    platform?: string;
    target_type?: 'ad_set' | 'campaign';
    ad_set_id?: string;
    campaign_id?: string;
    action?: string;
    success?: boolean;
    error_message?: string;
  };

  type RecentExecution = {
    id: string;
    rule_id?: string;
    rule_name?: string;
    created_at?: string;
    executed_at?: string;
    started_at?: string;
    duration_ms?: number;
    success?: boolean;
    execution_metrics?: ExecutionMetrics;
    actions_taken?: ExecutionAction[];
    weather_data?: unknown;
  };

  const [execs, setExecs] = useState<RecentExecution[]>([]);
  const [loadingExecs, setLoadingExecs] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  // Expandable rows for Recent Activity
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Inner pagination for workers table
  const [workersPage, setWorkersPage] = useState(0);
  const workersPageSize = 10;

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const [engine, setEngine] = useState<EngineStats | null>(null);

  const loadRules = useCallback(async () => {
    setLoadingRules(true);
    try {
      const res = await listAutomationRules({ limit: 100 });
      setRules(res.rules || []);
    } catch (e: unknown) {
      const error = e as Error;
      toast.error(error?.message || 'Failed to load rules');
    } finally {
      setLoadingRules(false);
    }
  }, []);

  const loadExecs = useCallback(async () => {
    setLoadingExecs(true);
    try {
      const res = await getRecentExecutions(pageSize, page * pageSize);
      setExecs((res.executions || []) as RecentExecution[]);
    } catch (e: unknown) {
      const error = e as Error;
      toast.error(error?.message || 'Failed to load activity');
    } finally {
      setLoadingExecs(false);
    }
  }, [page]);

  const loadEngine = useCallback(async () => {
    try { setEngine(await getEngineStats()); } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadRules(); }, [loadRules]);
  useEffect(() => { loadExecs(); }, [loadExecs]);
  useEffect(() => { loadEngine(); }, [loadEngine]);

  const recentRules = useMemo(() => (
    [...rules].sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()).slice(0, 10)
  ), [rules]);

  return (
    <AppLayout>
      <div className="p-6">
        <div className="container-narrow space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Reports & Analytics</h1>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-400">Insights from your automation engine and recent actions.</p>
            </div>
            <Button onClick={() => navigate('/rules/new')}>Create Rule</Button>
          </div>

          {/* Your Automation Rules */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Your Automation Rules</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Quickly toggle or edit your most recent rules</p>
              </div>
            </div>
            <div className="mt-4 divide-y">
              {loadingRules ? (
                <div className="grid place-items-center py-10"><Spinner /></div>
              ) : recentRules.length === 0 ? (
                <div className="py-6 text-sm text-gray-600 dark:text-gray-400">No rules yet.</div>
              ) : (
                recentRules.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-3">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{r.name}</div>
                      <div className="text-xs text-gray-500">Checks every {(r as AutomationRule & { check_interval_minutes?: number }).check_interval_minutes ?? '—'} min</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" onClick={async () => { try { await toggleAutomationRule(r.id); loadRules(); } catch { toast.error('Failed to toggle'); } }}>{r.is_active ? 'Deactivate' : 'Activate'}</Button>
                      <Button variant="ghost" onClick={() => navigate('/rules')}>Edit</Button>
                      <Button variant="ghost" onClick={() => setDeleteId(r.id)} className="text-red-600">Delete</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Recent Activity</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Latest automation executions</p>
              </div>
              <Button variant="ghost" onClick={loadExecs}>Refresh</Button>
            </div>
            <div className="mt-4">
              {loadingExecs ? (
                <div className="grid place-items-center py-10"><Spinner /></div>
              ) : execs.length === 0 ? (
                <div className="py-6 text-sm text-gray-600 dark:text-gray-400">No recent executions.</div>
              ) : (
                <ul className="text-sm space-y-2">
                  {execs.map((e: RecentExecution) => {
                    const when = new Date(e.executed_at || e.created_at || e.started_at || '').toLocaleString();
                    const ok = e.success;
                    const m = e.execution_metrics || {};
                    const isOpen = expandedIds.has(e.id);
                    
                    return (
                      <li key={e.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center justify-between gap-4">
                          <button 
                            className="flex items-center gap-2 min-w-0 hover:bg-gray-50 dark:hover:bg-gray-800 rounded p-1 transition-colors"
                            onClick={() => toggleExpanded(e.id)}
                          >
                            {isOpen ? 
                              <ChevronDown className="h-4 w-4 text-gray-500" /> : 
                              <ChevronRight className="h-4 w-4 text-gray-500" />
                            }
                            <div className="text-left">
                              <div className="font-medium truncate text-gray-900 dark:text-gray-100">{e.rule_name || e.rule_id}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{when}</div>
                            </div>
                          </button>
                          
                          <div className="flex items-center gap-3 text-xs">
                            {'totalExecutionTime' in m && (
                              <span className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300">
                                <Timer className="h-3 w-3" />
                                {m.totalExecutionTime as string}ms
                              </span>
                            )}
                            {'weatherApiCalls' in m && (
                              <span className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300">
                                🌤️ {m.weatherApiCalls as string}
                              </span>
                            )}
                            {'metaApiCalls' in m && (
                              <span className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300">
                                🅵 {m.metaApiCalls as string}
                              </span>
                            )}
                            {'googleApiCalls' in m && (
                              <span className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300">
                                🅶 {m.googleApiCalls as string}
                              </span>
                            )}
                            {'actionsExecuted' in m && (
                              <span className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300">
                                ⚙️ {m.actionsExecuted as string}
                              </span>
                            )}
                            <span className={ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                              {ok ? 'Success' : 'Failed'}
                            </span>
                          </div>
                        </div>
                        
                        {isOpen && (
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded">
                              <div className="font-medium mb-2 text-gray-900 dark:text-gray-100">Actions Taken</div>
                              {Array.isArray(e.actions_taken) && e.actions_taken.length > 0 ? (
                                <ul className="space-y-1">
                                  {e.actions_taken.map((a: ExecutionAction, idx: number) => {
                                    const scope = a.target_type === 'ad_set' || a.ad_set_id 
                                      ? `Ad Set • ${a.ad_set_id}` 
                                      : `Campaign • ${a.campaign_id}`;
                                    return (
                                      <li key={idx} className="flex items-center justify-between">
                                        <span className="text-gray-700 dark:text-gray-300">
                                          {a.platform?.toUpperCase()} • {scope}
                                        </span>
                                        <span className={a.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                          {a.action} {a.success ? '✓' : a.error_message ? `✕ (${a.error_message})` : '✕'}
                                        </span>
                                      </li>
                                    );
                                  })}
                                </ul>
                              ) : (
                                <div className="text-gray-600 dark:text-gray-400">No actions recorded.</div>
                              )}
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded overflow-auto">
                              <div className="font-medium mb-2 text-gray-900 dark:text-gray-100">Weather Snapshot</div>
                              {e.weather_data ? (
                                <pre className="whitespace-pre-wrap break-all text-gray-700 dark:text-gray-300 text-xs max-h-32 overflow-y-auto">
                                  {JSON.stringify(e.weather_data, null, 2)}
                                </pre>
                              ) : (
                                <div className="text-gray-600 dark:text-gray-400">No weather data captured.</div>
                              )}
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="mt-4 flex items-center justify-between">
                <Button variant="ghost" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Previous</Button>
                <div className="text-xs text-gray-600 dark:text-gray-400">Page {page + 1}</div>
                <Button variant="ghost" disabled={execs.length < pageSize} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          </Card>

          {/* Workers */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Workers</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active automation workers and health</p>
              </div>
              <Button variant="ghost" onClick={loadEngine}>Refresh</Button>
            </div>
            <div className="mt-4">
              {!engine?.workers || engine.workers.length === 0 ? (
                <div className="py-6 text-sm text-gray-600 dark:text-gray-400 text-center">No workers registered.</div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200 dark:ring-gray-800">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-900/40">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Worker ID</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Status</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Current Jobs</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Processed</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Succeeded</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Failed</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Last Heartbeat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {engine.workers
                          .slice(workersPage * workersPageSize, (workersPage + 1) * workersPageSize)
                          .map((w: Worker) => {
                            const isHealthy = w.status === 'active' && 
                              w.last_heartbeat && new Date(w.last_heartbeat).getTime() > Date.now() - 5 * 60 * 1000; // 5 min threshold
                            
                            return (
                              <tr key={w.worker_id} className={isHealthy ? '' : 'bg-red-50 dark:bg-red-900/10'}>
                                <td className="px-4 py-2 font-medium truncate max-w-[280px]" title={w.worker_id}>
                                  {w.worker_id}
                                </td>
                                <td className="px-4 py-2">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    isHealthy 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                  }`}>
                                    {w.status}
                                  </span>
                                </td>
                                <td className="px-4 py-2">{w.current_jobs || 0}</td>
                                <td className="px-4 py-2">{w.jobs_processed || 0}</td>
                                <td className="px-4 py-2 text-green-700 dark:text-green-400">{w.jobs_succeeded || 0}</td>
                                <td className="px-4 py-2 text-red-700 dark:text-red-400">{w.jobs_failed || 0}</td>
                                <td className="px-4 py-2 text-xs">
                                  {w.last_heartbeat ? new Date(w.last_heartbeat).toLocaleString() : 'Never'}
                                </td>
                              </tr>
                            );
                          })
                        }
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Workers Pagination */}
                  {engine.workers.length > workersPageSize && (
                    <div className="mt-4 flex items-center justify-between">
                      <Button 
                        variant="ghost" 
                        disabled={workersPage === 0} 
                        onClick={() => setWorkersPage(p => Math.max(0, p - 1))}
                      >
                        Previous
                      </Button>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Showing {workersPage * workersPageSize + 1}-{
                          Math.min((workersPage + 1) * workersPageSize, engine.workers.length)
                        } of {engine.workers.length} workers
                      </div>
                      <Button 
                        variant="ghost" 
                        disabled={(workersPage + 1) * workersPageSize >= engine.workers.length}
                        onClick={() => setWorkersPage(p => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          <ConfirmationModal
            open={!!deleteId}
            onClose={() => setDeleteId(null)}
            onConfirm={async () => {
              if (!deleteId) return;
              try { await deleteAutomationRule(deleteId); toast.success('Rule deleted'); setDeleteId(null); loadRules(); } catch { toast.error('Failed to delete'); }
            }}
            title="Delete Rule"
            message="Are you sure you want to delete this rule?"
            confirmText="Delete"
            cancelText="Cancel"
            destructive
          />
        </div>
      </div>
    </AppLayout>
  );
}
