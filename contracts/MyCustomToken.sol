// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OrionixToken is ERC20, Ownable {
    // Variabile pentru caracteristici speciale
    uint256 public maxSupply;
    uint256 public taxPercentage;
    mapping(address => bool) public excludedFromTax;
    
    constructor(
        uint256 initialSupply,
        uint256 _maxSupply,
        uint256 _taxPercentage
    ) ERC20("Orionix", "ORNX") Ownable(msg.sender) {
        require(_taxPercentage <= 10, "Taxa nu poate depasi 10%");
        maxSupply = _maxSupply * 10 ** decimals();
        taxPercentage = _taxPercentage;
        excludedFromTax[msg.sender] = true; // Proprietarul este exclus de la taxe
        
        // Furnizarea inițială pentru creator
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }
    
    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= maxSupply, "Ar depasi cantitatea maxima");
        _mint(to, amount);
    }
    
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
    
    function setTaxPercentage(uint256 _taxPercentage) public onlyOwner {
        require(_taxPercentage <= 10, "Taxa nu poate depasi 10%");
        taxPercentage = _taxPercentage;
    }
    
    function excludeFromTax(address account, bool excluded) public onlyOwner {
        excludedFromTax[account] = excluded;
    }
    
    // Suprascriem funcția de transfer pentru a implementa taxa
    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal override {
        if (excludedFromTax[sender] || excludedFromTax[recipient] || taxPercentage == 0) {
            super._transfer(sender, recipient, amount);
        } else {
            uint256 taxAmount = (amount * taxPercentage) / 100;
            uint256 transferAmount = amount - taxAmount;
            
            // Transferă suma minus taxa către destinatar
            super._transfer(sender, recipient, transferAmount);
            
            // Transferă taxa către proprietar
            super._transfer(sender, owner(), taxAmount);
        }
    }
    
    // Funcție pentru distribuirea de recompense
    function distributeRewards(address user, uint256 amount) public onlyOwner {
        require(amount > 0, "Suma trebuie sa fie pozitiva");
        require(totalSupply() + amount <= maxSupply, "Ar depasi cantitatea maxima");
        _mint(user, amount);
    }
} 