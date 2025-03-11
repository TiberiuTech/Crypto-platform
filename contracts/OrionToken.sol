// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OrionToken is ERC20, Ownable {
    constructor() ERC20("Orion", "ORX") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10 ** decimals()); // Initial supply of 1 million tokens
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    // Funcție pentru distribuirea de recompense
    function distributeRewards(address user, uint256 amount) public onlyOwner {
        require(amount > 0, "Amount must be positive");
        _mint(user, amount);
    }
}
