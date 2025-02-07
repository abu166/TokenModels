// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AIModelMarketplace {
    using Counters for Counters.Counter;
    Counters.Counter private _modelIds;

    struct AIModel {
        uint256 id;
        string name;
        string description;
        uint256 price;
        address seller;
        string modelHash; // IPFS hash or storage reference
        bool isSold;
    }

    mapping(uint256 => AIModel) public models;
    IERC20 public paymentToken;

    event ModelListed(uint256 id, address seller, uint256 price);
    event ModelPurchased(uint256 id, address buyer);

    constructor(address _tokenAddress) {
        require(_tokenAddress != address(0), "Invalid token address");
        paymentToken = IERC20(_tokenAddress);
    }

    function listModel(
        string memory name,
        string memory description,
        uint256 price,
        string memory modelHash
    ) external {
        require(price > 0, "Price must be greater than zero");

        _modelIds.increment();
        uint256 newModelId = _modelIds.current();
        
        models[newModelId] = AIModel({
            id: newModelId,
            name: name,
            description: description,
            price: price,
            seller: msg.sender,
            modelHash: modelHash,
            isSold: false
        });

        emit ModelListed(newModelId, msg.sender, price);
    }

    function buyModel(uint256 modelId) external {
        require(modelId > 0 && modelId <= _modelIds.current(), "Invalid model ID");
        
        AIModel storage model = models[modelId];
        require(!model.isSold, "Model already sold");
        require(model.seller != address(0), "Seller does not exist");

        // Ensure buyer has enough balance and allowance
        require(paymentToken.balanceOf(msg.sender) >= model.price, "Insufficient token balance");
        require(paymentToken.allowance(msg.sender, address(this)) >= model.price, "Approve more tokens");

        // Transfer tokens from buyer to seller
        bool success = paymentToken.transferFrom(msg.sender, model.seller, model.price);
        require(success, "Token transfer failed");

        model.isSold = true;
        emit ModelPurchased(modelId, msg.sender);
    }

    function getTokenBalance(address account) public view returns (uint256) {
        return paymentToken.balanceOf(account);
    }
}
