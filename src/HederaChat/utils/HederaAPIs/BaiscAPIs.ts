import z from "zod";
import { handleSnapAPIRequest } from "../SnapSDK";
import { DynamicStructuredTool } from "../aiUtils";
import { baseResponseSchema, getExternalAccountParams, getTransformedResponse, HederaAPIsResponse, transformResponse, TransformSchema } from "./utils";
import { NavigateFunction } from "react-router-dom";
import { accounts, Client, transactions } from "@tikz/hedera-mirror-node-ts";
import { AccountId, TransferTransaction, PublicKey, Status,Hbar,TokenId,NftId } from "@hashgraph/sdk";
import { executeTransaction } from "@/hashconnect"

export const getAccountInfoAPISchema = z.object( {
  network: z.enum( [ 'testnet', 'mainnet' ] ).default( 'testnet' ),
  accountId: z.string().describe( "User provided account id. If not provided, the connected account will be used." )
} )

export const getAccountInfoAPI = async ( params: z.infer<typeof getAccountInfoAPISchema> ): Promise<HederaAPIsResponse> =>
{
  try
  {
    const client = new Client( `https://${params.network}.mirrornode.hedera.com` )
    const { accounts: acc } = await accounts( client ).setAccountId( params.accountId ).get()
    console.log( acc, params )
    let response = null
    let error = null
    if ( acc.length > 0 ) response = acc[ 0 ]
    else error = "Couldn't find any account"
    return {
      response,
      error
    }
  } catch ( err: any )
  {
    console.error( err );
    alert( "Error while interacting with the snap: " + err.message || err );
    return {
      response: null,
      error: err.message
    }
  }
}

export const getTransactionsAPISchema = z.object( {
  network: z.enum( [ 'testnet', 'mainnet' ] ).default( 'testnet' ),
  transactionId: z.string().describe( "User provided transaction Id" ).optional(), 
  accountId: z.string().describe( "User provided account id" ).optional().optional(),
  limit:z.number().describe("number of results to return").default(5).optional(),
  result:z.enum(["success","fail"]).describe("Weather to return failed success txns").optional()
} )

export const getTransactionsAPI = async ( params: z.infer<typeof getTransactionsAPISchema> ): Promise<HederaAPIsResponse> =>
{
  try
  {
    const client = new Client( `https://${params.network}.mirrornode.hedera.com` )
    const transactionsCursor = transactions( client ).order( "desc" ).setLimit( 5 )
    if ( params.accountId ) transactionsCursor.setAccountId( params.accountId )
    if ( params.transactionId ) transactionsCursor.setTransactionId( params.transactionId )
    if(params.limit) transactionsCursor.setLimit(params.limit)
    if(params.result) transactionsCursor.setResult(params.result)

    const { transactions: txns } = await transactionsCursor.get()
    return {
      response: {
        transactions: txns
      },
      error: null
    }
  } catch ( err: any )
  {
    console.error( err );
    alert( "Error while interacting with the snap: " + err.message || err );
    return {
      response: null,
      error: err.message
    }
  }
}

export const transferCryptoAPISchema = z.object({
  network: z.enum(['testnet', 'mainnet']).default('testnet'),
  transfers: z.array(
    z.object({
      assetType: z.enum(["HBAR", "TOKEN", "NFT"]).optional().default("HBAR"),
      to: z.string().describe("Receiver's account Id"),
      amount: z.number(),
      assetId: z.string().describe("Asset Id in case asset type is not HBAR, should be assetId/serialNumber for NFT").optional(),
    })
  ),
  memo: z.string().describe("Optional transaction memo, very important when sending assets to exchanges").optional(),
  from: z.string().describe("Sender's account Id, One of connected acountIds"),
});

export const transferCryptoAPI = async (params: z.infer<typeof transferCryptoAPISchema>): Promise<HederaAPIsResponse> => {
  console.log(params);

  try {
    const transaction = new TransferTransaction()
      .setTransactionMemo(params.memo || '');

    for (const transfer of params.transfers) {
      const toAccountId = AccountId.fromString(transfer.to);
      const fromAccountId = AccountId.fromString(params.from);

      switch (transfer.assetType) {
        case 'HBAR':
          transaction.addHbarTransfer(toAccountId, Hbar.fromTinybars(transfer.amount));
          transaction.addHbarTransfer(fromAccountId, Hbar.fromTinybars(-transfer.amount));
          break;
        case 'TOKEN':
          if (!transfer.assetId) throw new Error("Asset ID is required for TOKEN transfers");
          transaction.addTokenTransfer(TokenId.fromString(transfer.assetId), toAccountId, transfer.amount);
          transaction.addTokenTransfer(TokenId.fromString(transfer.assetId), fromAccountId, -transfer.amount);
          break;
        case 'NFT':
          if (!transfer.assetId) throw new Error("Asset ID is required for NFT transfers");
          const [tokenId, serialNumber] = transfer.assetId.split('/');
          if (!serialNumber) throw new Error("Serial number is required for NFT transfers");
          transaction.addNftTransfer(new NftId(TokenId.fromString(tokenId), Number(serialNumber)), fromAccountId,toAccountId);
          break;
      }
    }

    // Get the account ID to use for the transaction
    const accountId = AccountId.fromString(params.from)

    // Send the transaction to the HashPack wallet for signing
    const result = await executeTransaction(transaction, accountId);

    if (result.status === Status.Success) {
      const response = {
        accountId: accountId.toString(),
        receipt: {
          status:result.status.toString()
        }
      };
      return { response: response, error: null };
    }
    return { response: null, error: `An error occurred after executing transaction ${result.status.toString()}` };
  } catch (err: any) {
    console.error(err);
    return { response: null, error: err.message || err };
  }
};

export const transactionSchema: TransformSchema = {
  transactions: ( response: any ) => response.transactions.map( ( tx: any ) => ( {
    timestamp: new Date(parseInt(tx.consensus_timestamp.split(".")[0])*1000).toString(),
    transactionId: tx.transaction_id,
    result: tx.result,
    tokenTransfers: tx.token_transfers.map( ( tokenTransfer: any ) => ( {
      tokenId: tokenTransfer.token_id,
      account: tokenTransfer.account,
      amount: tokenTransfer.amount,
    } ) ),
    transfers: tx.transfers.map( ( transfer: any ) => ( {
      account: transfer.account,
      amount: transfer.amount,
    } ) )
  } ) ),
};


export const sendCryptoSchema: TransformSchema = {
  ...baseResponseSchema,
  receipt: {
    status: 'receipt.status',
  },
  exchangeRate: {
    hbars: 'receipt.exchangeRate.hbars',
    cents: 'receipt.exchangeRate.cents',
  },
};

export const accountInfoSchema: TransformSchema = {
  accountId: 'account',
  evmAddress: 'evm_address',
  balance: 'balance.balance',
  network: 'currentAccount.network',
  accountAlias: 'alias',
  createdTime: 'created_timestamp',
  memo: 'memo',
  keyType: 'key._type',
  publicKey: 'key.key',
  isDeleted: 'deleted',
  maxAutoTokenAssociations: "max_automatic_token_associations",
  stakingInfo: {
    declineStakingReward: 'decline_reward',
    pendingReward: 'pending_reward',
  },
};


const get_transactions_tool = new DynamicStructuredTool( {
  name: "get_transactions_tool",
  description: "Retrives transactions for given accountId and Network",
  func: async ( params ) =>
  {
    const { response, error } = await getTransactionsAPI( params )
    if ( error )
    {
      return JSON.stringify( { error: error } )
    }
    return getTransformedResponse( response, transactionSchema )
  },
  schema: getTransactionsAPISchema
} )
const transfer_crypto_tool = new DynamicStructuredTool( {
  name: "transfer_crypto_tool",
  description: "Sends the assets to the receiver's address from users account. AssetType could be (HBAR|TOKEN|NFT) HBAR is default value, if user wants to send any other asset type they would need to provide the asset id as well.",
  func: async ( params ) =>
  {

    const { response, error } = await transferCryptoAPI( params )
    if ( error )
    {
      console.error( error )
      return JSON.stringify( { error: error } )
    }
    return getTransformedResponse( response, sendCryptoSchema )
  },
  schema: transferCryptoAPISchema
} )


const get_account_info_tool = new DynamicStructuredTool<{ navigate: NavigateFunction }>( {
  name: "get_account_info_tool",
  description: "Get info for user's connected account hedera account or for external account. If user provides account id it would be external otherwise connected account id will be used. Returns Users Public Key as well",
  func: async ( params ) =>
  {
    const { response, error } = await getAccountInfoAPI( params )
    if ( error )
    {
      return JSON.stringify( { error: error } )
    }

    // const resp = transformResponse( response as TypedResponse, accountInfoSchema )
    console.log( response )
    return { content: getTransformedResponse( response, accountInfoSchema ), response }
  },
  schema: getAccountInfoAPISchema,
  afterCallback ( result, context )
  {
    console.log( result, context, "results saved" )
    // console.log(context?.navigate("/login"))
    // if(confirm("Resource created do u wann be redircted?")){
    //   context?.navigate("/login")
    // }else{
    //   result.result = result.result
    // }
  },
} )

export const basicTools = [ get_account_info_tool, get_transactions_tool, transfer_crypto_tool ]