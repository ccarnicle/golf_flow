import "FungibleToken"
import "FlowToken"
import "ArcadeVault"

// This transaction allows the contract admin to deposit FLOW
// into the ArcadeVault's reserve vault to fund the prize pool.

transaction(amount: UFix64) {

    let funds: @{FungibleToken.Vault}
    let reserveRef: &{FungibleToken.Receiver}

    prepare(signer: auth(Storage) &Account) {
        // 1. Withdraw the specified amount from the admin's main FLOW vault.
        let adminVault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow reference to the admin's FlowToken vault")

        self.funds <- adminVault.withdraw(amount: amount)

        // 2. Borrow a reference to the ArcadeVault's reserve vault.
        // This must be signed by the account that deployed the contract.
        self.reserveRef = signer.storage.borrow<&{FungibleToken.Receiver}>(from: ArcadeVault.ReserveVaultStoragePath)
            ?? panic("Could not borrow reference to the ArcadeVault reserve")
    }

    execute {
        // 3. Deposit the funds into the reserve vault.
        self.reserveRef.deposit(from: <-self.funds)
        log("Successfully deposited ".concat(amount.toString()).concat(" FLOW into the ArcadeVault reserve."))
    }
}
