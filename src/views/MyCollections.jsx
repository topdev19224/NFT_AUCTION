import { useEffect } from 'react'
import Empty from '../components/Empty'
import CreateNFT from '../components/CreateNFT'
import { useGlobalState } from '../store'
import Artworks from '../components/Artworks'
import { loadCollections } from '../services/blockchain'

const MyCollections = () => {
  const [collections] = useGlobalState('collections')
  useEffect(async () => {
    await loadCollections()
  })

  return (
    <div>
      <Artworks title="Your Collections" auctions={collections} showOffer />
      <CreateNFT />
    </div>
  )
}

export default MyCollections
