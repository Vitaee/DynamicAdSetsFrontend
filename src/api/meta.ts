import { request } from './http';

export type MetaAdAccount = { 
  id: string; 
  name: string; 
  account_status?: string;
  currency?: string;
  timezone_name?: string;
  isActive?: boolean;
  // Backend fields
  ad_account_id?: string;
  business_id?: string;
  business_name?: string;
};

export type MetaAccount = {
  id: string;
  name: string;
  email?: string;
  connectedAt: string;
  adAccounts?: MetaAdAccount[];
};

export function metaGetAccount() {
  console.log('🌐 API: Making metaGetAccount request to /meta/account');
  return request<{ connected: boolean; expired?: boolean; message?: string; account?: MetaAccount }>(`/meta/account`)
    .then(response => {
      console.log('📥 API: metaGetAccount response received', {
        connected: response.connected,
        hasAccount: !!response.account,
        accountId: response.account?.id,
        adAccountsCount: response.account?.adAccounts?.length || 0
      });
      return response;
    })
    .catch(error => {
      console.error('❌ API: metaGetAccount failed', error);
      throw error;
    });
}

export function metaAuthUrl(redirectUri: string) {
  return request<{ authUrl: string; state: string }>(`/meta/auth/url`, {
    method: 'POST',
    body: JSON.stringify({ redirectUri }),
  });
}

export function metaAuthCallback(body: { code: string; state: string; redirectUri: string }) {
  console.log('🌐 API: Making metaAuthCallback request to /meta/auth/callback', {
    hasCode: !!body.code,
    state: body.state,
    redirectUri: body.redirectUri
  });
  return request<{ message: string; accountInfo: { id: string; name: string; email?: string; adAccountsCount: number } }>(`/meta/auth/callback`, {
    method: 'POST',
    body: JSON.stringify(body),
  }).then(response => {
    console.log('📥 API: metaAuthCallback response received', {
      message: response.message,
      accountInfo: response.accountInfo
    });
    return response;
  }).catch(error => {
    console.error('❌ API: metaAuthCallback failed', error);
    throw error;
  });
}

export function metaAccountsToggle(adAccountId: string, isActive: boolean) {
  return request<{ message: string; adAccountId: string; isActive: boolean }>(`/meta/accounts/toggle`, {
    method: 'POST',
    body: JSON.stringify({ adAccountId, isActive }),
  });
}

export function metaDisconnect() {
  return request<{ message: string }>(`/meta/account`, { method: 'DELETE' });
}
