// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract ERC20_smart_contract is ERC20 {
    using Strings for uint256;

    address public lastSender;
    address public lastReceiver;
    uint256 public lastTimestamp;

    constructor(uint256 initialSupply) ERC20("AITU_SE-2318_Token", "AITUSE") {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }

    function transfer(address recipient, uint256 amount) public override returns (bool) {
        lastSender = msg.sender;
        lastReceiver = recipient;
        lastTimestamp = block.timestamp;

        _transfer(msg.sender, recipient, amount);
        return true;
    }

    function getLastTransactionTimestamp() public view returns (string memory) {
        if (lastTimestamp == 0) {
            return "No transactions yet";
        }
        return timestampToHumanReadable(lastTimestamp);
    }

    function getLastSenderAddress() public view returns (address) {
        return lastSender;
    }

    function getLastReceiverAddress() public view returns (address) {
        return lastReceiver;
    }

    function timestampToHumanReadable(uint256 timestamp) internal pure returns (string memory) {
        uint256 daysCount = timestamp / 86400;
        uint256 hoursCount = (timestamp % 86400) / 3600;
        uint256 minutesCount = (timestamp % 3600) / 60;
        uint256 secondsCount = timestamp % 60;

        return string(abi.encodePacked(
            daysCount.toString(), " days, ",
            hoursCount.toString(), " hours, ",
            minutesCount.toString(), " minutes, ",
            secondsCount.toString(), " seconds"
        ));
    }

    function uintToStr(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length - 1;
        while (_i != 0) {
            bstr[k--] = bytes1(uint8(48 + _i % 10));
            _i /= 10;
        }
        return string(bstr);
    }
}
