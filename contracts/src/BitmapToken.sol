// SPDX-License-Identifier: MIT
pragma solidity 0.7.1;
pragma experimental ABIEncoderV2;

// solhint-disable quotes

import "./ERC721Base.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Metadata.sol";
import "@openzeppelin/contracts/cryptography/ECDSA.sol";
import "hardhat-deploy/solc_0.7/proxy/Proxied.sol";
// import "hardhat/console.sol";

contract BitmapToken is ERC721Base, IERC721Metadata, Proxied {
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableMap for EnumerableMap.UintToUintMap;
    using ECDSA for bytes32;

    event Minted(uint256 indexed id, uint256 indexed pricePaid);
    event Burned(uint256 indexed id, uint256 indexed priceReceived);
    event CreatorshipTransferred(address indexed previousCreator, address indexed newCreator);

    uint256 public immutable initialPrice;
    uint256 public immutable creatorCutPer10000th;
    address payable public creator;

    constructor(address payable _creator, uint256 _initialPrice, uint256 _creatorCutPer10000th) {
        initialPrice = _initialPrice;
        creatorCutPer10000th = _creatorCutPer10000th;
        postUpgrade(_creator, _initialPrice, _creatorCutPer10000th);
    }

    // solhint-disable-next-line no-unused-vars
    function postUpgrade(address payable _creator, uint256 _initialPrice, uint256 _creatorCutPer10000th) public proxied {
        // immutables are set in the constructor:
        // initialPrice = _initialPrice;
        // creatorCutPer10000th = _creatorCutPer10000th;
        creator = _creator;
        emit CreatorshipTransferred(address(0), creator);
    }


    function transferCreatorship(address payable newCreatorAddress) external {
        address oldCreator = creator;
        require(oldCreator == msg.sender, "NOT_AUTHORIZED");
        creator = newCreatorAddress;
        emit CreatorshipTransferred(oldCreator, newCreatorAddress);
    }

    /// @notice A descriptive name for a collection of NFTs in this contract
    function name() external pure override returns (string memory) {
        return "Bitmap Art Token";
    }

    /// @notice An abbreviated name for NFTs in this contract
    function symbol() external pure override returns (string memory) {
        return "BITMAP";
    }

    function tokenURI(uint256 id) public view virtual override returns (string memory) {
        address owner = _ownerOf(id);
        require(owner != address(0), "NOT_EXISTS");
        return _tokenURI(id);
    }

    /// @notice Check if the contract supports an interface.
    /// 0x01ffc9a7 is ERC165.
    /// 0x80ac58cd is ERC721
    /// 0x5b5e139f is for ERC721 metadata
    /// 0x780e9d63 is for ERC721 enumerable
    /// @param id The id of the interface.
    /// @return Whether the interface is supported.
    function supportsInterface(bytes4 id) public pure virtual override(ERC721Base, IERC165) returns (bool) {
        ERC721Base.supportsInterface(id) || id == 0x5b5e139f;
    }

    struct TokenData {
        uint256 id;
        string tokenURI;
    }

    struct TokenDataMintedOrNot {
        uint256 id;
        string tokenURI;
        bool minted;
    }

    struct MintData {
        uint256 currentPrice;
        uint256 supply;
        TokenDataMintedOrNot[] tokens;
    }

    function getTokenDataOfOwner(
        address owner,
        uint256 start,
        uint256 num
    ) external view returns (TokenData[] memory tokens) {
        EnumerableSet.UintSet storage allTokens = _holderTokens[owner];
        uint256 balance = allTokens.length();
        require(balance >= start + num, "TOO_MANY_TOKEN_REQUESTED");
        tokens = new TokenData[](num);
        uint256 i = 0;
        while (i < num) {
            uint256 id = allTokens.at(start + i);
            tokens[i] = TokenData(id, _tokenURI(id));
            i++;
        }
    }

    function getMintData(uint256[] calldata ids) external view returns (MintData memory data) {
        data.supply = totalSupply();
        data.currentPrice = _curve(data.supply);
        data.tokens = _getTokenDataForIds(ids);
    }

    function getTokenDataForIds(uint256[] calldata ids) external view returns (TokenDataMintedOrNot[] memory tokens) {
        return _getTokenDataForIds(ids);
    }

    function mint(address to, bytes memory signature) external payable returns (uint256) {
        uint256 supply = totalSupply();
        uint256 mintPrice = _curve(supply);
        require(msg.value >= mintPrice, "NOT_ENOUGH_ETH");


        // -------------------------- MINTING ---------------------------------------------------------
        bytes32 hashedData = keccak256(abi.encodePacked("Bitmap", to));
        address signer = hashedData.toEthSignedMessageHash().recover(signature);
        _mint(uint256(signer), to);
        // -------------------------- MINTING ---------------------------------------------------------

        uint256 forCreator = mintPrice - _forReserve(mintPrice);

        // responsibility of the creator to ensure it can receive the fund
        bool success = true;
        if (forCreator > 0) {
            // solhint-disable-next-line check-send-result
            success = creator.send(forCreator);
        }

        if(!success || msg.value > mintPrice) {
            msg.sender.transfer(msg.value - mintPrice + (!success ? forCreator : 0));
        }

        emit Minted(uint256(signer), mintPrice);
        return uint256(signer);
    }


    function burn(uint256 id) external {
        uint256 supply = totalSupply();
        uint256 burnPrice = _forReserve(_curve(supply));

        _burn(id);

        msg.sender.transfer(burnPrice);
        emit Burned(id, burnPrice);
    }

    function currentPrice() external view returns (uint256) {
        return _curve(totalSupply());
    }

    function _curve(uint256 supply) internal view returns (uint256) {
        return initialPrice + supply * 0.001 ether;
    }

    function _forReserve(uint256 mintPrice) internal view returns (uint256) {
        return mintPrice * creatorCutPer10000th / 10000;
    }

    function _getTokenDataForIds(uint256[] memory ids) internal view returns (TokenDataMintedOrNot[] memory tokens) {
        tokens = new TokenDataMintedOrNot[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            uint256 data = _tokenOwners.getOrZero(id);
            tokens[i] = TokenDataMintedOrNot(id, _tokenURI(id), data != 0);
        }
    }

    function _tokenURI(uint256 id) internal pure returns (string memory) {
        bytes memory base64Bytes = new bytes((8 * 8) * 4);

        bytes32 random = keccak256(abi.encodePacked(id));

        for (uint256 y = 0; y < 8; y++) {
            uint24 p0 = uint24(((uint256(random) >> (255- y*4 + 0)) % 2) == 1 ? 0xFFFFFF : 0);
            uint24 p1 = uint24(((uint256(random) >> (255- y*4 + 1)) % 2) == 1 ? 0xFFFFFF : 0);
            uint24 p2 = uint24(((uint256(random) >> (255- y*4 + 2)) % 2) == 1 ? 0xFFFFFF : 0);
            uint24 p3 = uint24(((uint256(random) >> (255- y*4 + 3)) % 2) == 1 ? 0xFFFFFF : 0);

            uint256 i = (7-y) * 8; //reverse y
            setColor(base64Bytes, i + 0, p0);
            setColor(base64Bytes, i + 1, p1);
            setColor(base64Bytes, i + 2, p2);
            setColor(base64Bytes, i + 3, p3);
            setColor(base64Bytes, i + 4, p3);
            setColor(base64Bytes, i + 5, p2);
            setColor(base64Bytes, i + 6, p1);
            setColor(base64Bytes, i + 7, p0);
        }

        string memory idStr = uint2str(id);
        return
            string(
                abi.encodePacked(
                    'data:text/plain,{"name":"bitmap token',
                    idStr,
                    '","description":"bitmap token generated from ',
                    idStr,
                    '","image":"data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' shape-rendering=\'crispEdges\' width=\'512\' height=\'512\'><g transform=\'scale(64)\'><image width=\'8\' height=\'8\' style=\'image-rendering: pixelated;\' href=\'data:image/bmp;base64,Qk02wAAAAAAAADYAAAAoAAAACAAAAAgAAAABABgAAAAAAADAAAAAAAAAAAAAAAAAAAAAAAAA', //bmp_header, then 8bit per color 8x8
                    base64Bytes,
                    '\'/></g></svg>"}'
                )
            );
    }

    bytes32 constant internal base64Alphabet_1 = 0x4142434445464748494A4B4C4D4E4F505152535455565758595A616263646566;
    bytes32 constant internal base64Alphabet_2 = 0x6768696A6B6C6D6E6F707172737475767778797A303132333435363738392B2F;

    // bytes constant internal bmp_header =
        // "0x424D36C000000000000036000000280000000800000008000000010018000000000000C0000000000000000000000000000000000000"; // then 8bit per color 8x8


    function setColor(
        bytes memory base64Bytes,
        uint256 i,
        uint24 c
    ) internal pure {
        base64Bytes[i * 4 + 0] = uint8ToBase64(c / 2**18);
        base64Bytes[i * 4 + 1] = uint8ToBase64((c / 2**12) % 64);
        base64Bytes[i * 4 + 2] = uint8ToBase64((c / 2**6) % 64);
        base64Bytes[i * 4 + 3] = uint8ToBase64(c % 64);
    }

    function uint2str(uint256 num)
        private
        pure
        returns (string memory _uintAsString)
    {
        if (num == 0) {
            return "0";
        }

        uint256 j = num;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }

        bytes memory bstr = new bytes(len);
        uint256 k = len - 1;
        while (num != 0) {
            bstr[k--] = bytes1(uint8(48 + (num % 10)));
            num /= 10;
        }

        return string(bstr);
    }

    function uint8ToBase64(uint24 v) internal pure returns (bytes1 s) {
        if (v >= 32) {
            return base64Alphabet_2[v - 32];
        }
        return base64Alphabet_1[v];
    }

}
