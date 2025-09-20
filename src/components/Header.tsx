import logo from "../assets/xbid_logo.png";
// import type { User } from "../types";
// import { UserRole } from "../types";

interface HeaderProps {
  // user: User | null;
  onSignInClick: () => void;
  onSignOut: () => void;
}

const STRINGS = {
  GREETING: "Hello",
  LOG_OUT: "Log Out",
  SIGN_IN: "Sign In",
};

// export function Header({ user, onSignInClick, onSignOut }: HeaderProps) {
export function Header({onSignInClick, onSignOut }: HeaderProps) {
  // const isAdmin = user?.role === UserRole.Admin;
  console.log("Loading Header...")
  return (
    // <header className={`w-full border-2 border-black flex items-center justify-between ${isAdmin ? 'bg-red-500' : ''}`}>
    <header className={`w-full border-2 border-black flex items-center justify-between}`}>
      <div>
        <a href="/">
          <img src={logo} alt="X-Bid Logo" className="h-36" />
        </a>
      </div>
      <div className="flex items-center space-x-4 pr-4">
        {/* {user ? ( */}
          {/* <>
            <span className="text-black">{STRINGS.GREETING}, {user.email_address}!</span>
            <button onClick={onSignOut} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">{STRINGS.LOG_OUT}</button>
          </>
        ) : (
          <button onClick={onSignInClick} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">{STRINGS.SIGN_IN}</button>
        )} */}
      </div>
    </header>
  );
}
