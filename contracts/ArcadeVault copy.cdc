import "FungibleToken"
import "FlowToken"
import "RandomConsumer"
import "Burner"
import "Xorshift128plus"
import "NonFungibleToken"
import "SportsEquipment"

/**
ArcadeVault

A generic contract for facilitating provably fair games of chance.
This version includes a "Luck Boost" mechanic based on NFT ownership,
where the boost is determined by the highest-tier item the player owns.
*/
access(all) contract ArcadeVault {

    // ─────────────────────────── Events ─────────────────────────── //
    access(all) event WagerCommitted(payer: Address, amountCommitted: UFix64, receiptID: UInt64, luckBoost: UInt64)
    access(all) event WagerRevealed(payer: Address, recipient: Address, wagerAmount: UFix64, receiptID: UInt64, outcomeTier: String, baseRoll: UInt64, luckBoost: UInt64, finalScore: UInt64, payoutAmount: UFix64)
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

    // ─────────────── Receipt Resource (Now with Luck Boost) ─────────────── //
    access(all) resource Receipt : RandomConsumer.RequestWrapper {
        access(all) let betAmount: UFix64
        access(all) let luckBoost: UInt64 // Stores the boost at the time of commit
        access(all) var request: @RandomConsumer.Request?
        init(betAmount: UFix64, luckBoost: UInt64, request: @RandomConsumer.Request) {
            self.betAmount = betAmount
            self.luckBoost = luckBoost
            self.request <- request
        }
    }

    // ───────────────── Commit & Reveal Functions ───────────────── //
    access(all) fun commit(payer: Address, bet: @{FungibleToken.Vault}): @Receipt {
        pre {
            bet.balance > 0.0: "Bet is zero."
            bet.getType() == Type<@FlowToken.Vault>(): "Vault must be FlowToken."
        }
        
        // --- NEW: Tiered Luck Boost Logic ---
        var highestTier = "None"
        // Get a capability to the payer's public NFT collection
        if let equipmentCollection = getAccount(payer).capabilities.get<&{NonFungibleToken.CollectionPublic}>(SportsEquipment.CollectionPublicPath).borrow() {
            let ids = equipmentCollection.getIDs()
            for id in ids {
                // Borrow a reference to the NFT to read its tier
                if let nft = equipmentCollection.borrowNFT(id) {
                    if let equipment = nft as? &SportsEquipment.NFT {
                        let tier = equipment.tier

                        // Check for the best tier, Gold > Silver > Bronze
                        if tier == "Gold" {
                            highestTier = "Gold"
                            break // Found the best, no need to check further
                        } else if tier == "Silver" {
                            highestTier = "Silver"
                        } else if tier == "Bronze" && highestTier != "Silver" {
                            highestTier = "Bronze"
                        }
                    }
                }
            }
        }

        var luckBoost: UInt64 = 0
        if highestTier == "Gold" {
            luckBoost = 15
        } else if highestTier == "Silver" {
            luckBoost = 10
        } else if highestTier == "Bronze" {
            luckBoost = 5
        }
        // --- End of New Logic ---

        let reserveRef = self.account.storage.borrow<&{FungibleToken.Receiver}>(from: self.ReserveVaultStoragePath)
            ?? panic("Could not borrow reference to the reserve vault")
        let wagerAmount = bet.balance
        reserveRef.deposit(from: <-bet)
        
        let req <- self.consumer.requestRandomness()
        // Create the receipt with the locked-in luck boost
        let receipt <- create Receipt(betAmount: wagerAmount, luckBoost: luckBoost, request: <- req)
        
        emit WagerCommitted(payer: payer, amountCommitted: wagerAmount, receiptID: receipt.uuid, luckBoost: luckBoost)
        return <- receipt
    }

    access(all) fun reveal(payer: Address, recipient: Address, receipt: @Receipt) {
        pre {
            receipt.request != nil : "Receipt has already been used."
            receipt.getRequestBlock()! < getCurrentBlock().height : "Commit block has not passed."
        }
        
        let wagerAmount = receipt.betAmount
        let receiptID = receipt.uuid
        let luckBoost = receipt.luckBoost // Get the locked-in boost from the receipt
        
        let prg = self.consumer.fulfillWithPRG(request: <- receipt.popRequest())
        let prgRef: &Xorshift128plus.PRG = &prg
        let baseRoll = RandomConsumer.getNumberInRange(prg: prgRef, min: 1, max: 100)

        // Apply the luck boost to get the final score
        let scoreWithBoost = baseRoll + luckBoost
        let finalScoreInt = scoreWithBoost > 100 ? 100 : scoreWithBoost
        let finalScore = UInt64(finalScoreInt) // Explicitly cast to UInt64

        let result = self.paytable.getResult(score: finalScore)
        let payoutAmount = wagerAmount * result.payoutMultiplier

        if payoutAmount > 0.0 {
            let reserveRef = self.account.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: self.ReserveVaultStoragePath)
                ?? panic("Could not borrow reference to the reserve vault for withdrawal")
            let payoutVault <- reserveRef.withdraw(amount: payoutAmount)
            let playerReceiver = getAccount(recipient)
                .capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
                .borrow() ?? panic("Could not borrow receiver capability for recipient")
            playerReceiver.deposit(from: <-payoutVault)
        }
        
        emit WagerRevealed(payer: payer, recipient: recipient, wagerAmount: wagerAmount, receiptID: receiptID, outcomeTier: result.tier, baseRoll: baseRoll, luckBoost: luckBoost, finalScore: finalScore, payoutAmount: payoutAmount)
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

        self.account.storage.save(<-FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>()), to: self.ReserveVaultStoragePath)
        let cap = self.account.capabilities.storage.issue<&{FungibleToken.Balance}>(self.ReserveVaultStoragePath)
        self.account.capabilities.publish(cap, at: /public/ArcadeVaultReserveBalance)

        self.consumer <- RandomConsumer.createConsumer()
        self.paytable <- create DefaultPaytable()
        self.account.storage.save(<-create Admin(), to: self.AdminStoragePath)
    }
}
