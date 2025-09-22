import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export const Layout = () => {
  return (
    <>
      <Header />
      <main className="container mx-auto mt-4 p-4">
        <Outlet />
      </main>
    </>
  );
};