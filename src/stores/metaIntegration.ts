import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { metaGetAccount } from '../api/meta';
import { requestCache } from '../lib/requestCache';

export interface MetaAccount {
  id: string;
  name?: string;
  email?: string;
  adAccounts?: MetaAdAccount[];
}

export interface MetaAdAccount {
  id?: string;
  ad_account_id?: string;
  name?: string;
  isActive?: boolean;
  account_status?: string;
  currency?: string;
  timezone_name?: string;
  business_id?: string;
  business_name?: string;
  is_active?: boolean;
}

type LoadAccountOptions = {
  force?: boolean;
  preserveSelection?: boolean;
};

type RawMetaAdAccount = Partial<MetaAdAccount> & { is_active?: boolean };

interface MetaIntegrationState {
  status: 'idle' | 'loading' | 'connecting' | 'connected' | 'error';
  connected: boolean;
  error: string | null;

  account: MetaAccount | null;
  adAccounts: MetaAdAccount[];
  selected: Record<string, boolean>;

  lastFetchTime: number;
  isInitialized: boolean;
  isFetchingAccount: boolean;

  initializeConnection: () => Promise<void>;
  loadAccountData: (options?: LoadAccountOptions) => Promise<void>;
  setStatus: (status: MetaIntegrationState['status']) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  setAccount: (account: MetaAccount | null) => void;
  setAdAccounts: (adAccounts: MetaAdAccount[], options?: { preserveSelection?: boolean }) => void;
  toggleSelected: (id: string, checked: boolean) => void;
  clearSelected: () => void;
  reset: () => void;
  refreshConnection: () => Promise<void>;
  syncAfterAuth: () => Promise<void>;

  getSelectedAccounts: () => MetaAdAccount[];
  getTotalSelectedAccounts: () => number;
}

const CACHE_DURATION = 5 * 60 * 1000;
const wait = (ms: number) => new Promise<void>((resolve) => { setTimeout(resolve, ms); });

let inFlightAccountFetch: Promise<void> | null = null;

const normalizeAdAccounts = (accounts?: RawMetaAdAccount[]): MetaAdAccount[] => {
  if (!accounts || accounts.length === 0) return [];

  return accounts
    .map((account) => {
      const id = account.ad_account_id ?? account.id;
      if (!id) return null;

      const isActive = typeof account.isActive === 'boolean'
        ? account.isActive
        : typeof account.is_active === 'boolean'
          ? account.is_active
          : false;

      return {
        ...account,
        id,
        ad_account_id: account.ad_account_id ?? id,
        isActive,
      } as MetaAdAccount;
    })
    .filter((account): account is MetaAdAccount => account !== null);
};

const buildSelectionMap = (
  accounts: MetaAdAccount[],
  previous: Record<string, boolean> | undefined,
  preserveSelection: boolean,
): Record<string, boolean> => {
  if (accounts.length === 0) return {};

  const next: Record<string, boolean> = {};
  accounts.forEach((account) => {
    const accountId = account.ad_account_id ?? account.id;
    if (!accountId) return;

    if (preserveSelection && previous && Object.prototype.hasOwnProperty.call(previous, accountId)) {
      next[accountId] = !!previous[accountId];
    } else {
      next[accountId] = !!account.isActive;
    }
  });

  return next;
};

export const useMetaIntegration = create<MetaIntegrationState>()(
  subscribeWithSelector((set, get) => ({
    status: 'idle',
    connected: false,
    error: null,
    account: null,
    adAccounts: [],
    selected: {},
    lastFetchTime: 0,
    isInitialized: false,
    isFetchingAccount: false,

    initializeConnection: async () => {
      try {
        await get().loadAccountData();
      } catch {
        // Error state already captured in the store.
      }
    },

    loadAccountData: async (options: LoadAccountOptions = {}) => {
      const { force = false, preserveSelection = false } = options;
      const state = get();

      console.log('📡 Meta Store: loadAccountData called', {
        force,
        preserveSelection,
        currentState: {
          status: state.status,
          connected: state.connected,
          isFetchingAccount: state.isFetchingAccount,
          isInitialized: state.isInitialized,
          adAccountsCount: state.adAccounts.length,
          lastFetchTime: state.lastFetchTime,
          timeSinceLastFetch: Date.now() - state.lastFetchTime
        },
        caller: new Error().stack?.split('\n')[2]?.trim() // Log who called this
      });

      if (state.isFetchingAccount && inFlightAccountFetch) {
        console.log('⏳ Meta Store: Request already in flight, returning existing promise');
        return inFlightAccountFetch;
      }

      const now = Date.now();
      if (!force && state.isInitialized && state.account && (now - state.lastFetchTime) < CACHE_DURATION) {
        console.log('💾 Meta Store: Using cached data (within cache duration)', {
          cacheAge: now - state.lastFetchTime,
          cacheDuration: CACHE_DURATION
        });
        return;
      }

      // Clear cache when forcing a reload to prevent stale data
      if (force) {
        console.log('🗑️ Meta Store: Force reload - invalidating cache');
        requestCache.invalidate('meta-account-status');
      }

      const previousStatus = state.status;
      console.log('🔄 Meta Store: Setting loading state', { previousStatus });
      set({
        isFetchingAccount: true,
        status: previousStatus === 'connecting' ? 'connecting' : 'loading',
        error: null,
      });

      const fetchPromise = (async () => {
        try {
          console.log('📡 Meta Store: Making API request to metaGetAccount...');
          const response = await requestCache.get(
            'meta-account-status',
            () => metaGetAccount(),
            { ttl: CACHE_DURATION, force }
          );

          console.log('📥 Meta Store: Received API response', {
            connected: response.connected,
            hasAccount: !!response.account,
            accountId: response.account?.id,
            accountName: response.account?.name,
            rawAdAccounts: response.account?.adAccounts?.length || 0,
            fullResponse: JSON.stringify(response, null, 2)
          });

          const normalizedAccounts = normalizeAdAccounts(response.account?.adAccounts);
          console.log('🔧 Meta Store: Normalized ad accounts', {
            originalCount: response.account?.adAccounts?.length || 0,
            normalizedCount: normalizedAccounts.length,
            accounts: normalizedAccounts.map(acc => ({ 
              id: acc.id, 
              ad_account_id: acc.ad_account_id, 
              name: acc.name, 
              isActive: acc.isActive 
            })),
            rawAccounts: JSON.stringify(response.account?.adAccounts, null, 2)
          });

          const prevState = get();
          const hadPrevData = prevState.connected && prevState.adAccounts.length > 0;
          const hasNewData = normalizedAccounts.length > 0;

          // Sticky state: if backend briefly reports no accounts during refresh,
          // keep previously loaded accounts to avoid flashing empty UI.
          if (!hasNewData && hadPrevData) {
            console.log('⚠️ Meta Store: Empty refresh result; keeping previous accounts');
            set({
              connected: prevState.connected,
              status: prevState.status === 'connecting' ? 'connecting' : 'connected',
              account: prevState.account,
              adAccounts: prevState.adAccounts,
              selected: prevState.selected,
              lastFetchTime: Date.now(),
              isInitialized: true,
              error: null,
            });
            return;
          }

          const selection = buildSelectionMap(
            normalizedAccounts,
            preserveSelection ? prevState.selected : undefined,
            preserveSelection,
          );

          console.log('✅ Meta Store: Setting successful state', {
            connected: !!response.connected,
            status: response.connected ? 'connected' : 'idle',
            adAccountsCount: normalizedAccounts.length,
            selectionCount: Object.keys(selection).length
          });

          set({
            connected: !!response.connected,
            status: response.connected ? 'connected' : 'idle',
            account: response.account
              ? { ...response.account, adAccounts: normalizedAccounts }
              : null,
            adAccounts: normalizedAccounts,
            selected: selection,
            lastFetchTime: Date.now(),
            isInitialized: true,
            error: null,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to check Meta connection';
          console.error('❌ Meta Store: API request failed', { error: message, fullError: error });

          set({
            connected: false,
            status: 'error',
            error: message,
            account: null,
            adAccounts: [],
            selected: {},
            lastFetchTime: Date.now(),
            isInitialized: true,
          });

          throw error;
        } finally {
          console.log('🏁 Meta Store: Request completed, clearing loading state');
          set({ isFetchingAccount: false });
        }
      })();

      inFlightAccountFetch = fetchPromise;
      try {
        await fetchPromise;
      } finally {
        inFlightAccountFetch = null;
      }
    },

    setStatus: (status) => set({ status }),

    setConnected: (connected) =>
      set((state) => ({
        connected,
        status: connected ? 'connected' : state.error ? 'error' : 'idle',
        error: connected ? null : state.error,
      })),

    setError: (error) =>
      set({
        error,
        status: error ? 'error' : 'idle',
      }),

    setAccount: (account) =>
      set((state) => ({
        account,
        adAccounts: account?.adAccounts ? normalizeAdAccounts(account.adAccounts) : state.adAccounts,
      })),

    setAdAccounts: (adAccounts, options) =>
      set((state) => {
        const preserveSelection = options?.preserveSelection ?? false;
        const normalized = normalizeAdAccounts(adAccounts);
        const selection = buildSelectionMap(
          normalized,
          preserveSelection ? state.selected : undefined,
          preserveSelection,
        );

        return {
          adAccounts: normalized,
          selected: selection,
          account: state.account ? { ...state.account, adAccounts: normalized } : state.account,
        };
      }),

    toggleSelected: (id, checked) =>
      set((state) => {
        const next = { ...state.selected };
        if (checked) {
          next[id] = true;
        } else {
          delete next[id];
        }
        return { selected: next };
      }),

    clearSelected: () => set({ selected: {} }),

    reset: () => {
      // Clear cache immediately to prevent stale data
      requestCache.invalidatePattern(/^meta-/);
      
      // Cancel any in-flight requests
      if (inFlightAccountFetch) {
        inFlightAccountFetch = null;
      }
      
      set({
        status: 'idle',
        connected: false,
        error: null,
        account: null,
        adAccounts: [],
        selected: {},
        lastFetchTime: 0,
        isInitialized: false,
        isFetchingAccount: false,
      });
    },

    refreshConnection: async () => {
      const maxAttempts = 5;
      let lastError: unknown = null;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (attempt > 0) {
          await wait(500 + attempt * 250);
        }
        requestCache.invalidate('meta-account-status');
        set({ lastFetchTime: 0, isInitialized: false });
        try {
          await get().loadAccountData({ force: true, preserveSelection: true });
        } catch (error) {
          lastError = error;
          continue;
        }
        const { adAccounts } = get();
        if (adAccounts.length > 0) {
          return;
        }
      }
      if (lastError) {
        console.warn('Meta refresh did not load accounts after retries', lastError);
      }
    },

    // New method to handle post-OAuth success synchronization
    syncAfterAuth: async () => {
      console.log('🔄 Meta Store: syncAfterAuth starting...');
      
      // Wait a moment for backend to process OAuth callback
      console.log('⏱️ Meta Store: Waiting 1000ms for backend processing...');
      await wait(1000);
      
      // Force clear all cached data
      console.log('🗑️ Meta Store: Invalidating cache patterns...');
      requestCache.invalidatePattern(/^meta-/);
      
      // Reset state completely
      console.log('🔄 Meta Store: Resetting state completely...');
      set({
        status: 'idle',
        connected: false,
        error: null,
        account: null,
        adAccounts: [],
        selected: {},
        lastFetchTime: 0,
        isInitialized: false,
        isFetchingAccount: false,
      });
      
      // Load fresh data
      console.log('📡 Meta Store: Loading fresh data with force=true...');
      try {
        await get().loadAccountData({ force: true });
        const { account, adAccounts, connected } = get();
        console.log('✅ Meta Store: Fresh data loaded successfully', {
          connected,
          hasAccount: !!account,
          adAccountsCount: adAccounts.length,
          adAccounts: adAccounts.map(acc => ({ id: acc.id, name: acc.name, isActive: acc.isActive }))
        });
      } catch (error) {
        console.error('❌ Meta Store: Failed to load fresh data after sync:', error);
        throw error;
      }
    },

    getSelectedAccounts: () => {
      const { adAccounts, selected } = get();
      return adAccounts.filter((account) => {
        const accountId = account.ad_account_id ?? account.id;
        return !!accountId && !!selected[accountId];
      });
    },

    getTotalSelectedAccounts: () => {
      const { selected } = get();
      return Object.keys(selected).length;
    },
  }))
);
