import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import Header from './components/shared/Header';
import FanHome from './components/fan/FanHome';
import DashboardHome from './components/dashboard/DashboardHome';

function NavTabs() {
  const location = useLocation();
  const isFan = location.pathname.startsWith('/fan');
  
  return (
    <div className="flex justify-center p-4 border-b border-white/5 bg-navy-900/50 backdrop-blur-md sticky top-[61px] z-40">
      <div className="bg-navy-800 rounded-lg p-1 flex gap-1">
        <Link
          to="/fan"
          className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
            isFan ? 'bg-accent-blue text-white shadow-lg' : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          Fan App (PWA)
        </Link>
        <Link
          to="/dashboard"
          className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
            !isFan ? 'bg-accent-blue text-white shadow-lg' : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          Organizer Dashboard
        </Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <AccessibilityProvider>
      <LanguageProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col relative">
            {/* Background patterns */}
            <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent-blue/10 via-navy-900 to-navy-900" />
              <div className="absolute top-0 w-full h-[500px] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDIiLz4KPC9zdmc+')] opacity-20 mask-image:linear-gradient(to_bottom,white,transparent)" />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
              <Header />
              <NavTabs />
              
              <main className="flex-1">
                <Routes>
                  <Route path="/fan" element={<FanHome />} />
                  <Route path="/dashboard" element={<DashboardHome />} />
                  <Route path="/" element={<Navigate to="/fan" replace />} />
                </Routes>
              </main>
            </div>
          </div>
        </BrowserRouter>
      </LanguageProvider>
    </AccessibilityProvider>
  );
}

export default App;
