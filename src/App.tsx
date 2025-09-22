import { Routes, Route } from 'react-router-dom';
import './App.css'
import AuctionList from './components/AuctionList'
import { HowItWorks } from './components/HowItWorks';
import { Layout } from './components/Layout';
import { LoginForm } from './components/LoginForm';
import { SignUpForm } from './components/SignUpForm';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<AuctionList />} />
        <Route path="/auctions" element={<AuctionList />} />
        <Route path="/how_it_works" element={<HowItWorks />} />
      </Route>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/signup" element={<SignUpForm />} />
    </Routes>
  )
}

export default App
