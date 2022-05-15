pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

//******************************************************************
// When creating a new token you just need to change the following:
// string public name
// string public symbol
// uint256 public decimals
// constructor() --> totalSupply
//******************************************************************

// Token that meets all ERC 20 Standards, can be deployed to any Blockcain
contract Token {

    // Uses SafeMath from OpenZeppelin
    using SafeMath for uint;

    // Declare Variables
    string public name = "Boost Token";
    string public symbol = "BOOST";
    uint256 public decimals = 18;
    uint256 public totalSupply;

    // Track balances
    // mapping is a way to store value pairs in a dictionary
    // In this case it is an address and the token balance
    // It exposes a public balanceOf funtion; from ERC20 standard
    // uint means the number can not be a negative number
    mapping(address => uint256) public balanceOf;

    // Track how many tokens the exchange is allowed to spend
    // First 'address' is the address approved to spend
    // 'address => uint256' Address to exchange and the amount to spend
    // This function takes in two args: the person who approved the tokens 
    // and the place they approved them. It returns the amount approved
    mapping(address => mapping(address => uint256)) public allowance;

    // Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    // Called only when Smart Contract is first deployed 
    constructor() public {

        // Total Supply is suppy x number of decimals
        // Everything is stored in cents 
        // 1000000 * (10 exponenet the decimals) = 1000000000000000000000000
        totalSupply = 1000000 * (10 ** decimals); // 1 million tokens

        // Send all the tokens to the address that created the Smart Contract
        // From there they can send different amounts to whom ever
        balanceOf[msg.sender] = totalSupply;
    }

    // Create an Internal Function to optimize code
    function _transfer(address _from, address _to, uint256 _value) internal {

        // Validate the address is valid
        require(_to != address(0));

        // Subtract tokens being sent from sender
        balanceOf[_from] = balanceOf[_from].sub(_value);

        // Add tokens to requesters 
        balanceOf[_to] = balanceOf[_to].add(_value);

        // Fire the Transfer Event 
        emit Transfer(_from, _to, _value);
    }

    // Send tokens
    function transfer(address _to, uint256 _value) public returns (bool success) {
        
        // Validate the sender address has at least enough tokens they want to send
        require(balanceOf[msg.sender] >= _value);

        // Call internal function to perform transfor
        _transfer(msg.sender, _to, _value);

        return true;
    }


    // Approve tokens
    function approve(address _spender, uint256 _value) public returns (bool success) {
        
        // Validate the address is valid
        require(_spender != address(0));

        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);

        return true;
    }

    // Transfers From 
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {

        // Validate the sender has enough tokens to cmplete the transfer
        require(_value <= balanceOf[_from]);

        // Value must be less than the approved amount for the exchange itself
        require(_value <= allowance[_from][msg.sender]);

        // Reset the allownace that was called
        allowance[_from][msg.sender] = allowance[_from][msg.sender].sub(_value);

        // Call internal function to perform transfor
        _transfer(_from, _to, _value);

        return true;
    }
}