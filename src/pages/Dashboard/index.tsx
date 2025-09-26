import { useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import StatCard from '../../components/dashboard/StatCard';
import AreaChartMock from '../../components/dashboard/AreaChartMock';
import { useNav } from '../../stores/nav';

export default function Dashboard() {
  const { setBreadcrumbs } = useNav();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Dashboard' }
    ]);
  }, [setBreadcrumbs]);

  return (
    <AppLayout>
      <div className="p-6">
        <div className="container-narrow space-y-6">

          <div className="grid gap-6 md:grid-cols-3">
            <StatCard title="Live Automation" value="20" subtitle="Number of automated workflows currently running across platforms." />
            <StatCard title="Live Campaigns" value="10" subtitle="Total active campaigns being executed on connected ad platforms." />
            <StatCard title="Action Completed" value="1,078" subtitle="Automated actions successfully performed in the selected time period." />
          </div>

          <AreaChartMock />
        </div>
      </div>
    </AppLayout>
  );
}
