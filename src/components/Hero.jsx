import { toast } from 'react-toastify'
import { BsArrowRightShort } from 'react-icons/bs'
import picture0 from '../assets/images/picture0.png'
import { setGlobalState, useGlobalState } from '../store'
const Hero = () => {
  return (
    <div className="flex flex-col items-start w-3/5 md:flex-row mx-auto mt-11 justify-center ">
      <Banner/>
      <Bidder/>
    </div>
  )
}


const Banner = () => {
  return (
    <div
      className="flex flex-col md:flex-row w-full items-center mx-auto"
    >
      <div>
        <h1 className="text-white font-semibold text-7xl py-1">
          Discover <br/>Digital art &<br/>Collect NFTs
        </h1>
        <p className="text-white  font-light text-3xl py-5">
          NFT Auctioneer for fans <br/> More than 100+ NFT available for collect
        </p>        
        <div className="flex items-center justify-between w-3/4 mt-5">
          <div>
            <p className="text-white font-bold text-3xl">100k+</p>
            <p className="text-gray-300 text-2xl">Auction</p>
          </div>
          <div>
            <p className="text-white font-bold text-3xl">210k+</p>
            <p className="text-gray-300 text-2xl">Rare</p>
          </div>
          <div>
          <p className="text-white font-bold text-3xl ">120k+</p>
            <p className="text-gray-300 text-2xl">Artist</p>
          </div>
        </div>
      </div>
    </div>
  )
}


const Bidder = () => (
  <div
    className="w-full text-white overflow-hidden bg-gray-800 rounded-md shadow-xl 
    shadow-black md:w-3/5 lg:w-4/5 md:mt-0 font-sans"
  >
    <img src={picture0} alt="nft" className="object-cover w-full h-80" />
    <div
      className="shadow-lg shadow-gray-400 border-4 border-[#ffffff36] 
      flex flex-row justify-between items-center px-3"
    >
      <div className="p-2">
        Current Bid
        <div className="font-bold text-center">2.231 ETH</div>
      </div>
      <div className="p-2">
        Auction End
        <div className="font-bold text-center">20:10</div>
      </div>
    </div>
    <div
      className="bg-green-500 w-full h-[40px] p-2 text-center 
    font-bold font-mono "
    >
      Place a Bid
    </div>
  </div>
)

export default Hero
