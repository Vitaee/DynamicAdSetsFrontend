import { useLocation, Link } from 'react-router-dom';
import Breadcrumbs from './Breadcrumbs';
import Subnav from './Subnav';
import Button from '../ui/Button';
import { useNav } from '../../stores/nav';

// Enhanced route mapping with more granular page detection
const getBreadcrumbsForPath = (path: string) => {
  const segments = path.split('/').filter(Boolean);
  
  // Handle specific route patterns
  if (path === '/dashboard') {
    return [{ label: 'Dashboard' }];
  }
  
  if (path === '/rules') {
    return [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Automation Rules' }
    ];
  }
  
  if (path.startsWith('/rules/') && segments.length >= 2) {
    const ruleId = segments[1];
    if (ruleId === 'new') {
      return [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Automation Rules', href: '/rules' },
        { label: 'Create Rule' }
      ];
    } else {
      // Rule detail page
      return [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Automation Rules', href: '/rules' },
        { label: 'Rule Details' }
      ];
    }
  }
  
  if (path.startsWith('/campaigns')) {
    const platform = segments[1]; // meta, google, etc.
    const baseCrumbs = [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Campaigns', href: '/campaigns/meta' }
    ];
    
    if (platform === 'meta') {
      return [...baseCrumbs, { label: 'Meta Ads' }];
    } else if (platform === 'google') {
      return [...baseCrumbs, { label: 'Google Ads' }];
    }
    return baseCrumbs;
  }
  
  if (path === '/reports') {
    return [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Reports & Analytics' }
    ];
  }
  
  if (path.startsWith('/onboarding')) {
    return [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Setup', href: '/onboarding/connect-ads' },
      { label: 'Connect Ads' }
    ];
  }
  
  // Fallback for unknown routes
  return [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Page' }
  ];
};

export default function AppHeader() {
  const { pathname } = useLocation();
  const customBreadcrumbs = useNav((s) => s.breadcrumbs);
  
  // Use custom breadcrumbs if available, otherwise generate from path
  const breadcrumbItems = customBreadcrumbs || getBreadcrumbsForPath(pathname);
  
  const items = [
    { key: 'dashboard', label: 'Dashboard', to: '/dashboard' },
    { key: 'automations', label: 'Automations', to: '/rules' },
    { key: 'campaigns', label: 'Campaigns', to: '/campaigns/meta' },
    { key: 'reports', label: 'Reports', to: '/reports' },
  ];

  return (
    <div className="container-narrow space-y-4 py-4">
      <Breadcrumbs items={breadcrumbItems} />
      <Subnav
        items={items}
        cta={
          <Link to="/rules">
            <Button className="inline-flex items-center gap-2">
              <span className="text-lg leading-none">＋</span>
              CREATE AUTOMATIONS
            </Button>
          </Link>
        }
      />
    </div>
  );
}
