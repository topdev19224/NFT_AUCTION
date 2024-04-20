import { useEffect } from 'react'
import { toast } from 'react-toastify'
import Identicons from 'react-identicons'
import { useNavigate, useParams } from 'react-router-dom'
import Countdown from '../components/Countdown'
import { setGlobalState, truncate, useGlobalState } from '../store'
import {
  buyNFTItem,
  claimPrize,
  getBidders,
  loadAuction,
} from '../services/blockchain'

const Nft = () => {
  const { id } = useParams()
  const [bidders] = useGlobalState('bidders')
  const [auction] = useGlobalState('auction')
  const [connectedAccount] = useGlobalState('connectedAccount')

  useEffect(async () => {
    await loadAuction(id)
    await getBidders(id)
  }, [])

  return (
    <>
      <div
        className="grid sm:flex-row md:flex-row lg:grid-cols-2 
        md:gap-4 lg:gap-3 py-2.5 text-white font-sans capitalize
        w-4/5 mx-auto mt-5 justify-between items-center"
      >
        <div
          className=" text-white h-[400px] bg-gray-800 rounded-md shadow-xl justify-center
        shadow-black md:w-4/5 md:items-center lg:w-4/5 md:mt-0"
        >
          <img
            src={auction?.image + "?pinataGatewayToken=" + process.env.REACT_APP_PINATA_GATEWAY_TOKEN} 
            alt={auction?.name}
            className="object-contain w-full h-80 mt-6"
          />
          <ActionButton auction={auction} account={connectedAccount} />
        </div>
        <div className="text-white h-[400px] rounded-md shadow-black md:w-4/5 lg:w-4/5 md:mt-0 flex flex-col pt-10">
          <Details auction={auction} account={connectedAccount} />
          
          <CountdownNPrice auction={auction} />

          {bidders.length > 0 ? (
            <Bidders bidders={bidders} auction={auction} />
          ) : null}
                   
        </div>
      </div>
    </>
  )
}

const Details = ({ auction, account }) => (
  <div className="py-2">
    <h1 className="font-bold text-lg mb-1">Name: {auction?.name}</h1>
    <p className="font-semibold text-lg">
      Owner: <span className="text-green-500">
        @
        {auction?.owner == account
          ? 'you'
          : auction?.owner
          ? truncate(auction?.owner, 4, 4, 11)
          : ''}
      </span>
    </p>
    <p className="font-bold text-lg py-2">Description: {auction?.description}</p>
  </div>
)

const Bidders = ({ bidders, auction }) => {
  const handlePrizeClaim = async (id) => {
    await toast.promise(
      new Promise(async (resolve, reject) => {
        await claimPrize({ tokenId: auction?.tokenId, id })
          .then(() => resolve())
          .catch(() => reject())
      }),
      {
        pending: 'Processing...',
        success: 'Price claim successful, will reflect within 30sec 👌',
        error: 'Encountered error 🤯',
      },
    )
  }

  return (
    <div className="flex flex-col">
      <span className="font-bold text-lg">Top Bidders</span>
      <div className="h-[calc(100vh_-_40.5rem)] overflow-y-auto">
        {bidders.map((bid, i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="flex justify-start items-center my-1 space-x-1">
              <Identicons
                className="h-5 w-5 object-contain bg-gray-800 rounded-full"
                size={18}
                string={bid.bidder}
              />
              <span className="font-medium text-lg mr-3">
                {truncate(bid.bidder, 4, 4, 11)},
              </span>
              <span className="text-green-200 font-medium text-lg">
                {bid.price} ETH
              </span>
            </div>

            {bid.bidder == auction?.winner &&
            !bid.won &&
            Date.now() > auction?.duration ? (
              <button
                type="button"
                className="shadow-sm shadow-black text-white
            bg-green-500 hover:bg-green-700 md:text-xs p-1
              rounded-sm text-sm cursor-pointer font-light"
                onClick={() => handlePrizeClaim(i)}
              >
                Claim Prize
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

const CountdownNPrice = ({ auction }) => {
  return (
    <div className="text-lg">
      <div>
        <span className="font-bold text-lg">Current Price: </span>
        <span className="text-lg font-light">{auction?.price}ETH</span>
      </div>

      {/* <div className='justify-center'> */}
        <Countdown timestamp={auction?.duration} />
      {/* </div> */}
    </div>
  )
}

const ActionButton = ({ auction, account }) => {

  const onPlaceBid = () => {
    setGlobalState('auction', auction)
    setGlobalState('bidBox', 'scale-100')
  }

  const handleNFTpurchase = async () => {
    await toast.promise(
      new Promise(async (resolve, reject) => {
        await buyNFTItem(auction)
          .then(() => resolve())
          .catch(() => reject())
      }),
      {
        pending: 'Processing...',
        success: 'Purchase successful, will reflect within 30sec 👌',
        error: 'Encountered error 🤯',
      },
    )
  }

  return auction?.owner == account ? (
    <div>
    </div>
  ) : (
    <div className="flex justify-center items-center space-x-2 w-full">
      {auction?.biddable && auction?.duration > Date.now() ? (
        <button
          type="button"
          className="shadow-sm shadow-black text-white
          bg-green-500 hover:bg-green-700 md:text-xs p-2.5 w-full
          rounded-sm cursor-pointer font-light mt-2"
          onClick={onPlaceBid}
        >
          Place a Bid
        </button>
      ) : null}

      {!auction?.biddable && auction?.duration > Date.now() ? (
        <button
          type="button"
          className="shadow-sm shadow-black text-white
          bg-red-500 hover:bg-red-700 md:text-xs p-2.5 w-full
          rounded-sm cursor-pointer font-light"
          onClick={handleNFTpurchase}
        >
          Buy NFT
        </button>
      ) : null}
    </div>
  )
}



export default Nft
