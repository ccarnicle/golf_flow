import "FungibleToken"
import "ArcadeVault"

// This script gets the balance of the ArcadeVault contract's reserve vault
// by accessing its public Balance capability.

access(all) fun main(contractAddress: Address): UFix64 {
    let account = getAccount(contractAddress)

    // Attempt to borrow the public capability for the reserve vault's balance.
    // This capability should have been published during the contract's initialization.
    let vaultRef = account
        .capabilities.get<&{FungibleToken.Balance}>(/public/ArcadeVaultReserveBalance)
        .borrow()
        ?? panic("Could not borrow Balance capability. The vault might not have been published correctly.")

    log("SUCCESS: Vault capability found. Returning balance.")
    
    return vaultRef.balance
}