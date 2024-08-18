import { z } from "zod";
import { DynamicStructuredTool } from "../aiUtils";
import { getTransformedResponse, HederaAPIsResponse, TransformSchema, translateFilter } from "./utils";
import { accounts, Client, nftUtils, optionalFilters, TokenTypeFilter, tokenUtils } from "@tikz/hedera-mirror-node-ts";


export const getTokenInfoAPISchema = z.object( {
  network: z.enum( [ 'testnet', 'mainnet' ] ).default( 'testnet' ),
  tokenId: z.string().optional(),
  accountId: z.string().optional(),
} );

export const getTokenInfoAPI = async (
  params: z.infer<typeof getTokenInfoAPISchema>
): Promise<HederaAPIsResponse> =>
{
  console.log( params );
  try
  {
    const client = new Client( `https://${params.network}.mirrornode.hedera.com` )
    const Tokens = tokenUtils( client ).Tokens.order( "desc" )
    if ( params.tokenId ) Tokens.setTokenId( params.tokenId )

    if ( params.accountId ) Tokens.setAccountId( params.accountId )

    const { tokens } = await Tokens.get()
    // const response = { topicMessages: messages }
    return {
      response: tokens,
      error: null
    };
  } catch ( err: any )
  {
    console.error( err );
    alert( "Error while retrieving Token Info: " + err.message || err );
    return {
      response: null,
      error: err.message || err
    };
  }
};

const get_token_info_tool = new DynamicStructuredTool( {
  name: "get_token_info_tool",
  description: "Retrieves general info about a tokenID, if no tokenId is specfied but accountId is then info about all tokens held by the account/associated with account",
  func: async ( params ) =>
  {
    const { response, error } = await getTokenInfoAPI( params );
    if ( error )
    {
      console.error( error );
      return JSON.stringify( { error: error } );
    }
    return JSON.stringify( response );
  },
  schema: getTokenInfoAPISchema
} );

export const getTokenBalancesAPISchema = z.object( {
  network: z.enum( [ 'testnet', 'mainnet' ] ).default( 'testnet' ),
  tokenId: z.string().optional().describe( "" ),
  accountId: z.string().optional().describe( "" ),
  assetType: z.enum( [ "NFT", "TOKEN" ] ).default( "TOKEN" ).describe( "Must be set for NFTs" ),
  accountBalance: z.object( {
    operator: z.enum( [ 'gt', 'gte', 'lt', 'lte', 'ne', 'eq' ] ),
    value: z.union( [ z.string(), z.number() ] ),
  } ).describe( "Filters and Returns Balances for those accounts that pass the threshold balance used for TOKEN" ).optional()
} );


export const getTokenBalancesAPI = async (
  params: z.infer<typeof getTokenBalancesAPISchema>
): Promise<HederaAPIsResponse> =>
{
  console.log( params );
  try
  {
    const client = new Client( `https://${params.network}.mirrornode.hedera.com` )
    if ( params.assetType === "TOKEN" && params.tokenId )
    {
      // get info about all token holders 
      const TokenBalance = tokenUtils( client ).TokenBalance.order( "desc" ).setTokenId( params.tokenId )
      if ( params.accountId ) TokenBalance.setAccountId( params.accountId )
      if ( params.accountBalance )
      {
        delete params.accountId
        const { filter } = translateFilter( params.accountBalance )
        TokenBalance.setAccountBalance( filter )
      }
      const { balances } = await TokenBalance.get()
      // const response = { topicMessages: messages }
      return {
        response: balances,
        error: null
      };
    } else if ( params.assetType === "NFT" && params.tokenId )
    {
      // get info NFT type tokens
      const NFTs = nftUtils( client ).NFTs.setTokenId( params.tokenId )
      if ( params.accountId ) NFTs.setAccountId( params.accountId )

      const { nfts } = await NFTs.get()
      return {
        response: nfts,
        error: null
      };
    } else if ( params.accountId && !params.tokenId )
    {
      const accountBalance = accounts( client ).setAccountId( params.accountId )
      if ( params.accountBalance )
      {
        delete params.accountId
        const { filter } = translateFilter( params.accountBalance )
        accountBalance.setBalance( filter )
      }
      const { accounts: accountBal } = await accountBalance.get()
      if(accountBal.length > 0) return {
        response: accountBal[0].balance,
        error: null
      }
      return {
        response: null,
        error: `No accounts found for accountId ${params.accountId}`
      };
    }
    return {
      response: null,
      error: "Invalid params provided"
    }

  } catch ( err: any )
  {
    console.error( err );
    alert( "Error while retrieving Token Info: " + err.message || err );
    return {
      response: null,
      error: err.message || err
    };
  }
};

const TokenBalanceAPIResponseSchema:TransformSchema = {
  account: "account",
  alias: "alias",
  balance: "balance",
  created_timestamp: "created_timestamp",
  deleted: "boolean",
  key: "key",
  max_automatic_token_associations: "max_automatic_token_associations"
}

const get_token_balances_tool = new DynamicStructuredTool( {
  name: "get_token_balances_tool",
  description:
    `1. Retrieves List of Balances and Owners for provided TokenID, 
  2. If both accountID and tokenId is set then token's balance for that account.
  3. If only accountID is provided, fetches all tokens owned by accountId could be used for both NFTs or Fungible Tokens
  `,
  func: async ( params ) =>
  {
    const { response, error } = await getTokenBalancesAPI( params );
    if ( error )
    {
      console.error( error );
      return JSON.stringify( { error: error } );
    }
    return JSON.stringify( response );
  },
  schema: getTokenBalancesAPISchema
} );

// export const NFTSchema = z.object( {
//   network: z.enum( [ 'testnet', 'mainnet' ] ).default( 'testnet' ),
//   tokenId: z.string(),
//   serialNumber: z.number().describe( "serialNumber of the NFT" ),
//   trackNFT: z.boolean().default( false ).describe( "Toggle this field to get transaction history of this NFT as well" ).optional()
// } );


// export const trackNFTsAPI = async (
//   params: z.infer<typeof NFTSchema>
// ): Promise<HederaAPIsResponse> =>
// {
//   console.log( params );
//   try
//   {
//     const client = new Client( `https://${params.network}.mirrornode.hedera.com` )
//     let response = {} as any;
//     const NFTInfo = nftUtils( client ).NFTInfo.setTokenId( params.tokenId ).setSerialNumber( params.serialNumber )
//     const nftInfo = await NFTInfo.get()
//     nftInfo.metadata = atob( nftInfo.metadata )
//     response[ "nftInfo" ] = nftInfo

//     if ( params.trackNFT )
//     {
//       const NFTH = nftUtils( client ).NFTTransactionHistory.order( "desc" ).setTokenId( params.tokenId ).setSerialNumber( params.serialNumber )
//       const { transactions } = await NFTH.get()
//       response[ "transactions" ] = transactions
//     }

//     return {
//       response: response,
//       error: null
//     }

//   } catch ( err: any )
//   {
//     console.error( err );
//     alert( "Error while retrieving Token Info: " + err.message || err );
//     return {
//       response: null,
//       error: err.message || err
//     };
//   }
// };


// const get_nft_info_tool = new DynamicStructuredTool( {
//   name: "get_nft_info_tool",
//   description: "Retrieves Info about a NFT(DO NOT use this WITHOUT knowing sequenceNumber of the NFT, which could be is found in token_balances for a account) is known, addtionally can be used to get NFT Transaction History",
//   func: async ( params ) =>
//   {
//     const { response, error } = await trackNFTsAPI( params );
//     if ( error )
//     {
//       console.error( error );
//       return JSON.stringify( { error: error } );
//     }
//     return JSON.stringify( response );
//   },
//   schema: NFTSchema
// } );

// 3. Get NFT Info Tool
const getNFTInfoSchema = z.object( {
  network: z.enum( [ 'testnet', 'mainnet' ] ).default( 'testnet' ),
  tokenId: z.string().describe( "Token ID of the NFT" ),
  serialNumber: z.number().optional().describe( "Serial number of the NFT" ),
  accountId: z.string().optional().describe( "Provide account id to get both serial number of NFT and info about the NFT " ),
  includeTransactionHistory: z.boolean().default( false ).describe( "Include transaction history of the NFT" ),
} ).refine( (data) => ( data.serialNumber && !data.accountId ) || ( !data.serialNumber && data.accountId ), {
  message: "Provide either serialNumber or accountId, but not both",
} );

async function getNFTInfoAPI ( params: z.infer<typeof getNFTInfoSchema> ): Promise<HederaAPIsResponse>
{
  try
  {
    const client = new Client( `https://${params.network}.mirrornode.hedera.com` );
    let response: any = {};

    if ( params.accountId )
    {
      // First, get the NFTs owned by the account
      const NFTs = nftUtils( client ).NFTs.setTokenId( params.tokenId ).setAccountId( params.accountId );
      const { nfts } = await NFTs.get();
      response.ownedNFTs = nfts;

      // If there's only one NFT, use its serial number for further queries
      if ( nfts.length === 1 )
      {
        params.serialNumber = nfts[ 0 ].serial_number;
      } else
      {
        // If multiple NFTs, return the list without further queries
        return { response, error: null };
      }
    }

    if ( params.serialNumber )
    {
      const NFTInfo = nftUtils( client ).NFTInfo.setTokenId( params.tokenId ).setSerialNumber( params.serialNumber );
      const nftInfo = await NFTInfo.get();
      nftInfo.metadata = atob( nftInfo.metadata );
      response.nftInfo = nftInfo;
      
      if ( params.includeTransactionHistory )
      {
        const NFTH = nftUtils( client ).NFTTransactionHistory.order( "desc" )
          .setTokenId( params.tokenId )
          .setSerialNumber( params.serialNumber );
        const { transactions } = await NFTH.get();
        response.transactions = transactions;
      }
    }

    return { response, error: null };
  } catch ( err: any )
  {
    console.error( err );
    return { response: null, error: err.message || String( err ) };
  }
}

const getNFTInfoTool = new DynamicStructuredTool( {
  name: "get_nft_info",
  description: "Retrieves info about an NFT. Provide either serialNumber for a specific NFT or accountId to get all NFTs owned by an account for the tokenID. Can optionally include transaction history.",
  schema: getNFTInfoSchema,
  func: async ( params ) =>
  {
    const { response, error } = await getNFTInfoAPI( params );
    return JSON.stringify( error ? { error } : response );
  },
} );

async function test ()
{
  const tokenId = "0.0.4687346"
  const accountId = "0.0.4653631"
  const client = new Client( "https://testnet.mirrornode.hedera.com" )
  // get general info about tokens
  const tokenInfo = tokenUtils( client ).TokenInfo
  // returns tokens owned by all the accounts
  const TokenBalance = tokenUtils( client ).TokenBalance
  // Returns info about token, but if account id is provided it acts like a verfication that if user owns that token there will be a result or else there wont be any result
  const Tokens = tokenUtils( client ).Tokens

  const NFTInfo = nftUtils( client ).NFTInfo
  const NFTs = nftUtils( client ).NFTs
  const NFTHistory = nftUtils( client ).NFTTransactionHistory

  // console.dir( await NFTHistory.setTokenId( tokenId ).setSerialNumber( 2 ).get(), { depth: null } )
  console.dir( await NFTHistory.setTokenId( tokenId ).setSerialNumber( 2 ).get(), { depth: null } )
  // console.dir(await TokenBalance.setTokenId(tokenId).setAccountId(accountId).get(),{depth:null})

}
async function test2 ()
{
  const client = new Client( "https://mainnet.mirrornode.hedera.com" )

  const accountId = "0.0.6734263"
  const tokenId = "0.0.3872504"
  // console.debug((await accounts(client).setAccountId(accountId).get()),{depth:null} )
  console.dir( await tokenUtils( client ).Tokens.setAccountId( accountId ).get() )


  // console.dir(JSON.parse(await get_nft_info_tool.invoke({network:"mainnet",tokenId,serialNumber:337,trackNFT:true})),{depth:null})
  // console.dir(JSON.parse(await get_token_info_tool.invoke({network:"mainnet",tokenId})),{depth:null})

}

if ( import.meta.main )
{
  await test2()
}

export const TokenInfoTools = [ get_token_info_tool, get_token_balances_tool, getNFTInfoTool ] 