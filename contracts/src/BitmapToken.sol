// SPDX-License-Identifier: MIT
pragma solidity 0.7.1;

import "./ERC721Base.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Metadata.sol";

contract BitmapToken is ERC721Base, IERC721Metadata {

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
        return "TODO";
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


    function mint(uint256 id) external {
        _mint(id, msg.sender);
    }

}
