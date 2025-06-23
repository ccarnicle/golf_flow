import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868
import NonFungibleToken from 0x631e88ae7f1d7c20
import SportsEquipment from 0x7a28486e92dac163

// This transaction allows a user to buy a tiered SportsEquipment NFT.
// It will automatically create and set up a collection for the user
// if they do not already have one.

transaction(tierToBuy: String, purchaseAmount: UFix64) {

    let paymentVault: @FlowToken.Vault
    let buyerAddress: Address

    prepare(signer: auth(Storage, Capabilities) &Account) {
        
        self.buyerAddress = signer.address

        // --- Step 1: Set up the Collection if it doesn't exist ---
        if signer.storage.borrow<&SportsEquipment.Collection>(from: SportsEquipment.CollectionStoragePath) == nil {
            
            // Create a new empty collection and save it to storage.
            // We now correctly provide the required nftType argument.
            signer.storage.save(
                <-SportsEquipment.createEmptyCollection(nftType: Type<@SportsEquipment.NFT>()),
                to: SportsEquipment.CollectionStoragePath
            )

            // Publish a public capability to the collection's Receiver interface
            signer.capabilities.publish(
                signer.capabilities.storage.issue<&{NonFungibleToken.CollectionPublic}>(SportsEquipment.CollectionStoragePath),
                at: SportsEquipment.CollectionPublicPath
            )

            log("Created a new SportsEquipment Collection for the user.")
        }

        // --- Step 2: Prepare the Payment ---
        let mainVault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow a reference to the main FlowToken vault")
        
        self.paymentVault <- mainVault.withdraw(amount: purchaseAmount) as! @FlowToken.Vault
    }

    execute {
        // --- Step 3: Call the buyEquipment function on the contract ---
        SportsEquipment.buyEquipment(
            payment: <-self.paymentVault, 
            tier: tierToBuy,
            buyerAddress: self.buyerAddress
        )

        log("Equipment purchased successfully!")
    }
}
