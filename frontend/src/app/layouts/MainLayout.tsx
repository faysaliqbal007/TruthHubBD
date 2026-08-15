import { Outlet } from 'react-router-dom';
import { Navbar } from '../../components/shared/Navbar';
import { Footer } from '../../components/shared/Footer';

export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,_#eef6ff_0%,_#f8fafc_45%,_#f1f5f9_100%)]">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
