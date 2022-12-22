// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "./interfaces/IRouter.sol";
import "./interfaces/IMasterChef.sol";
import "./interfaces/IERC20Basic.sol";

contract LiquidityMining is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    address public ROUTER;
    address public MASTER_CHEF_V1;
    address public MASTER_CHEF_V2;

    event AddLiquidityAndDeposit(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 pid,
        address tokenSLP
    );

    event WithdrawAndRemoveLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountMinA,
        uint256 amountMinB,
        uint256 pid,
        address tokenSLP,
        uint256 amountSLP,
        uint256 amountSushi
    );

    event HarvestFromMasterChefV2(uint256 pid);

    modifier validateTokens1(
        address _tokenA,
        address _tokenB,
        address _tokenSLP
    ) {
        require(_tokenA != address(0), "LiquidityMining: TokenA cannot be a 0 address");
        require(_tokenB != address(0), "LiquidityMining: TokenB cannot be a 0 address");
        require(_tokenSLP != address(0), "LiquidityMining: TokenSLP cannot be a 0 address");
        _;
    }

    modifier validateTokens2(address _tokenA, address _tokenSLP) {
        require(_tokenA != address(0), "LiquidityMining: TokenA cannot be a 0 address");
        require(_tokenSLP != address(0), "LiquidityMining: TokenSLP cannot be a 0 address");
        _;
    }

    function initialize(address _ROUTER, address _MASTER_CHEF_V1, address _MASTER_CHEF_V2) public initializer {
        require(_ROUTER != address(0), "LiquidityMining: Cannot set a 0 address as Router");
        require(_MASTER_CHEF_V1 != address(0), "LiquidityMining: Cannot set a 0 address as MasterChefV1");
        require(_MASTER_CHEF_V2 != address(0), "LiquidityMining: Cannot set a 0 address as MasterChefV2");

        ROUTER = _ROUTER;
        MASTER_CHEF_V1 = _MASTER_CHEF_V1;
        MASTER_CHEF_V2 = _MASTER_CHEF_V2;

        __ReentrancyGuard_init();
        __Ownable_init();
    }

    /**
     * Approve tokens to be used by ROUTER, MASTER_CHEF_V1 and MASTER_CHEF_V2 contracts
     * @param _erc20Token ERC20 token address to approve.
     */
    function approveTokens(address[] calldata _erc20Token) external nonReentrant {
        for (uint256 i = 0; i < _erc20Token.length; i++) {
            TransferHelper.safeApprove(_erc20Token[i], address(ROUTER), type(uint256).max);
            TransferHelper.safeApprove(_erc20Token[i], address(MASTER_CHEF_V1), type(uint256).max);
            TransferHelper.safeApprove(_erc20Token[i], address(MASTER_CHEF_V2), type(uint256).max);
        }
    }

    // External methods

    function addLiquidityAndDepositToMasterChefV1(
        address _tokenA,
        address _tokenB,
        uint256 _amountA,
        uint256 _amountB,
        uint256 _pid,
        address _tokenSLP,
        uint256 _deadline
    ) external onlyOwner validateTokens1(_tokenA, _tokenB, _tokenSLP) nonReentrant {
        _addLiquidity(_tokenA, _tokenB, _amountA, _amountB, _deadline);

        _depositToMasterChefV1(_pid, _tokenSLP);

        emit AddLiquidityAndDeposit(_tokenA, _tokenB, _amountA, _amountB, _pid, _tokenSLP);
    }

    function addLiquidityETHAndDepositToMasterChefV1(
        address _tokenA,
        uint256 _amountA,
        uint256 _pid,
        address _tokenSLP,
        uint256 _deadline
    ) external payable onlyOwner validateTokens2(_tokenA, _tokenSLP) nonReentrant {
        _addLiquidityETH(_tokenA, _amountA, _deadline);

        _depositToMasterChefV1(_pid, _tokenSLP);

        emit AddLiquidityAndDeposit(_tokenA, IRouter(ROUTER).WETH(), _amountA, msg.value, _pid, _tokenSLP);
    }

    function addLiquidityAndDepositToMasterChefV2(
        address _tokenA,
        address _tokenB,
        uint256 _amountA,
        uint256 _amountB,
        uint256 _pid,
        address _tokenSLP,
        uint256 _deadline
    ) external onlyOwner validateTokens1(_tokenA, _tokenB, _tokenSLP) nonReentrant {
        _addLiquidity(_tokenA, _tokenB, _amountA, _amountB, _deadline);

        _depositToMasterChefV2(_pid, _tokenSLP);

        emit AddLiquidityAndDeposit(_tokenA, _tokenB, _amountA, _amountB, _pid, _tokenSLP);
    }

    function addLiquidityETHAndDepositToMasterChefV2(
        address _tokenA,
        uint256 _amountA,
        uint256 _pid,
        address _tokenSLP,
        uint256 _deadline
    ) external payable onlyOwner validateTokens2(_tokenA, _tokenSLP) nonReentrant {
        _addLiquidityETH(_tokenA, _amountA, _deadline);

        _depositToMasterChefV2(_pid, _tokenSLP);

        emit AddLiquidityAndDeposit(_tokenA, IRouter(ROUTER).WETH(), _amountA, msg.value, _pid, _tokenSLP);
    }

    function withdrawFromMasterChefV1AndRemoveLiquidity(
        address _tokenA,
        address _tokenB,
        uint256 _amountMinA,
        uint256 _amountMinB,
        uint256 _pid,
        address _tokenSLP,
        uint256 _amountSLP,
        uint256 _deadline
    ) external onlyOwner nonReentrant {
        _withdrawFromMasterChefV1(_pid, _amountSLP);

        _removeLiquidity(_tokenA, _tokenB, _amountMinA, _amountMinB, _tokenSLP, _deadline);

        uint256 sushiAmount = _transferSushiTokenMCV1();

        emit WithdrawAndRemoveLiquidity(
            _tokenA,
            _tokenB,
            _amountMinA,
            _amountMinB,
            _pid,
            _tokenSLP,
            _amountSLP,
            sushiAmount
        );
    }

    function withdrawFromMasterChefV1AndRemoveLiquidityETH(
        address _tokenA,
        uint256 _amountMinA,
        uint256 _amountMinETH,
        uint256 _pid,
        address _tokenSLP,
        uint256 _amountSLP,
        uint256 _deadline
    ) external onlyOwner nonReentrant {
        _withdrawFromMasterChefV1(_pid, _amountSLP);

        _removeLiquidityETH(_tokenA, _amountMinA, _amountMinETH, _tokenSLP, _deadline);

        uint256 sushiAmount = _transferSushiTokenMCV1();

        emit WithdrawAndRemoveLiquidity(
            _tokenA,
            IRouter(ROUTER).WETH(),
            _amountMinA,
            _amountMinETH,
            _pid,
            _tokenSLP,
            _amountSLP,
            sushiAmount
        );
    }

    function withdrawFromMasterChefV2AndRemoveLiquidity(
        address _tokenA,
        address _tokenB,
        uint256 _amountMinA,
        uint256 _amountMinB,
        uint256 _pid,
        address _tokenSLP,
        uint256 _amountSLP,
        uint256 _deadline
    ) external onlyOwner nonReentrant {
        _withdrawFromMasterChefV2(_pid, _amountSLP);

        _removeLiquidity(_tokenA, _tokenB, _amountMinA, _amountMinB, _tokenSLP, _deadline);

        uint256 sushiAmount = _transferSushiTokenMCV2();

        emit WithdrawAndRemoveLiquidity(
            _tokenA,
            _tokenB,
            _amountMinA,
            _amountMinB,
            _pid,
            _tokenSLP,
            _amountSLP,
            sushiAmount
        );
    }

    function withdrawFromMasterChefV2AndRemoveLiquidityETH(
        address _tokenA,
        uint256 _amountMinA,
        uint256 _amountMinETH,
        uint256 _pid,
        address _tokenSLP,
        uint256 _amountSLP,
        uint256 _deadline
    ) external onlyOwner nonReentrant {
        _withdrawFromMasterChefV2(_pid, _amountSLP);

        _removeLiquidityETH(_tokenA, _amountMinA, _amountMinETH, _tokenSLP, _deadline);

        uint256 sushiAmount = _transferSushiTokenMCV2();

        emit WithdrawAndRemoveLiquidity(
            _tokenA,
            IRouter(ROUTER).WETH(),
            _amountMinA,
            _amountMinETH,
            _pid,
            _tokenSLP,
            _amountSLP,
            sushiAmount
        );
    }

    function harvestFromMasterChefV2(uint256 _pid) external onlyOwner nonReentrant {
        IMasterChefV2(MASTER_CHEF_V2).harvest(_pid, msg.sender);

        emit HarvestFromMasterChefV2(_pid);
    }

    // Internal methods

    function _addLiquidity(
        address _tokenA,
        address _tokenB,
        uint256 _amountA,
        uint256 _amountB,
        uint256 _deadline
    ) internal {
        TransferHelper.safeTransferFrom(_tokenA, msg.sender, address(this), _amountA);
        TransferHelper.safeTransferFrom(_tokenB, msg.sender, address(this), _amountB);

        IRouter(ROUTER).addLiquidity(
            _tokenA,
            _tokenB,
            _amountA,
            _amountB,
            _amountA,
            _amountB,
            address(this),
            _deadline
        );
    }

    function _addLiquidityETH(address _tokenA, uint256 _amountA, uint256 _deadline) internal {
        TransferHelper.safeTransferFrom(_tokenA, msg.sender, address(this), _amountA);

        IRouter(ROUTER).addLiquidityETH{value: msg.value}(
            _tokenA,
            _amountA,
            _amountA,
            msg.value,
            address(this),
            _deadline
        );
    }

    function _depositToMasterChefV1(uint256 _pid, address _tokenSLP) internal {
        IMasterChefV1(MASTER_CHEF_V1).deposit(_pid, IERC20Basic(_tokenSLP).balanceOf(address(this)));
    }

    function _depositToMasterChefV2(uint256 _pid, address _tokenSLP) internal {
        IMasterChefV2(MASTER_CHEF_V2).deposit(_pid, IERC20Basic(_tokenSLP).balanceOf(address(this)), address(this));
    }

    function _withdrawFromMasterChefV1(uint256 _pid, uint256 _amountSLP) internal {
        IMasterChefV1(MASTER_CHEF_V1).withdraw(_pid, _amountSLP);
    }

    function _withdrawFromMasterChefV2(uint256 _pid, uint256 _amountSLP) internal {
        IMasterChefV2(MASTER_CHEF_V2).withdrawAndHarvest(_pid, _amountSLP, address(this));
    }

    function _removeLiquidity(
        address _tokenA,
        address _tokenB,
        uint256 _amountMinA,
        uint256 _amountMinB,
        address _tokenSLP,
        uint256 _deadline
    ) internal {
        IRouter(ROUTER).removeLiquidity(
            _tokenA,
            _tokenB,
            IERC20Basic(_tokenSLP).balanceOf((address(this))),
            _amountMinA,
            _amountMinB,
            msg.sender,
            _deadline
        );
    }

    function _removeLiquidityETH(
        address _tokenA,
        uint256 _amountMinA,
        uint256 _amountMinETH,
        address _tokenSLP,
        uint256 _deadline
    ) internal {
        IRouter(ROUTER).removeLiquidityETH(
            _tokenA,
            IERC20Basic(_tokenSLP).balanceOf((address(this))),
            _amountMinA,
            _amountMinETH,
            msg.sender,
            _deadline
        );
    }

    function _transferSushiTokenMCV1() internal returns (uint256 sushiAmount) {
        address sushiAddress = IMasterChefV1(MASTER_CHEF_V1).sushi(); // the name is different between MCV1 and MCV2
        sushiAmount = IERC20Basic(sushiAddress).balanceOf(address(this));
        TransferHelper.safeTransfer(sushiAddress, msg.sender, sushiAmount);
    }

    function _transferSushiTokenMCV2() internal returns (uint256 sushiAmount) {
        address sushiAddress = IMasterChefV2(MASTER_CHEF_V2).SUSHI(); // the name is different between MCV1 and MCV2
        sushiAmount = IERC20Basic(sushiAddress).balanceOf(address(this));
        TransferHelper.safeTransfer(sushiAddress, msg.sender, sushiAmount);
    }

    receive() external payable {}
}
