import { useState } from 'react'
import './App.css'
import AuctionList from './components/AuctionList'
import {Header} from './components/Header'

function App() {
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);

  return (
    <>
      <Header onSignInClick={() => setLoginModalOpen(true)} />
      <AuctionList />
    </>
  )
}

export default App
