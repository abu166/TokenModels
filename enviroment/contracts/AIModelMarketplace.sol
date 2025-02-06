// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AIModelMarketplace is Ownable {
    IERC20 public token;

    struct AIModel {
        uint256 id;
        string name;
        string description;
        uint256 price;
        address payable seller;
        bool sold;
    }

    uint256 public modelCounter;
    mapping(uint256 => AIModel) public models;

    event ModelListed(uint256 id, string name, uint256 price, address indexed seller);
    event ModelSold(uint256 id, address indexed buyer);

    // Fix: Pass msg.sender to Ownable
    constructor(address _token) Ownable(msg.sender) {
        require(_token != address(0), "Token address cannot be zero");
        token = IERC20(_token);
    }

    function listModel(string memory _name, string memory _description, uint256 _price) public {
        require(_price > 0, "Price must be greater than zero");
        modelCounter++;
        models[modelCounter] = AIModel(modelCounter, _name, _description, _price, payable(msg.sender), false);
        emit ModelListed(modelCounter, _name, _price, msg.sender);
    }

    function buyModel(uint256 _id) public {
        AIModel storage model = models[_id];
        require(!model.sold, "Model already sold");
        require(token.transferFrom(msg.sender, model.seller, model.price), "Payment failed");
        model.sold = true;
        emit ModelSold(_id, msg.sender);
    }

    function getModelDetails(uint256 _id) public view returns (string memory, string memory, uint256, address, bool) {
        AIModel storage model = models[_id];
        return (model.name, model.description, model.price, model.seller, model.sold);
    }

    function getTotalModels() public view returns (uint256) {
        return modelCounter;
    }
}
