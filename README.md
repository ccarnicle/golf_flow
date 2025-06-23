flow transactions send ./transactions/buy_equipment.cdc "Bronze" 5.0 --signer=justin

flow transactions send .\transactions\commit_swap.cdc 5.0 --signer=justin

flow transactions send .\transactions\reveal_swap.cdc 0x179b6b1cb6755e31 --signer=justin

flow transactions send .\utilities\fund_reserve.cdc 10000.0 --signer=emulator-account

Scripts

flow scripts execute .\scripts\verify_balance.cdc 0xf8d6e0586b0a20c7

flow scripts execute ./utilities/get_flow_balance.cdc 0xf8d6e0586b0a20c7

flow scripts execute ./utilities/get_flow_balance.cdc 0x179b6b1cb6755e31
