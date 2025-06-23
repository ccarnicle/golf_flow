import ArcadeVault from 0x7a28486e92dac163

access(all) fun main(userAddress: Address): Bool {
    let userAccount = getAccount(userAddress)

    let receiptRef = userAccount
        .capabilities
        .borrow<&ArcadeVault.Receipt>(/public/ArcadeVaultReceipts)
        
    return receiptRef != nil
}