import "FungibleToken"
import "ArcadeVault"

// This script reads the balance of the ArcadeVault's reserve vault,
// which holds the game's prize pool.

access(all) fun main(contractAddress: Address): UFix64 {
    let contractAccount = getAccount(contractAddress)
    
    // Use the actual published path from the contract
    let vaultRef = contractAccount
        .capabilities.get<&{FungibleToken.Balance}>(/public/ArcadeVaultReserveBalance)
        .borrow()
        ?? panic("Could not borrow Balance capability from the contract's vault")

    return vaultRef.balance
}