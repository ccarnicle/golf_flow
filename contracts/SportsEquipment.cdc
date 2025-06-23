import NonFungibleToken from 0x631e88ae7f1d7c20
import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868
import ViewResolver from 0x631e88ae7f1d7c20
import MetadataViews from 0x631e88ae7f1d7c20

/**
SportsEquipment

A standard-compliant contract for creating and selling tiered sports equipment NFTs.
This contract acts as a "vending machine," allowing users to buy equipment
directly with FLOW tokens.
*/
access(all) contract SportsEquipment: NonFungibleToken {

    // ─────────────────────────── Events ─────────────────────────── //
    access(all) event ContractInitialized()
    access(all) event Withdraw(id: UInt64, from: Address?)
    access(all) event Deposit(id: UInt64, to: Address?)
    access(all) event Minted(id: UInt64, tier: String)
    access(all) event EquipmentPurchased(id: UInt64, tier: String, price: UFix64, buyer: Address)

    // ───────────────────── Paths & State ───────────────────── //
    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath
    access(all) let MinterStoragePath: StoragePath
    access(all) let SaleVaultStoragePath: StoragePath

    access(all) var totalSupply: UInt64

    // ───────────────── NFT Resource & Metadata ───────────────── //
    access(all) resource NFT: NonFungibleToken.NFT, ViewResolver.Resolver {
        access(all) let id: UInt64
        access(all) let name: String
        access(all) let description: String
        access(all) let thumbnail: String
        access(all) let tier: String // "Bronze", "Silver", or "Gold"

        init(name: String, description: String, thumbnail: String, tier: String) {
            self.id = SportsEquipment.totalSupply
            self.name = name
            self.description = description
            self.thumbnail = thumbnail
            self.tier = tier
            
            SportsEquipment.totalSupply = SportsEquipment.totalSupply + 1
            emit Minted(id: self.id, tier: self.tier)
        }

        access(all) view fun getViews(): [Type] {
            return [Type<MetadataViews.Display>()]
        }

        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <- SportsEquipment.createEmptyCollection(nftType: Type<@SportsEquipment.NFT>())
        }

        access(all) fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<MetadataViews.Display>():
                    return MetadataViews.Display(
                        name: self.name,
                        description: self.description,
                        thumbnail: MetadataViews.HTTPFile(url: self.thumbnail)
                    )
            }
            return nil
        }
    }

    // ───────────────── NFT Collection Resource ───────────────── //
    access(all) resource Collection: NonFungibleToken.Collection, NonFungibleToken.Provider, NonFungibleToken.Receiver, NonFungibleToken.CollectionPublic, ViewResolver.ResolverCollection {
        access(all) var ownedNFTs: @{UInt64:{NonFungibleToken.NFT}}

        access(NonFungibleToken.Withdraw) fun withdraw(withdrawID: UInt64): @{NonFungibleToken.NFT} {
            let token <- self.ownedNFTs.remove(key: withdrawID) 
                ?? panic("Cannot withdraw: NFT does not exist in this collection.")
            return <-token
        }

        access(all) fun deposit(token: @{NonFungibleToken.NFT}) {
            let nft <- token as! @NFT
            let id = nft.id
            let oldToken <- self.ownedNFTs[id] <- nft
            destroy oldToken
        }

        access(all) view fun getIDs(): [UInt64] { return self.ownedNFTs.keys }
        access(all) view fun getLength(): Int { return self.ownedNFTs.length }

        access(all) view fun borrowNFT(_ id: UInt64): &{NonFungibleToken.NFT}? {
            return &self.ownedNFTs[id] as &{NonFungibleToken.NFT}?
        }
        
        access(all) view fun borrowViewResolver(id: UInt64): &{ViewResolver.Resolver}? {
            let nft = self.borrowNFT(id)
            return nft as? &{ViewResolver.Resolver}
        }

        access(all) view fun getSupportedNFTTypes(): {Type: Bool} {
            return {Type<@SportsEquipment.NFT>(): true}
        }

        access(all) view fun isSupportedNFTType(type: Type): Bool {
            return type == Type<@SportsEquipment.NFT>()
        }

        access(all) fun forEachID(_ f: fun (UInt64): Bool): Void {
            self.ownedNFTs.forEachKey(f)
        }

        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <- SportsEquipment.createEmptyCollection(nftType: Type<@SportsEquipment.NFT>())
        }

        init() {
            self.ownedNFTs <- {}
        }
    }

    access(all) fun buyEquipment(payment: @FlowToken.Vault, tier: String, buyerAddress: Address) {

        var price: UFix64 = 0.0
        if tier == "Bronze" { price = 5.0 } 
        else if tier == "Silver" { price = 10.0 } 
        else if tier == "Gold" { price = 25.0 } 
        else { panic("Invalid tier specified.") }
        
        assert(payment.balance == price, message: "Payment does not match the price for the specified tier.")

        let saleVaultRef = self.account.storage.borrow<&{FungibleToken.Vault}>(from: self.SaleVaultStoragePath)
            ?? panic("Could not borrow reference to the sale vault.")
        saleVaultRef.deposit(from: <-payment)

        let recipientCollection = getAccount(buyerAddress)
            .capabilities.get<&{NonFungibleToken.CollectionPublic}>(self.CollectionPublicPath)
            .borrow() ?? panic("The recipient does not have a SportsEquipment collection set up.")
        
        let minter = self.account.storage.borrow<&Minter>(from: self.MinterStoragePath)
            ?? panic("Could not borrow the minter resource.")
        
        let newNFT <- minter.mintNFT(tier: tier)
        
        emit EquipmentPurchased(id: newNFT.id, tier: tier, price: price, buyer: buyerAddress)

        recipientCollection.deposit(token: <-newNFT)
    }
    
    // ───────────────── Minter Resource ─────────────────── //
    access(all) resource Minter {
        access(all) fun mintNFT(tier: String): @SportsEquipment.NFT {
            var name = ""
            var description = ""

            if tier == "Bronze" { name = "Bronze Bat"; description = "A sturdy bat." } 
            else if tier == "Silver" { name = "Silver Bat"; description = "A well-balanced bat." } 
            else if tier == "Gold" { name = "Gold Bat"; description = "A legendary bat." }
            else { panic("Invalid tier specified.") }
            
            return <- create NFT(
                name: name,
                description: description,
                thumbnail: "ipfs://...", // Placeholder
                tier: tier
            )
        }
    }

    /// createEmptyCollection creates an empty Collection for the specified NFT type
    /// and returns it to the caller so that they can own NFTs
    access(all) fun createEmptyCollection(nftType: Type): @{NonFungibleToken.Collection} {
        return <- create Collection()
    }

    access(all) view fun getContractViews(resourceType: Type?): [Type] { return [] }
    access(all) view fun resolveContractView(resourceType: Type?, viewType: Type): AnyStruct? {
        return nil
    }

    // ───────────────── Initialization ───────────────── //
    init() {
        self.totalSupply = 0
        self.CollectionStoragePath = /storage/SportsEquipmentCollection
        self.CollectionPublicPath = /public/SportsEquipmentCollection
        self.MinterStoragePath = /storage/SportsEquipmentMinter
        self.SaleVaultStoragePath = /storage/SportsEquipmentSaleVault

        self.account.storage.save(<-create Minter(), to: self.MinterStoragePath)
        
        self.account.storage.save(<-FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>()), to: self.SaleVaultStoragePath)

        let cap = self.account.capabilities.storage.issue<&{NonFungibleToken.CollectionPublic}>(self.CollectionStoragePath)
        self.account.capabilities.publish(cap, at: self.CollectionPublicPath)

        emit ContractInitialized()
    }
}
