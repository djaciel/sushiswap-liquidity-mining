//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ERC20Basic
 * @dev Simpler version of ERC20 interface
 */
interface IERC20Basic {
    function balanceOf(address account) external view returns (uint256);
}
