export const revealWagerTransaction = `
import ArcadeVault from 0x7a28486e92dac163

// This transaction reveals the outcome of a committed wager.
// It loads the stored Receipt from the signer's account,
// and passes it to the ArcadeVault contract's reveal function.

transaction(recipient: Address) {

    prepare(signer: auth(Storage) &Account) {

        // 1. Load the stored Receipt resource from the signer's account.
        let receipt <- signer.storage.load<@ArcadeVault.Receipt>(
            from: ArcadeVault.ReceiptStoragePath
        ) ?? panic(
            "No ArcadeVault Receipt found at the specified path: ".concat(ArcadeVault.ReceiptStoragePath.toString())
        )

        // 2. Call the reveal function on the ArcadeVault contract.
        // We pass the signer as the 'payer' and the recipient's address.
        ArcadeVault.reveal(
            payer: signer.address,
            recipient: recipient,
            receipt: <-receipt
        )
    }

    execute {
        log("ArcadeVault reveal successful. Winnings (if any) have been sent to the recipient.")
    }
}`