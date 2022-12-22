// SPDX-License-Identifier: MIT
pragma solidity >=0.6.12;

interface IMasterChefV1 {
    function deposit(uint256 _pid, uint256 _amount) external;

    function withdraw(uint256 _pid, uint256 _amount) external;

    function userInfo(uint256 _pid, address _user) external view returns (uint256, uint256);

    function sushi() external pure returns (address);
}

interface IMasterChefV2 {
    function deposit(uint256 pid, uint256 amount, address to) external;

    function withdraw(uint256 pid, uint256 amount, address to) external;

    function harvest(uint256 pid, address to) external;

    function withdrawAndHarvest(uint256 pid, uint256 amount, address to) external;

    function userInfo(uint256 _pid, address _user) external view returns (uint256, uint256);

    function SUSHI() external pure returns (address);
}
