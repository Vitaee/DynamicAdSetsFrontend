import { useState, useRef, useEffect } from 'react';
import { useCampaignsStore } from '../../stores/campaigns';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';

interface AccountSwitcherProps {
  className?: string;
}

export default function AccountSwitcher({ className = '' }: AccountSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    adAccounts,
    selectedAdAccountId,
    accountsLoading,
    setSelectedAdAccount,
    loadCampaignsForAccount,
    getCurrentAccountInfo
  } = useCampaignsStore();

  const currentAccount = getCurrentAccountInfo();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAccountSelect = async (accountId: string) => {
    if (accountId === selectedAdAccountId) {
      setIsOpen(false);
      return;
    }

    setSelectedAdAccount(accountId);
    setIsOpen(false);

    // Refresh campaigns for the selected account
    try {
      await loadCampaignsForAccount(accountId);
    } catch (error) {
      console.error('Failed to load campaigns for account:', error);
    }
  };

  if (adAccounts.length === 0) {
    return null;
  }

  if (adAccounts.length === 1) {
    // Show single account info without dropdown
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="text-sm text-muted">
          Ad Account:
        </div>
        <Badge variant="info" className="max-w-48 truncate">
          {currentAccount?.name || 'Unknown Account'}
        </Badge>
        {currentAccount?.campaignCount !== undefined && (
          <span className="text-xs text-muted">
            ({currentAccount.campaignCount} campaigns)
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 min-w-48"
      >
        <div className="flex-1 text-left">
          <div className="text-sm font-medium truncate">
            {currentAccount?.name || 'Select Account'}
          </div>
          {currentAccount && (
            <div className="text-xs text-muted">
              {currentAccount.campaignCount || 0} campaigns • {currentAccount.currency}
            </div>
          )}
        </div>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface-elevated border border-default rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-medium text-muted px-2 py-1 mb-1">
              Select Ad Account ({adAccounts.length} available)
            </div>
            {adAccounts.map((account) => (
              <button
                key={account.id}
                onClick={() => handleAccountSelect(account.id)}
                className={`w-full text-left px-2 py-2 rounded hover:bg-surface-hover transition-colors ${
                  account.id === selectedAdAccountId 
                    ? 'bg-surface-hover ring-1 ring-primary' 
                    : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium truncate">
                        {account.name}
                      </div>
                      {account.id === selectedAdAccountId && (
                        <Badge variant="success" size="sm">Selected</Badge>
                      )}
                      {accountsLoading[account.id] && (
                        <Spinner size={12} />
                      )}
                    </div>
                    <div className="text-xs text-muted">
                      {account.campaignCount || 0} campaigns • {account.currency} • {account.id}
                    </div>
                  </div>
                  {!account.isActive && (
                    <Badge variant="warning" size="sm">Inactive</Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
          
          <div className="border-t border-default p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsOpen(false);
                window.location.href = '/onboarding/connect-ads';
              }}
              className="w-full text-xs"
            >
              Manage Accounts
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
