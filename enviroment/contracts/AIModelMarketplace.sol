// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AIModelMarketplace {
    using Counters for Counters.Counter;
    Counters.Counter private _modelIds;

    IERC20 public paymentToken;

    struct AIModel {
        uint256 id;
        string name;
        string description;
        uint256 price;
        address seller;
        string modelHash;
        bool isSold;
        bool exists;
        uint256 totalRating;
        uint256 ratingCount;
    }

    mapping(uint256 => AIModel) public models;
    mapping(uint256 => mapping(address => bool)) public hasRated;

    event ModelListed(uint256 indexed id, address indexed seller, uint256 price);
    event ModelPurchased(uint256 indexed id, address indexed buyer, uint256 price);
    event ModelDeleted(uint256 indexed id, address indexed seller);
    event ModelRated(uint256 indexed id, address indexed rater, uint8 rating);

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
            isSold: false,
            exists: true,
            totalRating: 0,
            ratingCount: 0
        });

        emit ModelListed(newModelId, msg.sender, price);
    }

    function deleteModel(uint256 _id) public {
        require(models[_id].exists, "Model does not exist");
        require(models[_id].seller == msg.sender, "You are not the owner");
        require(!models[_id].isSold, "Cannot delete a sold model");
        
        models[_id].exists = false;
        
        emit ModelDeleted(_id, msg.sender);
    }

    function buyModel(uint256 modelId) external {
        require(models[modelId].exists, "Model does not exist");
        require(!models[modelId].isSold, "Model already sold");
        require(models[modelId].seller != address(0), "Invalid seller");
        require(msg.sender != models[modelId].seller, "Cannot buy your own model");

        require(paymentToken.balanceOf(msg.sender) >= models[modelId].price, "Insufficient token balance");
        require(paymentToken.allowance(msg.sender, address(this)) >= models[modelId].price, "Approve more tokens");

        bool success = paymentToken.transferFrom(msg.sender, models[modelId].seller, models[modelId].price);
        require(success, "Token transfer failed");

        models[modelId].isSold = true;
        emit ModelPurchased(modelId, msg.sender, models[modelId].price);
    }

    function rateModel(uint256 modelId, uint8 rating) external {
        require(models[modelId].exists, "Model does not exist");
        require(models[modelId].isSold, "Model must be purchased before rating");
        require(rating >= 1 && rating <= 5, "Rating must be between 1 and 5");
        require(!hasRated[modelId][msg.sender], "You have already rated this model");

        models[modelId].totalRating += rating;
        models[modelId].ratingCount += 1;
        hasRated[modelId][msg.sender] = true;

        emit ModelRated(modelId, msg.sender, rating);
    }

    function getModelRating(uint256 modelId) external view returns (uint256) {
        require(models[modelId].exists, "Model does not exist");
        if (models[modelId].ratingCount == 0) {
            return 0;
        }
        return models[modelId].totalRating / models[modelId].ratingCount;
    }

    function getAvailableModels() external view returns (AIModel[] memory) {
        uint256 count = _modelIds.current();
        uint256 availableCount = 0;

        for (uint256 i = 1; i <= count; i++) {
            if (models[i].exists && !models[i].isSold) {
                availableCount++;
            }
        }

        AIModel[] memory availableModels = new AIModel[](availableCount);
        uint256 index = 0;
        for (uint256 i = 1; i <= count; i++) {
            if (models[i].exists && !models[i].isSold) {
                availableModels[index] = models[i];
                index++;
            }
        }

        return availableModels;
    }

    function getModelCount() public view returns (uint256) {
        uint256 count = _modelIds.current();
        uint256 availableCount = 0;

        for (uint256 i = 1; i <= count; i++) {
            if (models[i].exists) {
                availableCount++;
            }
        }

        return availableCount;
    }

    function getTokenBalance(address account) public view returns (uint256) {
        return paymentToken.balanceOf(account);
    }
}
