type TransformSchema = {
  [ key: string ]: string | TransformSchema | ( ( value: any ) => any );
};

type TransformFunction = ( response: any, schema: TransformSchema ) => any;

const transformResponse: TransformFunction = ( response, schema ) =>
{
  const result: any = {};

  for ( const key in schema )
  {
    const value = schema[ key ];
    if ( typeof value === 'string' )
    {
      // Direct mapping
      result[ key ] = value.split( '.' ).reduce( ( acc, part ) => acc && acc[ part ], response );
    } else if ( typeof value === 'function' )
    {
      // Custom function
      result[ key ] = value( response );
    } else if ( typeof value === 'object' && value !== null )
    {
      // Nested schema
      result[ key ] = transformResponse( response, value );
    }
  }

  return result;
};

const transactionSchema: TransformSchema = {
  accountId: 'currentAccount.hederaAccountId',
  evmAddress: 'currentAccount.hederaEvmAddress',
  balance: 'currentAccount.balance.hbars',
  network: 'currentAccount.network',
  transactions: ( response: any ) => response.transactions.map( ( tx: any ) => ( {
    timestamp: tx.consensus_timestamp,
    transactionHash: tx.transaction_hash,
    transactionId: tx.transaction_id,
    result: tx.result,
    transfers: tx.transfers.map( ( transfer: any ) => ( {
      account: transfer.account,
      amount: transfer.amount,
    } ) )
  } ) ),
};

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
// Transform the transactions response
const transformedTransactionResponse = transformResponse( jsonResponse, transactionSchema );
console.dir( transformedTransactionResponse, { depth: null } );

const sendCryptoSchema: TransformSchema = {
  accountId: 'currentAccount.hederaAccountId',
  evmAddress: 'currentAccount.hederaEvmAddress',
  balance: 'currentAccount.balance.hbars',
  network: 'currentAccount.network',
  receipt:{
    status: 'receipt.status',

  },
  exchangeRate: {
    hbars: 'receipt.exchangeRate.hbars',
    cents: 'receipt.exchangeRate.cents',
  },
};
const sendCryptoResponse = {
  "currentAccount": {
    "hederaAccountId": "0.0.4559",
    "hederaEvmAddress": "0x3ba201df50314e4702d4d92b52d304ee63bfca23",
    "balance": {
      "hbars": 89.60505513,
      "timestamp": "Thu, 01 Feb 2024 21:22:58 GMT",
      "tokens": {}
    },
    "network": "testnet"
  },
  "receipt": {
    "status": "SUCCESS",
    "accountId": "",
    "fileId": "",
    "contractId": "",
    "topicId": "",
    "tokenId": "",
    "scheduleId": "",
    "exchangeRate": {
      "hbars": 1,
      "cents": 12,
      "expirationTime": "Mon, 25 Nov 1963 17:31:44 GMT",
      "exchangeRateInCents": 12
    },
    "topicSequenceNumber": "0",
    "topicRunningHash": "",
    "totalSupply": "0",
    "scheduledTransactionId": "",
    "serials": [],
    "duplicates": [],
    "children": []
  }
}
// Transform the send_crypto response
const transformedSendCryptoResponse = transformResponse(sendCryptoResponse, sendCryptoSchema);
console.log(transformedSendCryptoResponse);

