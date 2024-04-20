import { useEffect } from 'react'
import Empty from '../components/Empty'
import { useGlobalState } from '../store'
import Artworks from '../components/Artworks'
import { loadCollections } from '../services/blockchain'

const Collections = () => {
  const [auctions] = useGlobalState('auctions')
  useEffect(async () => {
    await loadCollections()
  })
  return (
    <div>
      {auctions.length > 0 ? (
        <Artworks title="NFTs for sale" auctions={auctions} />
      ) : (
        <Empty />
      )}
    </div>
  )
}

export default Collections
