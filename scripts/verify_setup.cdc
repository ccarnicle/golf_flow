import "FungibleToken"
import "ArcadeVault"

// This script verifies that the ArcadeVault contract's reserve vault
// has been correctly set up and made publicly accessible for balance checks.
// It returns true if the setup is correct, and false otherwise.

access(all) fun main(contractAddress: Address): Bool {
    let account = getAccount(contractAddress)

    // Attempt to borrow the public capability for the reserve vault's balance.
    // This capability should have been published during the contract's initialization.
    let vaultRef = account
        .capabilities.get<&{FungibleToken.Balance}>(/public/ArcadeVaultReserveBalance)
        .borrow()

    if vaultRef != nil {
        log("SUCCESS: Vault capability found at /public/ArcadeVaultReserveBalance.")
        return true
    } else {
        log("ERROR: Could not borrow vault capability. The vault might not have been published correctly.")
        return false
    }
}
