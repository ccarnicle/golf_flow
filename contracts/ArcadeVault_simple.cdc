import "FungibleToken"
import "FlowToken"
import "RandomConsumer"
import "Burner"
import "Xorshift128plus"

/**
ArcadeVault

A generic contract for facilitating provably fair games of chance.
It uses a modular design for its paytable, allowing the game
to be easily re-skinned or reconfigured by the owner.
*/
access(all) contract ArcadeVault {

    // ─────────────────────────── Events ─────────────────────────── //
    access(all) event WagerCommitted(payer: Address, amountCommitted: UFix64, receiptID: UInt64)
    access(all) event WagerRevealed(payer: Address, recipient: Address, wagerAmount: UFix64, receiptID: UInt64, outcomeTier: String, roll: UInt64, payoutAmount: UFix64)
    access(all) event PaytableChanged()

    // ───────────────────── Paths & State ───────────────────── //
    access(all) let ReserveVaultStoragePath: StoragePath
    access(all) let ReceiptStoragePath: StoragePath
    access(all) let AdminStoragePath: StoragePath

    access(self) let consumer: @RandomConsumer.Consumer
    access(self) var paytable: @{IPaytable}

    // ─────────────── Interfaces for Modularity ─────────────── //
    access(all) resource interface IPaytable {
        access(all) fun getResult(score: UInt64): PaytableResult
    }

    // ─────────── Default Paytable (95% RTP) ──────────── //
    access(all) resource DefaultPaytable: IPaytable {
        access(all) fun getResult(score: UInt64): PaytableResult {
            if score >= 100 { return PaytableResult(tier: "Jackpot", payoutMultiplier: 20.0) }
            else if score >= 98 { return PaytableResult(tier: "MajorWin", payoutMultiplier: 8.5) }
            else if score >= 90 { return PaytableResult(tier: "StandardWin", payoutMultiplier: 2.0) }
            else if score >= 60 { return PaytableResult(tier: "Refund", payoutMultiplier: 1.0) }
            else if score >= 30 { return PaytableResult(tier: "PartialLoss", payoutMultiplier: 0.4) }
            else { return PaytableResult(tier: "TotalLoss", payoutMultiplier: 0.0) }
        }
    }

    access(all) struct PaytableResult {
        access(all) let tier: String
        access(all) let payoutMultiplier: UFix64
        init(tier: String, payoutMultiplier: UFix64) {
            self.tier = tier
            self.payoutMultiplier = payoutMultiplier
        }
    }

    // ─────────────── Receipt Resource ─────────────── //
    access(all) resource Receipt : RandomConsumer.RequestWrapper {
        access(all) let betAmount: UFix64
        access(all) var request: @RandomConsumer.Request?
        init(betAmount: UFix64, request: @RandomConsumer.Request) {
            self.betAmount = betAmount
            self.request <- request
        }
    }

    // ───────────────── Commit & Reveal Functions ───────────────── //
    access(all) fun commit(payer: Address, bet: @{FungibleToken.Vault}): @Receipt {
        pre {
            bet.balance > 0.0: "Bet is zero."
            bet.getType() == Type<@FlowToken.Vault>(): "Vault must be FlowToken."
        }
        
        // Borrow a reference to the contract's reserve vault that can receive tokens
        let reserveRef = self.account.storage.borrow<&{FungibleToken.Receiver}>(from: self.ReserveVaultStoragePath)
            ?? panic("Could not borrow reference to the reserve vault")

        let wagerAmount = bet.balance
        reserveRef.deposit(from: <-bet)
        
        let req <- self.consumer.requestRandomness()
        let receipt <- create Receipt(betAmount: wagerAmount, request: <- req)
        
        emit WagerCommitted(payer: payer, amountCommitted: wagerAmount, receiptID: receipt.uuid)
        return <- receipt
    }

    access(all) fun reveal(payer: Address, recipient: Address, receipt: @Receipt) {
        pre {
            receipt.request != nil : "Receipt has already been used."
            receipt.getRequestBlock()! < getCurrentBlock().height : "Commit block has not passed."
        }
        
        let wagerAmount = receipt.betAmount
        let receiptID = receipt.uuid
        
        let prg = self.consumer.fulfillWithPRG(request: <- receipt.popRequest())
        let prgRef: &Xorshift128plus.PRG = &prg
        let roll = RandomConsumer.getNumberInRange(prg: prgRef, min: 1, max: 100)

        let result = self.paytable.getResult(score: roll)
        let payoutAmount = wagerAmount * result.payoutMultiplier

        if payoutAmount > 0.0 {
            // Borrow a reference to the contract's reserve vault with Withdraw permissions
            let reserveRef = self.account.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: self.ReserveVaultStoragePath)
                ?? panic("Could not borrow reference to the reserve vault for withdrawal")
            
            let payoutVault <- reserveRef.withdraw(amount: payoutAmount)
            
            let playerReceiver = getAccount(recipient)
                .capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                .borrow() ?? panic("Could not borrow receiver capability for recipient")
            playerReceiver.deposit(from: <-payoutVault)
        }
        
        emit WagerRevealed(payer: payer, recipient: recipient, wagerAmount: wagerAmount, receiptID: receiptID, outcomeTier: result.tier, roll: roll, payoutAmount: payoutAmount)
        Burner.burn(<- receipt)
    }

    // ───────────────── Admin Functions ───────────────── //
    access(all) resource Admin {
        access(all) fun setPaytable(paytable: @{IPaytable}) {
            let oldPaytable <- ArcadeVault.paytable <- paytable
            destroy oldPaytable
            emit PaytableChanged()
        }
    }

    // ───────────────── Initialization ───────────────── //
    init() {
        self.ReserveVaultStoragePath = /storage/ArcadeVaultReserveVault
        self.ReceiptStoragePath = /storage/ArcadeVaultReceipts
        self.AdminStoragePath = /storage/ArcadeVaultAdmin

        // Create the vault and save it to storage
        self.account.storage.save(
            <-FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>()),
            to: self.ReserveVaultStoragePath
        )

        // Publish a public capability to the vault's Balance
        let cap = self.account.capabilities.storage.issue<&{FungibleToken.Balance}>(
            self.ReserveVaultStoragePath
        )
        self.account.capabilities.publish(cap, at: /public/ArcadeVaultReserveBalance)

        self.consumer <- RandomConsumer.createConsumer()
        self.paytable <- create DefaultPaytable()
        self.account.storage.save(<-create Admin(), to: self.AdminStoragePath)
    }
}
