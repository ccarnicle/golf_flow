import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868
import ArcadeVault from 0x7a28486e92dac163

// This transaction commits a wager to the ArcadeVault contract.
// It withdraws the specified amount of FLOW from the signer's account,
// calls the `commit` function in the ArcadeVault contract, and saves
// the returned Receipt to the signer's account storage.

transaction(betAmount: UFix64) {

    prepare(signer: auth(Storage, Capabilities) &Account) {

        // 1. Withdraw the bet from the user's FLOW vault.
        let vaultRef = signer.storage
            .borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Cannot borrow reference to FlowToken vault")
            
        let bet <- vaultRef.withdraw(amount: betAmount)

        // 2. Call the commit function on the ArcadeVault contract.
        // We pass the signer's address as the 'payer' and the vault as the 'bet'.
        let receipt <- ArcadeVault.commit(
            payer: signer.address,
            bet: <- bet
        )

        // 3. Save the returned receipt to the signer's account storage.
        if signer.storage.type(at: ArcadeVault.ReceiptStoragePath) != nil {
            panic("An ArcadeVault receipt is already stored. Please complete the previous game first.")
        }
        signer.storage.save(<- receipt, to: ArcadeVault.ReceiptStoragePath)

        // 4. Publish a capability to the receipt so it can be accessed publicly if needed.
        if signer.capabilities.borrow<&ArcadeVault.Receipt>(/public/ArcadeVaultReceipts) == nil {
            let cap = signer.capabilities.storage.issue<&ArcadeVault.Receipt>(
                ArcadeVault.ReceiptStoragePath
            )
            signer.capabilities.publish(cap, at: /public/ArcadeVaultReceipts)
        }
    }

    execute {
        log("ArcadeVault wager committed successfully. Receipt saved.")
    }
}