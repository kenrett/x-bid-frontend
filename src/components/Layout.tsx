import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export const Layout = () => {
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);

  // TODO: Implement Login Modal and pass props to it
  // const handleLoginSuccess = () => {
  //   setLoginModalOpen(false);
  // };

  return (
    <>
      <Header onSignInClick={() => setLoginModalOpen(true)} />
      {/* {isLoginModalOpen && <LoginModal onClose={() => setLoginModalOpen(false)} onLoginSuccess={handleLoginSuccess} />} */}
      <main className="container mx-auto mt-4 p-4">
        <Outlet />
      </main>
    </>
  );
};