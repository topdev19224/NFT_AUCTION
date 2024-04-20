import Nft from './views/Nft'
import Home from './views/Home'
import Header from './components/Header'
import { useEffect, useState } from 'react'
import PlaceBid from './components/PlaceBid'
import Collections from './views/Collections'
import MyCollections from './views/MyCollections'
import Claimables from './views/Claimables'
import { ToastContainer } from 'react-toastify'
import { Route, Routes } from 'react-router-dom'
import { isWallectConnected, loadAuctions } from './services/blockchain'
import { setGlobalState, useGlobalState } from './store'
import OfferItem from './components/OfferItem'
import ChangePrice from './components/ChangePrice'

function App() {
  const [loaded, setLoaded] = useState(false)
  const [auction] = useGlobalState('auction')

  useEffect(async () => {
    await isWallectConnected()
    await loadAuctions().finally(() => setLoaded(true))
    console.log('Blockchain Loaded')
  }, [])

  return (
    <div
      className="min-h-screen bg-gradient-to-t from-gray-800 bg-repeat
      via-[#25bd9c] to-gray-900 bg-center subpixel-antialiased"
    >
      <Header />
      {loaded ? (
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/mycollections" element={<MyCollections />} />
          <Route path="/claimables" element={<Claimables />} />
          <Route path="/nft/:id" element={<Nft />} />
        </Routes>
      ) : null}
      {auction ? (
        <>
          <PlaceBid />
          <OfferItem />
          <ChangePrice />
        </>
      ) : null}
      <ToastContainer
        position="bottom-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  )
}
export default App
