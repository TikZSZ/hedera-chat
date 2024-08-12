import { handleSnapAPIRequest } from "../SnapSDK";

interface Response {
  response:Record<string,any>|null,
  error:string|null
}

export const getAccountInfoAPI = async (params:{account_id?:string}):Promise<Response> => {
  try {
    const response = await handleSnapAPIRequest({
        request: {
          method: 'getAccountInfo',
          params: {
            network: 'testnet',
            mirrorNodeUrl: 'https://testnet.mirrornode.hedera.com',
            // Pass 'accountId' is useful if you want to retrieve account info 
            // for someone else rather than yourself
            accountId: params.account_id, 
          }
        }
    })
    return {
      response:response,
      error:null
    }
  } catch (err:any) {
    console.error(err);
    alert("Error while interacting with the snap: " + err.message || err);
    return {
      response:null,
      error:err.message
    }
  }
}

export const getTransactionsAPI = async (params:{transaction_Id?:string}):Promise<Response> => {
  try{
    const response = await handleSnapAPIRequest({
      request: {
        method: 'getTransactions',
        params: {
          network: 'testnet',
          transactionId: params.transaction_Id,
        }
      }
    })
    return {
      response:response,
      error:null
    }
  }catch(err:any){
    console.error(err);
    alert("Error while interacting with the snap: " + err.message || err);
    return {
      response:null,
      error:err.message
    }
  }
}

export const transferCryptoAPI = async (params:{assetType?:string,to:string,amount:number,assetId?:string,memo?:string}):Promise<Response> => {

  console.log(params)

  const transfers = [
    {
      assetType: params.assetType || "HBAR", // 'HBAR' | 'TOKEN' | 'NFT'
      to: params.to,
      amount: params.amount,
      assetId:params.assetId, // You must pass in a Token ID or NFT Id for transferring tokens 
    }
  ]
  const memo = params.memo 
  try{
    const response = await handleSnapAPIRequest({
      request: {
        method: 'transferCrypto',
        params: {
          network: 'testnet',
          transfers,
          memo,
          maxFee: undefined
          /* 
            Uncomment the below line if you want to connect 
            to a non-metamask account
          */
          // ...externalAccountParams
        }
      }
    })
    return {
      response:response,
      error:null
    }
  }catch(err:any){
    console.error(err);
    alert("Error while interacting with the snap: " + err.message || err);
    return {
      response:null,
      error:null
    }
  }
}

const baseApi = async (params:{transaction_Id?:string}) => {
  try{
    const response = await handleSnapAPIRequest({
      request: {
        method: 'getTransactions',
        params: {}
      }
    })
    const response_str = JSON.stringify(response, null, 4);
    console.log("response: ", response_str);
    return response_str
  }catch(err:any){
    console.error(err);
    alert("Error while interacting with the snap: " + err.message || err);
    return err.message
  }
}

export type TransformSchema = {
  [ key: string ]: string | TransformSchema | ( ( value: any ) => any );
};

type TransformFunction = ( response: any, schema: TransformSchema ) => any;

export const transformResponse: TransformFunction = ( response, schema ):Record<string,any> =>
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

export const transactionSchema: TransformSchema = {
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


export const sendCryptoSchema: TransformSchema = {
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

export const accountInfoSchema: TransformSchema = {
  accountId: 'currentAccount.hederaAccountId',
  evmAddress: 'currentAccount.hederaEvmAddress',
  metamaskEvmAddress: 'currentAccount.metamaskEvmAddress',
  balance: 'currentAccount.balance.hbars',
  network: 'currentAccount.network',
  accountAlias: 'accountInfo.alias',
  createdTime: 'accountInfo.createdTime',
  expirationTime: 'accountInfo.expirationTime',
  memo: 'accountInfo.memo',
  keyType: 'accountInfo.key.type',
  publicKey: 'accountInfo.key.key',
  autoRenewPeriod: 'accountInfo.autoRenewPeriod',
  isDeleted: 'accountInfo.isDeleted',
  stakingInfo: {
    declineStakingReward: 'accountInfo.stakingInfo.declineStakingReward',
    pendingReward: 'accountInfo.stakingInfo.pendingReward',
    stakedToMe: 'accountInfo.stakingInfo.stakedToMe',
  },
};
