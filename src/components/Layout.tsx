import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export const Layout = () => {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#0d0d1a]">
        <Outlet />
      </main>
    </>
  );
};