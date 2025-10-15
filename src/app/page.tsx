import { FloodWatchDashboard } from '@/components/flood-watch-dashboard';
import { Header } from '@/components/header';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <FloodWatchDashboard />
    </div>
  );
}
