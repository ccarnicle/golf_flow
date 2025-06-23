import "NonFungibleToken"
import "SportsEquipment"

// This script reads a user's SportsEquipment collection and returns
// their highest tier equipment (Gold > Silver > Bronze)

access(all) fun main(userAddress: Address): String {
    // Get the user's account
    let userAccount = getAccount(userAddress)
    
    // Try to borrow their SportsEquipment collection
    let collectionRef = userAccount
        .capabilities.get<&{NonFungibleToken.CollectionPublic}>(SportsEquipment.CollectionPublicPath)
        .borrow()
    
    // If they don't have a collection, return "Default"
    if collectionRef == nil {
        return "Default"
    }
    
    var highestTier = "Default"
    let ids = collectionRef!.getIDs()
    
    // Loop through all their NFTs
    for id in ids {
        // Borrow a reference to the NFT
        if let nft = collectionRef!.borrowNFT(id) {
            // Cast it to SportsEquipment.NFT to access the tier property
            if let equipment = nft as? &SportsEquipment.NFT {
                let tier = equipment.tier
                
                // Check for the best tier (Gold > Silver > Bronze)
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
    
    return highestTier
}