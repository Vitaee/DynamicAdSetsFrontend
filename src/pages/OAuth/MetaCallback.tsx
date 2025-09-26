import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { metaAuthCallback } from '../../api/meta';
import { toast } from '../../stores/ui';
import AppLayout from '../../components/layout/AppLayout';

export default function MetaCallback() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const code = params.get('code') || '';
  const state = params.get('state') || '';
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔄 OAuth Callback: Starting OAuth flow', { code: !!code, state });
    
    (async () => {
      try {
        if (!code) throw new Error('Missing code');
        const redirectUri = `${window.location.origin}/oauth/meta/callback`;
        
        console.log('📡 OAuth Callback: Calling metaAuthCallback...', { redirectUri });
        await metaAuthCallback({ code, state, redirectUri });
        console.log('✅ OAuth Callback: metaAuthCallback successful');
        
        // If opened as a popup, inform the opener then close
        if (window.opener && window.opener !== window) {
          console.log('📤 OAuth Callback: Sending success message to opener');
          window.opener.postMessage({ type: 'META_AUTH_SUCCESS' }, window.location.origin);
          window.close();
          return;
        }
        toast.success('Your account is now linked.', 'Meta connected');
        navigate('/rules');
      } catch (e: unknown) {
        const error = e as Error;
        const msg = error?.message || 'Connection failed';
        console.error('❌ OAuth Callback: Error in OAuth flow:', { error: msg, fullError: error });
        
        // Special handling for "already used" codes - treat as success
        const codeUsed = /already been used/i.test(msg) || 
                        /authorization code has been used/i.test(msg) ||
                        /already processed/i.test(msg);
        
        console.log('🔍 OAuth Callback: Code analysis', { codeUsed, msg });
        
        if (codeUsed) {
          // Code was already used, but this means auth was successful previously
          console.log('✅ OAuth Callback: Treating as success due to code reuse');
          if (window.opener && window.opener !== window) {
            console.log('📤 OAuth Callback: Sending success message to opener (code reused)');
            window.opener.postMessage({ type: 'META_AUTH_SUCCESS', message: 'Authorization already completed' }, window.location.origin);
            window.close();
            return;
          }
          toast.info('Your Meta account appears already connected.');
          navigate('/rules');
          return;
        }
        
        // Real error occurred
        setError(msg);
        try {
          if (window.opener && window.opener !== window) {
            console.log('📤 OAuth Callback: Sending error message to opener');
            window.opener.postMessage({ type: 'META_AUTH_ERROR', message: msg }, window.location.origin);
            window.close();
            return;
          }
        } catch {
          // Ignore postMessage errors
        }
        toast.error(msg || 'Please try again.', 'Meta connection failed');
      }
    })();
  }, [code, state, navigate]);

  return (
    <AppLayout>
      <div className="grid min-h-[60vh] place-items-center p-6">
        <Card className="w-full max-w-md text-center">
          {!error ? (
            <div className="flex flex-col items-center gap-4">
              <Spinner size={28} />
              <div className="text-lg font-semibold">Connecting your Meta account…</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Please wait while we finish authentication.</p>
            </div>
          ) : (
            <div>
              <div className="text-lg font-semibold">Something went wrong</div>
              <p className="mt-2 text-sm text-red-600">{error}</p>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}

