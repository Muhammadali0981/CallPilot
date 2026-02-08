import { useAppStore } from '@/lib/store';
import { AppLayout } from '@/components/AppLayout';
import DashboardPage from '@/pages/DashboardPage';
import NewRequestPage from '@/pages/NewRequestPage';
import MissionControlPage from '@/pages/MissionControlPage';
import ResultsPage from '@/pages/ResultsPage';

const Index = () => {
  const { currentPage } = useAppStore();

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />;
      case 'new-request': return <NewRequestPage />;
      case 'mission-control': return <MissionControlPage />;
      case 'results': return <ResultsPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <AppLayout>
      {renderPage()}
    </AppLayout>
  );
};

export default Index;
