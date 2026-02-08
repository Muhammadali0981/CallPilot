import { useAppStore } from '@/lib/store';
import { AppLayout } from '@/components/AppLayout';
import DashboardPage from '@/pages/DashboardPage';
import NewRequestPage from '@/pages/NewRequestPage';
import MissionControlPage from '@/pages/MissionControlPage';
import ResultsPage from '@/pages/ResultsPage';

const Index = () => {
  const { currentPage } = useAppStore();

  return (
    <AppLayout>
      {currentPage === 'dashboard' && <DashboardPage />}
      {currentPage === 'new-request' && <NewRequestPage />}
      {currentPage === 'mission-control' && <MissionControlPage />}
      {currentPage === 'results' && <ResultsPage />}
    </AppLayout>
  );
};

export default Index;
