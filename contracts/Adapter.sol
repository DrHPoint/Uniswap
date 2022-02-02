//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.1;

import "hardhat/console.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title Contract-adapter for working with uniswap v2.
 * @author Pavel E. Hrushchev (DrHPoint).
 * @notice You can use this contract for working with uniswap, include create new pair, swaps and add liquidity.
 * @dev All function calls are currently implemented without side effects.
 */
contract Adapter {
    address public factoryAddress; //address of the factory on platform.
    address public routerAddress; //address of the uniswap's router on platform.
    mapping(address => mapping(address => address)) pairAddresses; //map of pair tokens.

    /** 
    * @notice This event shows which pair of tokens (_firstToken and _secondToken) has been merged, 
    and under what address this pair token finally has(_pairAddress).
    * @dev Nothing unusual. Standard event with two token addresses and address of pair token.
    * @param _firstToken is the address of first token.
    * @param _secondToken is the address of second token.
    * @param _pairAddress is the address of pair token.
    */
    event NewPair(
        address _firstToken,
        address _secondToken,
        address _pairAddress
    );

    /** 
    * @notice This event shows which some amount of tokens (_amountA and _amountB) user send to router, 
    and how many liquidity tokens (_amountLiquidity) user received back.
    * @dev Nothing unusual. Standard event with two token addresses and address of pair token.
    * @param _amountA is the amount of first tokens.
    * @param _amountB is the amount of second tokens.
    * @param _amountLiquidity is the amount of liquidity tokens.
    */
    event AddLiquidity(
        uint256 _amountA,
        uint256 _amountB,
        uint256 _amountLiquidity
    );

    /** 
    * @notice This event shows which some amount of tokens (_amountA and _amountB) user send to router, 
    and how many liquidity tokens (_amountLiquidity) user received back.
    * @dev Nothing unusual. Standard event with user address, two token addresses and amount of this tokens.
    * @param _requestioner is the user address.
    * @param _firstToken is the address of first token.
    * @param _secondToken is the address of second token.
    * @param _firstAmount is the amount of transfer first tokens.
    * @param _secondAmount is the amount of received second tokens.
    */
    event MinSwap(
        address _requestioner,
        address _firstToken,
        address _secondToken,
        uint256 _firstAmount,
        uint256 _secondAmount
    );

    /** 
    * @notice This event shows which some amount of tokens (_amountA and _amountB) user send to router, 
    and how many liquidity tokens (_amountLiquidity) user received back.
    * @dev Nothing unusual. Standard event with user address, two token addresses and amount of this tokens.
    * @param _requestioner is the user address.
    * @param _firstToken is the address of first token.
    * @param _secondToken is the address of second token.
    * @param _firstAmount is the amount of transfer first tokens.
    * @param _secondAmount is the amount of received second tokens.
    */
    event MaxSwap(
        address _requestioner,
        address _firstToken,
        address _secondToken,
        uint256 _firstAmount,
        uint256 _secondAmount
    );

    /** 
    *@dev The constructor provides the address of the factory on platform (_factoryAddress),
    and address of the uniswap's router on platform (_routerAddress).
    * @param _factoryAddress is the address of the factory on platform.
    * @param _routerAddress is the address of the uniswap's router on platform.
    */
    constructor(address _factoryAddress, address _routerAddress) {
        factoryAddress = _factoryAddress;
        routerAddress = _routerAddress;
    }

    /**  
    * @notice This function allows you to create new pair token on factory.
    * @dev This function checks the possibility of zero address and void function on factory that create pair tokens.
    * @param _firstToken - is the address of first token.
    * @param _secondToken - is the address of second token.
    */
    function newPair(address _firstToken, address _secondToken) public {
        require(_firstToken != address(0), "Zero token Address");
        require(_firstToken != address(0), "Zero token Address");
        pairAddresses[_firstToken][_secondToken] = IUniswapV2Factory(
            factoryAddress
        ).createPair(_firstToken, _secondToken);
        emit NewPair(
            _firstToken,
            _secondToken,
            pairAddresses[_firstToken][_secondToken]
        );
    }

    /**  
    * @notice This function allows you to swap some tokens for another tokens with all amount of first tokens.
    * @dev This function transfer first tokens from user account to contract, get approve to router 
    and void swap function from router 
    * @param _firstToken is the address of first token.
    * @param _secondToken is the address of second token.
    * @param _firstAmount is the amount of transfer first tokens.
    */
    function maxSwap(
        address _firstToken,
        address _secondToken,
        uint256 _firstAmount
    ) public {
        address[] memory path = new address[](2);
        path[0] = _firstToken;
        path[1] = _secondToken;
        ERC20(_firstToken).transferFrom(msg.sender, address(this), _firstAmount);
        ERC20(_firstToken).approve(routerAddress, _firstAmount);
        IUniswapV2Router02(routerAddress).swapExactTokensForTokens(
            _firstAmount,
            1,
            path,
            msg.sender,
            (block.timestamp + 120)
        );
        emit MaxSwap(
            msg.sender,
            _firstToken,
            _secondToken,
            _firstAmount,
            1234
        );
    }

    /**  
    * @notice This function allows you to swap some tokens for another tokens.
    * @dev This function transfer first tokens from user account to contract, get approve to router 
    and void swap function from router 
    * @param _firstToken is the address of first token.
    * @param _secondToken is the address of second token.
    * @param _firstAmount is the amount of transfer first tokens.
    * @param _secondAmount is the amount of received second tokens.
    */
    function minSwap(
        address _firstToken,
        address _secondToken,
        uint256 _firstAmount,
        uint256 _secondAmount
    ) public {
        address[] memory path = new address[](2);
        path[0] = _firstToken;
        path[1] = _secondToken;
        ERC20(_firstToken).transferFrom(msg.sender, address(this), _firstAmount);
        ERC20(_firstToken).approve(routerAddress, _firstAmount);
        IUniswapV2Router02(routerAddress).swapTokensForExactTokens(
            _secondAmount,
            _firstAmount,
            path,
            msg.sender,
            (block.timestamp + 120)
        );
        emit MinSwap(
            msg.sender,
            _firstToken,
            _secondToken,
            _firstAmount,
            _secondAmount
        );
    }

    /**  
    * @notice This function allows you to exchange some 
    amount (_amountADesired and _amountBDesired) of tokens (_tokenA and _tokenB) for liquidity tokens.
    * @dev This function checks token addresses for zero address, 
    transfer (_amountADesired and _amountBDesired) of tokens (_tokenA and _tokenB) to conract address,
    after that get approve to use this tokens to router and return remain token back to user.  
    * @param _tokenA - is the address of first token.
    * @param _tokenB - is the address of second token.
    * @param _amountADesired - is the amount of token, that user want to deposite.
    * @param _amountBDesired - is the amount of token, that user want to deposite.
    * @param _amountAMin - is the amount of token, that user want to deposite.
    * @param _amountBMin - is the amount of token, that user want to deposite.
    */
    function addLiquidity(
        address _tokenA,
        address _tokenB,
        uint256 _amountADesired,
        uint256 _amountBDesired,
        uint256 _amountAMin,
        uint256 _amountBMin
    ) public {
        uint256 amountA;
        uint256 amountB;
        uint256 amountLiquidity;
        ERC20(_tokenA).transferFrom(msg.sender, address(this), _amountADesired);
        ERC20(_tokenB).transferFrom(msg.sender, address(this), _amountBDesired);
        ERC20(_tokenA).approve(routerAddress, _amountADesired);
        ERC20(_tokenB).approve(routerAddress, _amountBDesired);
        (amountA, amountB, amountLiquidity) = IUniswapV2Router02(routerAddress)
            .addLiquidity(
                _tokenA,
                _tokenB,
                _amountADesired,
                _amountBDesired,
                _amountAMin,
                _amountBMin,
                msg.sender,
                (block.timestamp + 120)
            );
        if (amountA - _amountADesired > 0)
            ERC20(_tokenA).transfer(msg.sender, amountA - _amountADesired);
        if (amountB - _amountBDesired > 0)
            ERC20(_tokenB).transfer(msg.sender, amountB - _amountBDesired);
        emit AddLiquidity(amountA, amountB, amountLiquidity);
    }
}
