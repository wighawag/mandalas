// SPDX-License-Identifier: MIT
pragma solidity 0.7.1;
pragma experimental ABIEncoderV2;

import "./ERC721Base.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Metadata.sol";

contract BitmapToken is ERC721Base, IERC721Metadata {
    using EnumerableSet for EnumerableSet.UintSet;

    /// @notice A descriptive name for a collection of NFTs in this contract
    function name() external pure override returns (string memory) {
        return "Bitmap Art Token";
    }

    /// @notice An abbreviated name for NFTs in this contract
    function symbol() external pure override returns (string memory) {
        return "BITMAP";
    }

    function tokenURI(uint256 id) public view virtual override returns (string memory) {
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



    function mint(uint256 id) external {
        _mint(id, msg.sender);
    }


    function _tokenURI(uint256 id) internal view returns (string memory) {
        address owner = _ownerOf(id);
        require(owner != address(0), "NOT_EXISTS");
        return "TODO";
    }

}
