import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Checkbox from '../../components/ui/Checkbox';
import { useEffect, useState, useCallback, useRef } from 'react';
import { metaAuthUrl } from '../../api/meta';
import facebookLogo from '../../assets/facebooklogo.png';
import googleLogo from '../../assets/googleadlogo.png';

type Platform = 'meta' | 'google';

interface PlatformCardProps {
  platform: Platform;
  selected: boolean;
  onChange: (platform: Platform, selected: boolean) => void;
  connected?: boolean;
  accountName?: string;
  adAccountsCount?: number;
  disabled?: boolean;
}

const PlatformCard = ({ 
  platform, 
  selected, 
  onChange, 
  connected = false, 
  accountName, 
  adAccountsCount,
  disabled = false 
}: PlatformCardProps) => {
  const branding = platform === 'meta'
    ? { label: 'Facebook & Instagram', img: facebookLogo }
    : { label: 'Google Ads', img: googleLogo };

  const handleClick = useCallback(() => {
    if (!disabled) {
      onChange(platform, !selected);
    }
  }, [platform, selected, onChange, disabled]);

  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      onChange(platform, e.currentTarget.checked);
    }
  }, [platform, onChange, disabled]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`w-full rounded-2xl border border-default bg-surface-elevated p-4 sm:p-6 text-left shadow-sm hover:bg-surface-hover transition-all duration-200 cursor-pointer focus-ring ${
        selected ? 'ring-2 ring-primary' : ''
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="flex items-center gap-3">
        <Checkbox 
          checked={selected} 
          onChange={handleCheckboxChange}
          disabled={disabled}
        />
        <img 
          src={branding.img} 
          alt={branding.label} 
          className="h-8 sm:h-10 object-contain" 
        />
        <span className="font-medium">{branding.label}</span>
        {connected && (
          <span className="ml-auto wt-badge wt-badge-success">
            Connected
          </span>
        )}
        {disabled && platform === 'google' && (
          <span className="ml-auto wt-badge wt-badge-neutral">
            Coming Soon
          </span>
        )}
      </div>
      {connected && (
        <div className="mt-3 text-xs text-muted">
          {typeof adAccountsCount === 'number' && (
            <div className="mb-0.5 font-medium text-muted">
              {adAccountsCount} {adAccountsCount === 1 ? 'account' : 'accounts'} connected
            </div>
          )}
          <div>
            Account: <span className="font-medium">{accountName || '—'}</span>
          </div>
        </div>
      )}
    </button>
  );
};

import AppLayout from '../../components/layout/AppLayout';
import StepBadge from '../../components/ui/StepBadge';
import Modal from '../../components/ui/Modal';
import { toast } from '../../stores/ui';
import { useMetaIntegration } from '../../stores/metaIntegration';
import AccountsPickerModal from '../../components/meta/AccountsPickerModal';

export default function AdAccountSelect() {
  const [selected, setSelected] = useState<Platform | null>('meta');
  const [showModal, setShowModal] = useState(false);
  const [showAccountsPicker, setShowAccountsPicker] = useState(false);
  // OAuth message dedupe guards
  const authHandledRef = useRef(false);
  const authSuccessRef = useRef(false);
  
  // Add a state to track if we're processing after OAuth success
  const [isProcessingConnection, setIsProcessingConnection] = useState(false);
  
  const metaIntegration = useMetaIntegration();
  const { 
    status, 
    connected, 
    account, 
    error,
    initializeConnection,
    refreshConnection,
    setConnected: setMetaConnected
  } = metaIntegration;

  const isLoading = status === 'loading';
  const isConnecting = status === 'connecting';

  // Initialize connection check on mount
  useEffect(() => {
    initializeConnection();
  }, [initializeConnection]);

  // Handle platform selection with proper validation
  const handlePlatformChange = useCallback((platform: Platform, isSelected: boolean) => {
    if (platform === 'google') {
      // Google Ads not available yet
      toast.info('Google Ads integration is coming soon.');
      return;
    }
    
    setSelected(isSelected ? platform : null);
  }, []);

  const handleContinue = useCallback(() => {
    if (!selected) {
      toast.error('Please select a platform to continue.');
      return;
    }

    if (selected === 'meta') {
      if (connected) {
        setShowAccountsPicker(true);
      } else {
        setShowModal(true);
      }
    } else if (selected === 'google') {
      toast.info('Google Ads integration is coming soon.');
    }
  }, [selected, connected]);

  const startMetaOAuth = useCallback(async () => {
    console.log('🚀 OAuth: Starting Meta OAuth flow...');
    try {
      // Reset guards for this OAuth session
      authHandledRef.current = false;
      authSuccessRef.current = false;
      
      metaIntegration.setStatus('connecting');
      console.log('📡 OAuth: Getting auth URL...');
      
      const redirectUri = `${window.location.origin}/oauth/meta/callback`;
      const { authUrl } = await metaAuthUrl(redirectUri);
      
      console.log('🔗 OAuth: Auth URL received, opening popup...', { authUrl: authUrl.substring(0, 100) + '...' });
      
      // Calculate popup position for center alignment
      const popupWidth = 720;
      const popupHeight = 780;
      const left = window.screenX + (window.outerWidth - popupWidth) / 2;
      const top = window.screenY + (window.outerHeight - popupHeight) / 2;
      
      const popup = window.open(
        authUrl,
        'meta-oauth',
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );
      
      if (!popup) {
        console.error('❌ OAuth: Popup was blocked');
        throw new Error('Popup blocked. Please allow popups and try again.');
      }

      console.log('✅ OAuth: Popup opened successfully');

      const handleAuthMessage = (event: MessageEvent) => {
        console.log('📨 OAuth: Received message', { 
          origin: event.origin, 
          expectedOrigin: window.location.origin, 
          type: event.data?.type, 
          message: event.data?.message 
        });
        
        if (event.origin !== window.location.origin) {
          console.log('🚫 OAuth: Ignoring message from different origin');
          return;
        }
        
        const evtType = event.data?.type as string | undefined;
        
        if (evtType === 'META_AUTH_SUCCESS') {
          if (authSuccessRef.current) { 
            console.log('⚠️ OAuth: Duplicate success received; ignoring'); 
            return; 
          }
          authSuccessRef.current = true;
          authHandledRef.current = true;
          
          console.log('✅ OAuth: Auth success message received');
          setMetaConnected(true);
          setIsProcessingConnection(true); // Show processing state
          
          console.log('🔄 OAuth: Refreshing connection to get account details...');
          refreshConnection()
            .then(() => {
              console.log('✅ OAuth: Connection refreshed successfully');
              toast.success('Your Meta account is now linked.', 'Connected');
              metaIntegration.setStatus('connected');
              setShowModal(false);
              setShowAccountsPicker(true);
              console.log('🎯 OAuth: OAuth flow completed - opening accounts picker');
            })
            .catch((error) => {
              console.error('❌ OAuth: Failed to refresh account details:', error);
              toast.error('Account connected but failed to load details. Please refresh the page.');
              metaIntegration.setStatus('error');
            })
            .finally(() => {
              setIsProcessingConnection(false); // Reset processing state
              cleanup();
            });
            
        } else if (evtType === 'META_AUTH_ERROR') {
          if (authSuccessRef.current || authHandledRef.current) { 
            console.log('⚠️ OAuth: Ignoring late error after success/handled'); 
            return; 
          }
          authHandledRef.current = true;
          
          const errorMessage = event.data?.message || 'Meta authentication failed';
          console.error('❌ OAuth: Auth error message received', { errorMessage });
          metaIntegration.setError(errorMessage);
          metaIntegration.setStatus('idle');
          setIsProcessingConnection(false); // Reset processing state
          toast.error(errorMessage);
          setShowModal(false);
          cleanup();
        }
      };

      const cleanup = () => {
        console.log('🧹 OAuth: Cleaning up event listeners and timers');
        window.removeEventListener('message', handleAuthMessage);
        if (timer) clearInterval(timer);
      };

      window.addEventListener('message', handleAuthMessage);
      
      // Check if popup is closed manually
      const timer = setInterval(() => {
        if (popup.closed) {
          console.log('⚠️ OAuth: Popup was closed by user');
          cleanup();
          if (metaIntegration.status === 'connecting' && !authHandledRef.current) {
            console.log('🔄 OAuth: Resetting status from connecting to idle');
            metaIntegration.setStatus('idle');
            setIsProcessingConnection(false);
          }
        }
      }, 1000);

      // Add a timeout to prevent hanging forever
      setTimeout(() => {
        if (metaIntegration.status === 'connecting' && !authHandledRef.current) {
          console.log('⏰ OAuth: OAuth timeout reached, cleaning up');
          cleanup();
          if (!popup.closed) {
            popup.close();
          }
          metaIntegration.setStatus('idle');
          setIsProcessingConnection(false);
          toast.error('OAuth process timed out. Please try again.');
        }
      }, 5 * 60 * 1000); // 5 minute timeout

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Could not start Meta authentication';
      console.error('❌ OAuth: Failed to start OAuth flow:', error);
      metaIntegration.setError(errorMessage);
      metaIntegration.setStatus('idle'); // Reset status on error
      setIsProcessingConnection(false); // Reset processing state
      toast.error(errorMessage);
      setShowModal(false);
    }
  }, [metaIntegration, setMetaConnected, refreshConnection]);

  return (
    <AppLayout>
      <div className="p-6">
        <div className="container-narrow">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Connect Your Ad Accounts</h1>
              <p className="text-sm text-muted">
                Linking your ad account to WeatherTrigger does not make any changes to your ad account
              </p>
            </div>
            <StepBadge step={1} total={2} />
          </div>

          {/* Show error state if needed */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              <p className="text-sm font-medium">Connection Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <PlatformCard
                platform="meta"
                selected={selected === 'meta'}
                onChange={handlePlatformChange}
                connected={connected}
                accountName={account?.name || account?.email}
                adAccountsCount={account?.adAccounts?.length}
                disabled={isLoading || isConnecting}
              />
            </Card>
            <Card>
              <PlatformCard 
                platform="google" 
                selected={selected === 'google'} 
                onChange={handlePlatformChange}
                disabled={true} // Google Ads coming soon
              />
            </Card>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => (window.location.href = '/')}>
              Cancel
            </Button>
            <Button 
              onClick={handleContinue} 
              disabled={!selected || isLoading || isConnecting}
              variant="primary"
            >
              {isConnecting ? 'Connecting…' : 
               connected && selected === 'meta' ? 'Manage Connection' : 
               'Continue'}
            </Button>
          </div>
        </div>
      </div>
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Connect Your Meta (Facebook) Account"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={startMetaOAuth} 
              disabled={isConnecting || isProcessingConnection || !showModal}
              variant="primary"
            >
              {isConnecting ? 'Opening…' : 
               isProcessingConnection ? 'Connecting Account…' : 
               'Connect Account'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-muted">
            Linking your ad account to WeatherTrigger does not make any changes to your ad account.
          </p>
          
          <div>
            <p className="font-medium mb-2">Before connecting, please ensure:</p>
            <ol className="list-decimal pl-6 space-y-1 text-sm text-muted">
              <li>You are logged into the correct Facebook account</li>
              <li>You have access to Facebook Business Manager</li>
              <li>Your ad accounts are properly configured</li>
              <li>You have admin permissions for the accounts you want to connect</li>
            </ol>
          </div>
          
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400">
            <p className="text-sm">
              <strong>Note:</strong> A popup window will open for authentication. 
              Please ensure popups are enabled for this site.
            </p>
          </div>
        </div>
      </Modal>

      <AccountsPickerModal open={showAccountsPicker} onClose={() => setShowAccountsPicker(false)} />
    </AppLayout>
  );
}

