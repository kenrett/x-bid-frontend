import { Outlet } from 'react-router-dom';
import { Header } from './Header/Header';
import { Footer } from './Footer/Footer';

export const Layout = () => {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#0d0d1a]">
        <Outlet />
      </main>
      <Footer />
    </>
  );
};