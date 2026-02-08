import { useAppStore } from '@/lib/store';
import { AppLayout } from '@/components/AppLayout';
import DashboardPage from '@/pages/DashboardPage';
import NewRequestPage from '@/pages/NewRequestPage';
import MissionControlPage from '@/pages/MissionControlPage';
import ResultsPage from '@/pages/ResultsPage';
import { User } from '@supabase/supabase-js';

interface IndexProps {
  signOut: () => Promise<void>;
  user: User;
  providerToken: string | null;
  isGoogleUser: boolean;
}

const Index = ({ signOut, user, providerToken, isGoogleUser }: IndexProps) => {
  const { currentPage } = useAppStore();

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />;
      case 'new-request': return <NewRequestPage providerToken={providerToken} isGoogleUser={isGoogleUser} />;
      case 'mission-control': return <MissionControlPage />;
      case 'results': return <ResultsPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <AppLayout signOut={signOut} user={user}>
      {renderPage()}
    </AppLayout>
  );
};

export default Index;
