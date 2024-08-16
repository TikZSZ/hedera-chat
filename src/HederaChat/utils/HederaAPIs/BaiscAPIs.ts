import z from "zod";
import { handleSnapAPIRequest } from "../SnapSDK";
import { DynamicStructuredTool } from "../aiUtils";
import { baseResponseSchema, getExternalAccountParams, getTransformedResponse, HederaAPIsResponse, TransformSchema } from "./utils";


export const getAccountInfoAPISchema = z.object( {
  accountId: z.string().describe( "User provided account id. If not provided, the connected account will be used." ).optional()
} )

export const getAccountInfoAPI = async ( params: z.infer<typeof getAccountInfoAPISchema> ): Promise<HederaAPIsResponse> =>
{
  const externalAccountParams = getExternalAccountParams( params.accountId )
  try
  {
    const response = await handleSnapAPIRequest( {
      request: {
        method: 'getAccountInfo',
        params: {
          network: 'testnet',
          mirrorNodeUrl: 'https://testnet.mirrornode.hedera.com',
          // Pass 'accountId' is useful if you want to retrieve account info 
          // for someone else rather than yourself
          accountId: params.accountId,
          ...externalAccountParams
        }
      }
    } )
    return {
      response: response,
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

export const getTransactionsAPISchema = z.object( {
  transactionId: z.string().describe( "User provided transaction Id" ).optional(), accountId: z.string().describe( "User provided account id" ).optional().optional()
} )

export const getTransactionsAPI = async ( params: z.infer<typeof getTransactionsAPISchema> ): Promise<HederaAPIsResponse> =>
{
  const externalAccountParams = getExternalAccountParams( params.accountId )
  try
  {
    const response = await handleSnapAPIRequest( {
      request: {
        method: 'getTransactions',
        params: {
          network: 'testnet',
          transactionId: params.transactionId,
          ...externalAccountParams
        }
      }
    } )
    return {
      response: response,
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

export const transferCryptoAPISchema = z.object( {
  assetType: z.enum( [ "HBAR", "TOKEN", "NFT" ] ).optional().default( "HBAR" ),
  to: z.string().describe( "Reciver's account Id" ),
  from: z.string().describe( "Senders account Id, use this incase user specifies a particular account they want to use" ).optional(),
  amount: z.number(),
  assetId: z.string().describe( "Asset Id in case asset type is not HBAR" ).optional(),
  memo: z.string().describe( "Optional transaction memo, very important when sending assets to exchanges" ).optional()
} )

export const transferCryptoAPI = async ( params: z.infer<typeof transferCryptoAPISchema> ): Promise<HederaAPIsResponse> =>
{

  console.log( params )
  const externalAccountParams = params.from
    ? {
      externalAccount: {
        accountIdOrEvmAddress: params.from,
        curve: 'ED25519'
      }
    }
    : {};

  const transfers = [
    {
      assetType: params.assetId || "HBAR", // 'HBAR' | 'TOKEN' | 'NFT'
      to: params.to,
      amount: params.amount,
      assetId: params.assetId, // You must pass in a Token ID or NFT Id for transferring tokens 
    }
  ]
  const memo = params.memo
  try
  {
    const response = await handleSnapAPIRequest( {
      request: {
        method: 'transferCrypto',
        params: {
          network: 'testnet',
          transfers,
          memo,
          maxFee: undefined,
          /* 
            Uncomment the below line if you want to connect 
            to a non-metamask account
          */
          ...externalAccountParams
        }
      }
    } )
    return {
      response: response,
      error: null
    }
  } catch ( err: any )
  {
    console.error( err );
    alert( "Error while interacting with the snap: " + err.message || err );
    return {
      response: null,
      error: null
    }
  }
}


export const transactionSchema: TransformSchema = {
  ...baseResponseSchema,
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
  accountId: 'currentAccount.hederaAccountId',
  evmAddress: 'currentAccount.hederaEvmAddress',
  metamaskEvmAddress: 'currentAccount.metamaskEvmAddress',
  balance: 'currentAccount.balance.hbars',
  network: 'currentAccount.network',
  accountAlias: 'accountInfo.alias',
  createdTime: 'accountInfo.createdTime',
  memo: 'accountInfo.memo',
  keyType: 'accountInfo.key.type',
  publicKey: 'accountInfo.key.key',
  isDeleted: 'accountInfo.isDeleted',
  stakingInfo: {
    declineStakingReward: 'accountInfo.stakingInfo.declineStakingReward',
    pendingReward: 'accountInfo.stakingInfo.pendingReward',
    stakedToMe: 'accountInfo.stakingInfo.stakedToMe',
  },
};

const get_transactions_tool = new DynamicStructuredTool( {
  name: "get_transactions_tool",
  description: "Retrieves transaction info for user's connected hedera account. Transaction id could be provided to get infomration about a particular transaction",
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


const get_account_info_tool = new DynamicStructuredTool( {
  name: "get_account_info_tool",
  description: "Get info for user's connected account hedera account or for external account. If user provides account id it would be external otherwise connected account id will be used. Returns Users Public Key as well",
  func: async ( params ) =>
  {
    const { response, error } = await getAccountInfoAPI( params )
    if ( error )
    {
      return JSON.stringify( { error: error } )
    }
    return getTransformedResponse( response, accountInfoSchema )
  },
  schema: getAccountInfoAPISchema
} )

export const basicTools = [ get_account_info_tool, get_transactions_tool, transfer_crypto_tool ]