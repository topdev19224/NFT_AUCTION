//SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Auction is ERC721, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private totalItems;

    address companyAcc;
    uint listingPrice = 0.0002 ether;
    uint royalityFee;
    mapping(uint => AuctionStruct) auctionedItem;
    mapping(uint => bool) auctionedItemExist;
    mapping(uint => BidderStruct[]) biddersOf;

    constructor(uint _royaltyFee) ERC721("Auction Tokens", "AT") {
        companyAcc = msg.sender;
        royalityFee = _royaltyFee;
    }

    //Structure for storing NFT and auctions
    struct AuctionStruct {
        string name;
        string description;
        string image;
        uint tokenId;
        address seller;
        address owner;
        address winner;
        uint price;
        bool sold;
        bool live;
        bool biddable;
        uint bids;
        uint duration;
    }

    //Structure for storing bidders of auctions
    struct BidderStruct {
        address bidder;
        uint price;
        uint timestamp;
        bool refunded;
        bool won;
    }

    //Emmited when one auction item is created
    event AuctionItemCreated(
        uint indexed tokenId,
        address seller,
        address owner,
        uint price,
        bool sold
    );

    //Enquires minimum price for minting & listing NFTs
    function getListingPrice() public view returns (uint) {
        return listingPrice;
    }

    ////Sets minimum price to mint & list NFTs
    function setListingPrice(uint _price) public {
        require(msg.sender == companyAcc, "Unauthorized entity");
        listingPrice = _price;
    }

    //Changes the default minimum price to buy an NFT
    //Only the owner of NFT can change the price
    //Cannot be changed while auction period
    function changePrice(uint tokenId, uint price) public {
        require(
            auctionedItem[tokenId].owner == msg.sender,
            "Unauthorized entity"
        );
        require(
            getTimestamp(0, 0, 0, 0) > auctionedItem[tokenId].duration,
            "Auction still Live"
        );
        require(price > 0 ether, "Price must be greater than zero");

        auctionedItem[tokenId].price = price;
    }

    //Typical mint function for ERC-721 NFT
    function mintToken() internal returns (bool) {
        totalItems.increment();
        uint tokenId = totalItems.current();

        _mint(msg.sender, tokenId);

        return true;
    }

    //Creates an NFT, register it to the Auction storage and pay the listing price to the administrator
    function createAuction(
        string memory name,
        string memory description,
        string memory image,
        uint price
    ) public payable nonReentrant {
        require(price > 0 ether, "Sales price must be greater than 0 ethers.");
        require(
            msg.value >= listingPrice,
            "Price must be up to the listing price."
        );
        require(mintToken(), "Could not mint token");

        uint tokenId = totalItems.current();

        AuctionStruct memory item;
        item.tokenId = tokenId;
        item.name = name;
        item.description = description;
        item.image = image;
        item.price = price;
        item.duration = getTimestamp(0, 0, 0, 0);
        item.seller = msg.sender;
        item.owner = msg.sender;

        auctionedItem[tokenId] = item;
        auctionedItemExist[tokenId] = true;

        payTo(companyAcc, listingPrice);

        emit AuctionItemCreated(tokenId, msg.sender, address(0), price, false);
    }

    //Make NFT live onto the auction marketplace
    function offerAuction(
        uint tokenId,
        bool biddable,
        uint sec,
        uint min,
        uint hour,
        uint day
    ) public {
        require(
            auctionedItem[tokenId].owner == msg.sender,
            "Unauthorized entity"
        );
        require(
            auctionedItem[tokenId].bids == 0,
            "Winner should claim prize first"
        );

        if (!auctionedItem[tokenId].live) {
            setApprovalForAll(address(this), true);
            IERC721(address(this)).transferFrom(
                msg.sender,
                address(this),
                tokenId
            );
        }

        auctionedItem[tokenId].bids = 0;
        auctionedItem[tokenId].live = true;
        auctionedItem[tokenId].sold = false;
        auctionedItem[tokenId].biddable = biddable;
        auctionedItem[tokenId].duration = getTimestamp(sec, min, hour, day);
    }

    //Places a bid to an NFT in auction
    function placeBid(uint tokenId) public payable {
        require(
            msg.value >= auctionedItem[tokenId].price,
            "Insufficient Amount"
        );
        require(
            auctionedItem[tokenId].duration > getTimestamp(0, 0, 0, 0),
            "Auction not available"
        );
        require(auctionedItem[tokenId].biddable, "Auction only for bidding");

        BidderStruct memory bidder;
        bidder.bidder = msg.sender;
        bidder.price = msg.value;
        bidder.timestamp = getTimestamp(0, 0, 0, 0);

        biddersOf[tokenId].push(bidder);
        auctionedItem[tokenId].bids++;
        auctionedItem[tokenId].price = msg.value;
        auctionedItem[tokenId].winner = msg.sender;
    }

    //Auction Winners can claim prizes after the auction
    //Pays royality fee to the original minter
    function claimPrize(uint tokenId, uint bid) public {
        require(
            getTimestamp(0, 0, 0, 0) > auctionedItem[tokenId].duration,
            "Auction still Live"
        );
        require(
            auctionedItem[tokenId].winner == msg.sender,
            "You are not the winner"
        );

        biddersOf[tokenId][bid].won = true;
        uint price = auctionedItem[tokenId].price;
        address seller = auctionedItem[tokenId].seller;

        auctionedItem[tokenId].winner = address(0);
        auctionedItem[tokenId].live = false;
        auctionedItem[tokenId].sold = true;
        auctionedItem[tokenId].bids = 0;
        auctionedItem[tokenId].duration = getTimestamp(0, 0, 0, 0);

        uint royality = (price * royalityFee) / 100;
        payTo(auctionedItem[tokenId].owner, (price - royality));
        payTo(seller, royality);
        IERC721(address(this)).transferFrom(address(this), msg.sender, tokenId);
        auctionedItem[tokenId].owner = msg.sender;

        performRefund(tokenId);
    }

    //Refunds all funds staked into the platform to the lost bidders
    function performRefund(uint tokenId) internal {
        for (uint i = 0; i < biddersOf[tokenId].length; i++) {
            if (biddersOf[tokenId][i].bidder != msg.sender) {
                biddersOf[tokenId][i].refunded = true;
                payTo(
                    biddersOf[tokenId][i].bidder,
                    biddersOf[tokenId][i].price
                );
            } else {
                biddersOf[tokenId][i].won = true;
            }
            biddersOf[tokenId][i].timestamp = getTimestamp(0, 0, 0, 0);
        }

        delete biddersOf[tokenId];
    }

    //Directly buys auction item from the owner
    function buyAuctionedItem(uint tokenId) public payable nonReentrant {
        require(
            msg.value >= auctionedItem[tokenId].price,
            "Insufficient Amount"
        );
        require(
            auctionedItem[tokenId].duration > getTimestamp(0, 0, 0, 0),
            "Auction not available"
        );
        require(!auctionedItem[tokenId].biddable, "Auction only for purchase");

        address seller = auctionedItem[tokenId].seller;
        auctionedItem[tokenId].live = false;
        auctionedItem[tokenId].sold = true;
        auctionedItem[tokenId].bids = 0;
        auctionedItem[tokenId].duration = getTimestamp(0, 0, 0, 0);

        uint royality = (msg.value * royalityFee) / 100;
        payTo(auctionedItem[tokenId].owner, (msg.value - royality));
        payTo(seller, royality);
        IERC721(address(this)).transferFrom(
            address(this),
            msg.sender,
            auctionedItem[tokenId].tokenId
        );

        auctionedItem[tokenId].owner = msg.sender;
    }

    //Retrieves specific auction with id
    function getAuction(uint id) public view returns (AuctionStruct memory) {
        require(auctionedItemExist[id], "Auctioned Item not found");
        return auctionedItem[id];
    }

    //Retrieves all NFTs one owns
    function getMyAuctions()
        public
        view
        returns (AuctionStruct[] memory Auctions)
    {
        uint totalItemsCount = totalItems.current();
        uint totalSpace;
        for (uint i = 0; i < totalItemsCount; i++) {
            if (auctionedItem[i + 1].owner == msg.sender) {
                totalSpace++;
            }
        }

        Auctions = new AuctionStruct[](totalSpace);

        uint index;
        for (uint i = 0; i < totalItemsCount; i++) {
            if (auctionedItem[i + 1].owner == msg.sender) {
                Auctions[index] = auctionedItem[i + 1];
                index++;
            }
        }
    }

    //Retrieves all auctions available in the market
    function getLiveAuctions()
        public
        view
        returns (AuctionStruct[] memory Auctions)
    {
        uint totalItemsCount = totalItems.current();
        uint totalSpace;
        for (uint i = 0; i < totalItemsCount; i++) {
            if (auctionedItem[i + 1].duration > getTimestamp(0, 0, 0, 0)) {
                totalSpace++;
            }
        }

        Auctions = new AuctionStruct[](totalSpace);

        uint index;
        for (uint i = 0; i < totalItemsCount; i++) {
            if (auctionedItem[i + 1].duration > getTimestamp(0, 0, 0, 0)) {
                Auctions[index] = auctionedItem[i + 1];
                index++;
            }
        }
    }

    //Retrieves all claimable auctions available in the market
    function getClaimableAuctions()
        public
        view
        returns (AuctionStruct[] memory Auctions)
    {
        uint totalItemsCount = totalItems.current();
        uint totalSpace;
        for (uint i = 0; i < totalItemsCount; i++) {
            if (auctionedItem[i + 1].duration <= getTimestamp(0, 0, 0, 0) && auctionedItem[i + 1].winner == msg.sender) {
                totalSpace++;
            }
        }

        Auctions = new AuctionStruct[](totalSpace);

        uint index;
        for (uint i = 0; i < totalItemsCount; i++) {
            if (auctionedItem[i + 1].duration <= getTimestamp(0, 0, 0, 0) && auctionedItem[i + 1].winner == msg.sender) {
                Auctions[index] = auctionedItem[i + 1];
                index++;
            }
        }
    }

    //Gets list of bidders of one auction
    function getBidders(
        uint tokenId
    ) public view returns (BidderStruct[] memory) {
        return biddersOf[tokenId];
    }

    function getTimestamp(
        uint sec,
        uint min,
        uint hour,
        uint day
    ) internal view returns (uint) {
        return
            block.timestamp +
            (1 seconds * sec) +
            (1 minutes * min) +
            (1 hours * hour) +
            (1 days * day);
    }

    function payTo(address to, uint amount) internal {
        (bool success, ) = payable(to).call{value: amount}("");
        require(success);
    }
}
