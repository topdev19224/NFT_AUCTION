import { useEffect } from 'react'
import { useGlobalState } from '../store'
import Artworks from '../components/Artworks'
import { loadClaimables } from '../services/blockchain'

const Claimables = () => {
  const [claimables] = useGlobalState('claimables')
  useEffect(async () => {
    await loadClaimables()
  })

  return (
    <div>
      <Artworks title="Claimable Collections" auctions={claimables} />
    </div>
  )
}

export default Claimables
