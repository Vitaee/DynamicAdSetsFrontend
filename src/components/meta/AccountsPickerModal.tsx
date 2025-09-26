import { useCallback, useEffect, useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Checkbox from '../ui/Checkbox';
import Button from '../ui/Button';
import { useMetaIntegration } from '../../stores/metaIntegration';
import { metaAccountsToggle, metaDisconnect } from '../../api/meta';
import { toast } from '../../stores/ui';
import { useNavigate } from 'react-router-dom';

export default function AccountsPickerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const adAccounts = useMetaIntegration((state) => state.adAccounts);
  const selected = useMetaIntegration((state) => state.selected);
  const toggleSelected = useMetaIntegration((state) => state.toggleSelected);
  const loadAccountData = useMetaIntegration((state) => state.loadAccountData);
  const isFetchingAccount = useMetaIntegration((state) => state.isFetchingAccount);
  const resetMetaIntegration = useMetaIntegration((state) => state.reset);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const perPage = 6;
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔄 Modal: useEffect triggered', { 
      open, 
      reason: open ? 'modal opened' : 'modal closed or component re-render',
      timestamp: new Date().toISOString()
    });
    if (!open) return;

    const MAX_AUTO_FETCH_ATTEMPTS = 5;
    const RETRY_DELAY_MS = 1000;

    let cancelled = false;
    let retryTimer: number | null = null;

    function scheduleRetry(nextAttempt: number) {
      console.log(`⏰ Modal: Scheduling retry ${nextAttempt + 1}/${MAX_AUTO_FETCH_ATTEMPTS} in ${RETRY_DELAY_MS}ms`);
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
      }
      retryTimer = window.setTimeout(() => {
        if (!cancelled) {
          fetchAccounts(nextAttempt);
        }
      }, RETRY_DELAY_MS);
    }

    const fetchAccounts = async (attempt = 0) => {
      console.log(`📡 Modal: Fetch attempt ${attempt + 1}/${MAX_AUTO_FETCH_ATTEMPTS}`);
      try {
        await loadAccountData({ force: true, preserveSelection: attempt > 0 });
        if (cancelled) {
          console.log('🚫 Modal: Fetch cancelled');
          return;
        }
        const state = useMetaIntegration.getState();
        console.log(`📊 Modal: Fetch completed, checking success criteria`, {
          accountsFound: state.adAccounts.length,
          connected: state.connected,
          status: state.status,
          attempt: attempt + 1,
          maxAttempts: MAX_AUTO_FETCH_ATTEMPTS,
          adAccounts: state.adAccounts.map(acc => ({ id: acc.id, name: acc.name, isActive: acc.isActive }))
        });
        
        // IMPORTANT: Always stop after max attempts to prevent infinite loop
        if (attempt >= MAX_AUTO_FETCH_ATTEMPTS - 1) {
          console.log('🛑 Modal: Reached max attempts, stopping retries');
          return;
        }
        
        // Only retry if we truly have no accounts AND not connected
        const shouldRetry = !state.connected && state.adAccounts.length === 0;
        
        if (shouldRetry) {
          console.log('⚠️ Modal: No success criteria met, scheduling retry...', {
            connected: state.connected,
            accountsCount: state.adAccounts.length,
            nextAttempt: attempt + 2
          });
          scheduleRetry(attempt + 1);
        } else {
          console.log('✅ Modal: Fetch process complete - success criteria met', {
            accountsFound: state.adAccounts.length,
            connected: state.connected,
            status: state.status,
            attempt: attempt + 1
          });
        }
      } catch (error) {
        console.error(`❌ Modal: Fetch attempt ${attempt + 1} failed:`, error);
        if (cancelled) {
          return;
        }
        if (attempt >= MAX_AUTO_FETCH_ATTEMPTS - 1) {
          const message = error instanceof Error ? error.message : 'Failed to load Meta accounts';
          console.error('❌ Modal: All fetch attempts failed');
          toast.error(message);
        } else {
          console.log('🔄 Modal: Retrying after error...');
          scheduleRetry(attempt + 1);
        }
      }
    };

    fetchAccounts();

    return () => {
      console.log('🧹 Modal: Cleanup - cancelling fetch operations');
      cancelled = true;
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
      }
    };
  }, [open, loadAccountData]);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setPage(1);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return adAccounts;
    return adAccounts.filter((account) => {
      const id = account.id ?? account.ad_account_id ?? '';
      return (
        (account.name && account.name.toLowerCase().includes(q)) ||
        id.toLowerCase().includes(q)
      );
    });
  }, [search, adAccounts]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

  const handleRefresh = useCallback(async () => {
    console.log('🔄 Modal: Manual refresh triggered');
    try {
      await loadAccountData({ force: true, preserveSelection: true });
      const state = useMetaIntegration.getState();
      console.log('✅ Modal: Manual refresh completed', {
        accountsFound: state.adAccounts.length,
        connected: state.connected
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to refresh Meta accounts';
      console.error('❌ Modal: Manual refresh failed:', error);
      toast.error(message);
    }
  }, [loadAccountData]);

  // Listen for OAuth success messages to refresh data
  useEffect(() => {
    console.log('👂 Modal: OAuth message listener effect triggered', { open });
    if (!open) return;

    const handleMessage = (event: MessageEvent) => {
      console.log('📨 Modal: Received postMessage', { 
        origin: event.origin, 
        expectedOrigin: window.location.origin,
        type: event.data?.type,
        fullData: event.data
      });
      
      if (event.origin !== window.location.origin) {
        console.log('🚫 Modal: Ignoring message from different origin');
        return;
      }
      
      if (event.data.type === 'META_AUTH_SUCCESS') {
        console.log('✅ Modal: OAuth success message received, scheduling refresh in 1500ms');
        // Give backend time to process, then refresh
        setTimeout(() => {
          console.log('🔄 Modal: Triggering refresh after OAuth success');
          handleRefresh();
        }, 1500);
      }
    };

    console.log('👂 Modal: Setting up OAuth success message listener');
    window.addEventListener('message', handleMessage);
    return () => {
      console.log('🧹 Modal: Removing OAuth success message listener');
      window.removeEventListener('message', handleMessage);
    };
  }, [open, handleRefresh]);

  async function connectSelected() {
    try {
      setSaving(true);
      const selectedIds = Object.entries(selected)
        .filter(([, value]) => value)
        .map(([id]) => id);

      if (selectedIds.length === 0) {
        toast.info('Please select at least one account');
        return;
      }

      const currentStatuses: Record<string, boolean> = {};
      adAccounts.forEach((account) => {
        const accountId = account.ad_account_id ?? account.id;
        if (!accountId) return;
        currentStatuses[accountId] = !!account.isActive;
      });

      const operations: Promise<unknown>[] = [];

      selectedIds.forEach((id) => {
        if (currentStatuses[id] !== true) {
          operations.push(metaAccountsToggle(id, true));
        }
      });

      Object.keys(currentStatuses).forEach((id) => {
        const wasActive = currentStatuses[id];
        const isSelected = !!selected[id];
        if (wasActive && !isSelected) {
          operations.push(metaAccountsToggle(id, false));
        }
      });

      await Promise.all(operations);
      toast.success('Selected accounts connected');
      onClose();
      navigate('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not connect accounts';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function disconnectAll() {
    try {
      setSaving(true);
      await metaDisconnect();
      
      // Reset state immediately after disconnection
      resetMetaIntegration();
      
      toast.success('Disconnected Meta account');
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to disconnect';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Select Meta Ad Accounts"
      footerJustify="between"
      footer={
        <>
          <Button
            variant="ghost"
            className="text-rose-600 dark:text-rose-400 hover:underline"
            onClick={disconnectAll}
            disabled={saving || isFetchingAccount}
          >
            Disconnect all
          </Button>
          <div className="ml-auto" />
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button onClick={connectSelected} disabled={saving || isFetchingAccount}>
            {saving ? 'Saving...' : 'Connect Accounts'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              placeholder="Search by name or ID"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetchingAccount}
          >
            {isFetchingAccount ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-xl ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden">
          {isFetchingAccount ? (
            <div className="p-6 text-center text-sm text-gray-600 dark:text-gray-400">
              Loading accounts...
            </div>
          ) : pageItems.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-600 dark:text-gray-400">
              No accounts found.
            </div>
          ) : (
            pageItems.map((account) => {
              const accountId = account.id ?? account.ad_account_id ?? '';
              if (!accountId) return null;
              return (
                <label
                  key={accountId}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <Checkbox
                    checked={!!selected[accountId]}
                    onChange={(event) => toggleSelected(accountId, event.currentTarget.checked)}
                    disabled={saving || isFetchingAccount}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {account.name || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">{accountId}</div>
                  </div>
                  {account.isActive ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:ring-emerald-800">
                      Active
                    </span>
                  ) : null}
                </label>
              );
            })
          )}
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-600 dark:text-gray-400">
            Page {page} / {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1}>
              Prev
            </Button>
            <Button
              variant="ghost"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
