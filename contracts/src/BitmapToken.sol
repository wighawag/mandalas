// SPDX-License-Identifier: MIT
pragma solidity 0.7.1;

import "./ERC721Base.sol";

contract BitmapToken is ERC721Base {

    /// @notice A descriptive name for a collection of NFTs in this contract
    function name() external pure returns (string memory) {
        return "Bitmap Art Token";
    }

    /// @notice An abbreviated name for NFTs in this contract
    function symbol() external pure returns (string memory) {
        return "BITMAP";
    }

    function mint(uint256 id) external {
        _mint(id, msg.sender);
    }

}
