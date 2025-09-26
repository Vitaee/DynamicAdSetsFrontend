import { useParams, Navigate } from 'react-router-dom';
import MetaCampaigns from './MetaCampaigns';
import GoogleCampaigns from './GoogleCampaigns';

export default function CampaignsRouter() {
  const { platform } = useParams();

  switch (platform) {
    case 'meta':
      return <MetaCampaigns />;
    case 'google':
      return <GoogleCampaigns />;
    default:
      // Default to Meta campaigns if no platform specified
      return <Navigate to="/campaigns/meta" replace />;
  }
}