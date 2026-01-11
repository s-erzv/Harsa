// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HarsaEscrow {
    address public owner;
    uint256 public transactionCount;

    enum State { AWAITING_DELIVERY, NEGOTIATING, COMPLETE, CANCELLED, REFUNDED }

    struct Transaction {
        address seller;
        address buyer;
        uint256 amount;
        uint256 negotiatedAmount;
        State status;
        string productSku;
        bool isNegotiationActive;
    }

    mapping(uint256 => Transaction) public transactions;

    event TransactionCreated(uint256 indexed txId, address indexed seller, address indexed buyer, uint256 amount);
    event NegotiationProposed(uint256 indexed txId, uint256 proposedAmount);
    event NegotiationResolved(uint256 indexed txId, bool approved, uint256 finalAmount);
    event ItemReceived(uint256 indexed txId);
    event TransactionCancelled(uint256 indexed txId);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    function checkout(
        address[] memory _sellers,
        uint256[] memory _amounts,
        string[] memory _skus
    ) public payable {
        require(_sellers.length == _amounts.length && _amounts.length == _skus.length, "Array mismatch");
        
        uint256 totalRequired = 0;
        for (uint256 i = 0; i < _amounts.length; i++) {
            totalRequired += _amounts[i];
        }
        require(msg.value >= totalRequired, "Insufficient funds sent");

        for (uint256 i = 0; i < _sellers.length; i++) {
            transactionCount++;
            transactions[transactionCount] = Transaction({
                seller: _sellers[i],
                buyer: msg.sender,
                amount: _amounts[i],
                negotiatedAmount: 0,
                status: State.AWAITING_DELIVERY,
                productSku: _skus[i],
                isNegotiationActive: false
            });

            emit TransactionCreated(transactionCount, _sellers[i], msg.sender, _amounts[i]);
        }
    }

    function proposeNegotiation(uint256 _txId, uint256 _proposedAmount) public {
        Transaction storage txn = transactions[_txId];
        require(msg.sender == txn.buyer, "Only buyer");
        require(txn.status == State.AWAITING_DELIVERY, "Invalid state");
        require(_proposedAmount < txn.amount, "Must be lower than original");

        txn.negotiatedAmount = _proposedAmount;
        txn.isNegotiationActive = true;

        emit NegotiationProposed(_txId, _proposedAmount);
    }

    function respondToNegotiation(uint256 _txId, bool _accept) public {
        Transaction storage txn = transactions[_txId];
        require(msg.sender == txn.seller, "Only seller");
        require(txn.isNegotiationActive, "No active negotiation");

        if (_accept) {
            uint256 refundAmount = txn.amount - txn.negotiatedAmount;
            txn.amount = txn.negotiatedAmount;
            txn.isNegotiationActive = false;

            (bool success, ) = payable(txn.buyer).call{value: refundAmount}("");
            require(success, "Refund failed");
        } else {
            txn.isNegotiationActive = false;
            txn.negotiatedAmount = 0;
        }

        emit NegotiationResolved(_txId, _accept, txn.amount);
    }

    function confirmDelivery(uint256 _txId) public {
        Transaction storage txn = transactions[_txId];
        require(msg.sender == txn.buyer, "Only buyer can confirm");
        require(txn.status == State.AWAITING_DELIVERY, "Invalid status");

        txn.status = State.COMPLETE;
        (bool success, ) = payable(txn.seller).call{value: txn.amount}("");
        require(success, "Transfer to seller failed");

        emit ItemReceived(_txId);
    }

    function cancelTransaction(uint256 _txId) public {
        Transaction storage txn = transactions[_txId];
        require(msg.sender == txn.buyer || msg.sender == txn.seller, "Unauthorized");
        require(txn.status == State.AWAITING_DELIVERY, "Cannot cancel");

        txn.status = State.CANCELLED;
        (bool success, ) = payable(txn.buyer).call{value: txn.amount}("");
        require(success, "Refund failed");

        emit TransactionCancelled(_txId);
    }

    function emergencyWithdraw() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}