import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import AdAccountSelect from './pages/Onboarding/AdAccountSelect'
import MetaCallback from './pages/OAuth/MetaCallback'
import RulesList from './pages/Rules/RulesList'
import RuleDetail from './pages/Rules/RuleDetail'
import CreateRuleStep1 from './pages/Rules/CreateRuleStep1'
import CreateRuleStep5Conditions from './pages/Rules/CreateRuleStep5Conditions'
import CreateRuleStep6Review from './pages/Rules/CreateRuleStep6Review'
import CreateRuleStep2Type from './pages/Rules/CreateRuleStep2Type'
import CreateRuleStep3AdSets from './pages/Rules/CreateRuleStep3AdSets'
import CreateRuleStep4Weather from './pages/Rules/CreateRuleStep4Weather'
import Toaster from './components/ui/Toaster'
import RequireAuth from './components/Auth/RequireAuth'
import Dashboard from './pages/Dashboard/index'
import CampaignsRouter from './pages/Campaigns/index'
import Reports from './pages/Reports/index'
import ErrorBoundary from './components/ErrorBoundary'
import RouteErrorElement from './components/RouteErrorElement'
import { ThemeProvider } from './contexts/ThemeContext'

const router = createBrowserRouter([
  { 
    path: '/', 
    element: <App />,
    errorElement: <RouteErrorElement />
  },
  { 
    path: '/onboarding/connect-ads', 
    element: <RequireAuth><AdAccountSelect /></RequireAuth>,
    errorElement: <RouteErrorElement />
  },
  // Do not require auth in popup callback to prevent redirect loops
  { 
    path: '/oauth/meta/callback', 
    element: <MetaCallback />,
    errorElement: <RouteErrorElement />
  },
  { 
    path: '/rules', 
    element: <RequireAuth><RulesList /></RequireAuth>,
    errorElement: <RouteErrorElement />
  },
  {
    path: '/rules/:id',
    element: <RequireAuth><RuleDetail /></RequireAuth>,
    errorElement: <RouteErrorElement />
  },
  {
    path: '/rules/new',
    element: <RequireAuth><CreateRuleStep1 /></RequireAuth>,
    errorElement: <RouteErrorElement />
  },
  {
    path: '/rules/new/conditions',
    element: <RequireAuth><CreateRuleStep5Conditions /></RequireAuth>,
    errorElement: <RouteErrorElement />
  },
  {
    path: '/rules/new/review',
    element: <RequireAuth><CreateRuleStep6Review /></RequireAuth>,
    errorElement: <RouteErrorElement />
  },
  {
    path: '/rules/new/type',
    element: <RequireAuth><CreateRuleStep2Type /></RequireAuth>,
    errorElement: <RouteErrorElement />
  },
  {
    path: '/rules/new/select-adsets',
    element: <RequireAuth><CreateRuleStep3AdSets /></RequireAuth>,
    errorElement: <RouteErrorElement />
  },
  {
    path: '/rules/new/weather',
    element: <RequireAuth><CreateRuleStep4Weather /></RequireAuth>,
    errorElement: <RouteErrorElement />
  },
  { 
    path: '/dashboard', 
    element: <RequireAuth><Dashboard /></RequireAuth>,
    errorElement: <RouteErrorElement />
  },
  {
    path: '/campaigns/:platform',
    element: <RequireAuth><CampaignsRouter /></RequireAuth>,
    errorElement: <RouteErrorElement />
  },
  {
    path: '/campaigns',
    element: <RequireAuth><CampaignsRouter /></RequireAuth>,
    errorElement: <RouteErrorElement />
  },
  {
    path: '/reports',
    element: <RequireAuth><Reports /></RequireAuth>,
    errorElement: <RouteErrorElement />
  }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ErrorBoundary>
        <RouterProvider router={router} />
        <Toaster />
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
)
