type Transaction = {
  timestamp: string;
  transactionHash: string;
  transactionId: string;
  result: string;
  transfers: {
    account: string;
    amount: number;
  }[];
};

type TransformedResponse = {
  accountId: string;
  evmAddress: string;
  balance: number;
  network: string;
  transactions: Transaction[];
};

function transformResponse(response: any): TransformedResponse {
  return {
    accountId: response.currentAccount.hederaAccountId,
    evmAddress: response.currentAccount.hederaEvmAddress,
    balance: response.currentAccount.balance.hbars,
    network: response.currentAccount.network,
    transactions: response.transactions.map((tx: any) => ({
      timestamp: tx.consensus_timestamp,
      transactionId: tx.transaction_id,
      name:tx.name,
      result: tx.result,
      transfers: tx.transfers.map((transfer: any) => ({
        account: transfer.account,
        amount: transfer.amount,
      })),
    })),
  };
}

// Example usage
const jsonResponse = {
  "currentAccount": {
    "hederaAccountId": "0.0.4235873",
    "hederaEvmAddress": "0x3ba201df50314e4702d4d92b52d304ee63bfca23",
    "balance": {
      "hbars": 0.75108133,
      "timestamp": "Wed, 24 Jan 2024 21:58:32 GMT",
      "tokens": {}
    },
    "network": "mainnet"
  },
  "transactions": [
    {
      "charged_tx_fee": 65919908,
      "consensus_timestamp": "Wed, 24 Jan 2024 21:58:32 GMT",
      "name": "CRYPTOTRANSFER",
      "result": "SUCCESS",
      "transaction_hash": "lbF/gV2X5IDZBjRVdqiR+AAxKP0Kop8Z51Xt9DcNqGHgMI7PGSR1BoBCPR0aE2jz",
      "transaction_id": "0.0.4235873-1706133501-928562334",
      "transfers": [
        {
          "account": "0.0.8",
          "amount": 5679
        },
        {
          "account": "0.0.98",
          "amount": 59322807
        },
        {
          "account": "0.0.800",
          "amount": 6591422
        },
        {
          "account": "0.0.4235873",
          "amount": -65919918
        },
        {
          "account": "0.0.4551503",
          "amount": 10
        }
      ]
    }
  ]
};

const transformed = transformResponse(jsonResponse);
console.dir(transformed,{depth:null});