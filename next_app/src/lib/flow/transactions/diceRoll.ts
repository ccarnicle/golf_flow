export const diceRollScript = `
import OnchainCraps from 0x2a0f8698a713c169
import FungibleToken from 0x9a0766d93b6608b7
import aiSportsJuice from 0xf8ba321af4bd37bb

transaction(betName: String, amount: UFix64) {

    var crapsGameRef: &OnchainCraps.Game?
    let accountAddress: Address
    let diceVault: @{String : {FungibleToken.Vault}}

    prepare(acct: auth(BorrowValue, SaveValue) &Account) {
        self.crapsGameRef = acct.storage.borrow<&OnchainCraps.Game>(from: OnchainCraps.GameStoragePath)
        self.accountAddress = acct.address

        if(self.crapsGameRef == nil) {
            acct.storage.save(<-OnchainCraps.createDiceGame(), to: OnchainCraps.GameStoragePath)
            self.crapsGameRef = acct.storage.borrow<&OnchainCraps.Game>(from: OnchainCraps.GameStoragePath)
        }

        // withdraw tokens from your vault by borrowing a reference to it and calling the withdraw function with that reference
        let vaultRef = acct.storage.borrow<auth(FungibleToken.Withdraw) &aiSportsJuice.Vault>(from: aiSportsJuice.VaultStoragePath)
        ?? panic("Could not borrow a reference to the owner's vault")

        self.diceVault <- {}
        self.diceVault[betName] <-! vaultRef.withdraw(amount: amount)
    }

    execute {
        let result = self.crapsGameRef!.rollDice(newBets: <- self.diceVault)
        log(result)
    }
}
`; 