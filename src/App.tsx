// import { useState } from 'react'
import './App.css'
import AuctionList from './components/AuctionList'
import {Header} from './components/Header'

function App() {
  return (
    <>
      <div>
        <Header onSignInClick={function (): void {
          throw new Error('Function not implemented.')
        } } onSignOut={function (): void {
          throw new Error('Function not implemented.')
        } } />
      </div>
      <AuctionList />
    </>
  )
}

export default App
