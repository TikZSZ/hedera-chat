import { z } from "zod";
import { handleSnapAPIRequest } from "../SnapSDK";
import { DynamicStructuredTool } from "../aiUtils";
import { baseResponseSchema, getExternalAccountParams, getTransformedResponse, HederaAPIsResponse, transformResponse, TransformSchema } from "./utils";
import { Client, tokenUtils } from "@tikz/hedera-mirror-node-ts";

const accountIdMessage = "Do not provide the account ID if user doesn't specify one, we always have user connected wallet."
// Token Create Transaction
export const createTokenAPISchema = z.object( {
  network: z.enum( [ 'testnet', 'mainnet' ] ).default( 'testnet' ),
  assetType: z.enum( [ 'TOKEN', 'NFT' ] ).default( 'TOKEN' ),
  name: z.string().max( 100 ).describe( "Name of token" ),
  symbol: z.string().max( 100 ).describe( "Token Symbol" ),
  decimals: z.number().int().describe( "Will be 0 for NFTs" ),
  initialSupply: z.number().optional().describe( "Must be 0 for NFTs" ),
  supplyType: z.enum( [ 'FINITE', 'INFINITE' ] ).describe( `Specifies the token supply type. Defaults to INFINITE.` ),
  kycPublicKey: z.string().optional().describe( "Key that sets kyc flags" ),
  freezePublicKey: z.string().optional().describe( "The key which can sign to freeze or unfreeze an account for token transactions." ),
  pausePublicKey: z.string().optional().describe( "The key which has the authority to pause or unpause a token. Pausing a token prevents the token from participating in all transactions." ),
  wipePublicKey: z.string().optional().describe( "The key which can wipe the token balance of an account. If empty, wipe is not possible" ),
  supplyPublicKey: z.string().describe( "Must be provided, if user does not provide one, first fetch the pubkey and then use the returned public key" ),
  feeSchedulePublicKey: z.string().optional(),
  freezeDefault: z.boolean().optional(),
  tokenMemo: z.string().optional(),
  accountId: z.string().describe( accountIdMessage ).optional(),
  // customFees: z.array(
  //   z.object( {
  //     feeCollectorAccountId: z.string(),
  //     hbarAmount: z.number().optional(),
  //     tokenAmount: z.number().optional(),
  //     denominatingTokenId: z.string().optional(),
  //     allCollectorsAreExempt: z.boolean().optional(),
  //   } )
  // ).optional(),
  maxSupply: z.number().describe( `For TOKEN - the maximum number of tokens that can be in circulation.
  For NFTs - the maximum number of NFTs (serial numbers) that can be minted. This field can never be changed.
  Must set the supplyType to FINITE if this field is set`).optional(),
} );

export const createTokenAPI = async (
  params: z.infer<typeof createTokenAPISchema>
): Promise<HederaAPIsResponse> =>
{
  const externalAccountParams = getExternalAccountParams( params.accountId )

  console.log( params );

  try
  {
    if ( params.assetType === "NFT" )
    {
      params.decimals = 0
      params.initialSupply = 0
    }
    const response = await handleSnapAPIRequest( {
      request: {
        method: 'hts/createToken',
        params: {
          network: params.network,
          assetType: params.assetType,
          name: params.name,
          symbol: params.symbol,
          decimals: params.decimals,
          supplyType: params.supplyType,
          initialSupply: params.initialSupply,
          kycPublicKey: params.kycPublicKey,
          freezePublicKey: params.freezePublicKey,
          pausePublicKey: params.pausePublicKey,
          wipePublicKey: params.wipePublicKey,
          supplyPublicKey: params.supplyPublicKey,
          feeSchedulePublicKey: params.feeSchedulePublicKey,
          freezeDefault: params.freezeDefault,
          tokenMemo: params.tokenMemo,
          // customFees: params.customFees,
          maxSupply: params.maxSupply,
          // Uncomment the below line if you want to connect 
          // to a non-metamask account
          ...externalAccountParams
        }
      }
    } );

    return {
      response: response,
      error: null
    };
  } catch ( err: any )
  {
    console.error( err );
    alert( "Error while creating token: " + err.message || err );
    return {
      response: null,
      error: err.message || err
    };
  }
};


// Token Mint Transaction
export const mintTokenAPISchema = z.object( {
  network: z.enum( [ 'testnet', 'mainnet' ] ).default( 'testnet' ),
  assetType: z.enum( [ 'TOKEN', 'NFT' ] ).default( 'TOKEN' ),
  tokenId: z.string(),
  accountId: z.string().describe( accountIdMessage ).optional().optional(),
  amount: z.number().describe( "Amount of tokens to mit, should be 0 for NFTs" ).int().optional(),
  metadata: z.array( z.string() ).describe( "No need to pass the metadata for fungible tokens, MUST be passed for NFTs" ).optional(), // Only needed for NFT
} );

export const mintTokenAPI = async (
  params: z.infer<typeof mintTokenAPISchema>
): Promise<HederaAPIsResponse> =>
{
  const externalAccountParams = getExternalAccountParams( params.accountId )
  console.log( params );
  try
  {
    if ( params.assetType === "NFT" )
    {
      delete params.amount
    }
    const response = await handleSnapAPIRequest( {
      request: {
        method: 'hts/mintToken',
        params: {
          network: params.network,
          assetType: params.assetType,
          tokenId: params.tokenId,
          amount: params.amount,
          metadata: params.metadata,
          // Uncomment the below line if you want to connect 
          // to a non-metamask account
          ...externalAccountParams
        }
      }
    } );

    return {
      response: response,
      error: null
    };
  } catch ( err: any )
  {
    console.error( err );
    alert( "Error while minting token: " + err.message || err );
    return {
      response: null,
      error: err.message || err
    };
  }
};

// Token Burn Transaction
export const burnTokenAPISchema = z.object( {
  network: z.enum( [ 'testnet', 'mainnet' ] ).default( 'testnet' ),
  assetType: z.enum( [ 'TOKEN', 'NFT' ] ).default( 'TOKEN' ),
  tokenId: z.string(),
  accountId: z.string().describe( accountIdMessage ).optional(),
  amount: z.number().describe( "Not need for NFTs" ).int().optional(),
  serialNumbers: z.array( z.number() ).describe( "Only needed for NFTs" ).optional(),
} );

export const burnTokenAPI = async (
  params: z.infer<typeof burnTokenAPISchema>
): Promise<HederaAPIsResponse> =>
{

  const externalAccountParams = getExternalAccountParams( params.accountId );
  console.log( params );

  try
  {
    if ( params.assetType === "NFT" )
    {
      delete params.amount
    }
    const response = await handleSnapAPIRequest(
      {
        request: {
          method: 'hts/burnToken',
          params: {
            network: params.network,
            assetType: params.assetType,
            tokenId: params.tokenId,
            amount: params.amount,
            serialNumbers: params.serialNumbers,
            // Uncomment the below line if you want to connect 
            // to a non-metamask account
            ...externalAccountParams
          }
        }
      }
    );
    return {
      response: response,
      error: null
    };
  } catch ( err: any )
  {
    console.error( err );
    alert( "Error while burning token: " + err.message || err );
    return {
      response: null,
      error: err.message || err
    };
  }
};

// Token Associate Transaction
export const associateTokensAPISchema = z.object( {
  network: z.enum( [ 'testnet', 'mainnet' ] ).default( 'testnet' ),
  tokenIds: z.array( z.string() ).min( 1 ).describe( "Array of token IDs to associate with the account" ),
  accountId: z.string().describe( accountIdMessage ).optional(),
} );

export const associateTokensAPI = async (
  params: z.infer<typeof associateTokensAPISchema>
): Promise<HederaAPIsResponse> =>
{

  const externalAccountParams = getExternalAccountParams( params.accountId );
  console.log( params );

  try
  {
    const response = await handleSnapAPIRequest( {
      request: {
        method: 'hts/associateTokens',
        params: {
          network: params.network,
          tokenIds: params.tokenIds,
          // Uncomment the below line if you want to connect 
          // to a non-metamask account
          ...externalAccountParams
        }
      }
    } );

    return {
      response: response,
      error: null
    };
  } catch ( err: any )
  {
    console.error( err );
    alert( "Error while associating tokens: " + err.message || err );
    return {
      response: null,
      error: err.message || err
    };
  }
};




const associateTokensResponseSchema: TransformSchema = {
  ...baseResponseSchema,
  receipt: {
    status: 'receipt.status',
  }
}

const burnTokenResponseSchema: TransformSchema = {
  ...baseResponseSchema,
  receipt: {
    status: 'receipt.status',
  }
}

const mintTokenResponseSchema: TransformSchema = {
  ...baseResponseSchema,
  receipt: {
    status: 'receipt.status',
  }
}

const createTokenResponseSchema: TransformSchema = {
  ...baseResponseSchema,
  receipt: {
    status: 'receipt.status',
    tokenId: "receipt.tokenId"
  }
}

const associate_tokens_tool = new DynamicStructuredTool( {
  name: "associate_tokens_tool",
  description: "Associates one or more tokens with the user's account. Requires an array of token IDs. UserCan optionally specify an account ID to use for association.",
  func: async ( params ) =>
  {
    const { response, error } = await associateTokensAPI( params );
    if ( error )
    {
      console.error( error );
      return JSON.stringify( { error: error } );
    }
    return getTransformedResponse( response, associateTokensResponseSchema );
  },
  schema: associateTokensAPISchema
} );

const burn_token_tool = new DynamicStructuredTool( {
  name: "burn_token_tool",
  description: "Burns tokens or NFTs from an existing token or NFT on the network. Requires token ID and amount. Serial numbers are required only for NFTs.",
  func: async ( params ) =>
  {
    const { response, error } = await burnTokenAPI( params );
    if ( error )
    {
      console.error( error );
      return JSON.stringify( { error: error } );
    }
    return getTransformedResponse( response, burnTokenResponseSchema );
  },
  schema: burnTokenAPISchema
} );

const mint_token_tool = new DynamicStructuredTool( {
  name: "mint_token_tool",
  description: "Mints additional units of an existing token or NFT. Requires token ID and amount. Metadata is required only for minting NFTs.",
  func: async ( params ) =>
  {
    const { response, error } = await mintTokenAPI( params );
    if ( error )
    {
      console.error( error );
      return JSON.stringify( { error: error } );
    }
    return getTransformedResponse( response, mintTokenResponseSchema );
  },
  schema: mintTokenAPISchema
} );

export type Token = Omit<z.infer<typeof createTokenAPISchema>, "accountId"> & { ownerAccountId: string, tokenId: string }

const create_token_tool = new DynamicStructuredTool<{ openAlert?: ( name: string, desc: string, content: string ) => string }>( {
  name: "create_hedera_token",
  description: `Creates a new token or NFT on the Hedera network. 
  IMPORTANT: Requires specific key information. If user doesn't provide keys, you must fetch them first using appropriate tools.
  Always provide supplyPublicKey - fetch user's public key if not given.
  Set supplyType to FINITE if maxSupply is specified.`,
  func: async ( params ) =>
  {
    const { response, error } = await createTokenAPI( params );
    if ( error )
    {
      console.error( error );
      return JSON.stringify( { error: error } );
    }
    return { content: getTransformedResponse( response, createTokenResponseSchema ), artifact: transformResponse( response, createTokenResponseSchema ) };
  },
  schema: createTokenAPISchema,
  afterCallback ( result, input, context )
  {
    console.log( result.artifact, input )
    if ( result.artifact && result.artifact.receipt.tokenId )
    {
      const tokenId = result.artifact.receipt.tokenId as string
      const tokensSTR = localStorage.getItem( "tokens" )
      const tokens: Token[] = tokensSTR ? JSON.parse( tokensSTR ) : []
      delete input.accountId
      const token: Token = {
        ...input,
        tokenId: tokenId,
        ownerAccountId: result.artifact.accountId
      }
      tokens.push( token )
      localStorage.setItem( "tokens", JSON.stringify( tokens ) )
      if ( context && context.openAlert ) context.openAlert( 
        `${token.assetType} Created`, `You can view the token in dashboard`,
        `${token.name} (${token.symbol})\n\n TokenId  *${token.tokenId}*`)
    }
  },
} );

export const TokenTools =
  [
    create_token_tool,
    mint_token_tool,
    associate_tokens_tool,
    burn_token_tool
  ]


if ( import.meta.main )
{
   create_token_tool.afterCallback!( {
    content: "", artifact: {
      ...baseResponseSchema,
      receipt: {
        status: 'SUCCESS',
        tokenId: "0.0.5267"
      }
    }
  }, { assetType: "NFT", decimals: 0, name: "Test Token", symbol: "TT", network: "testnet", supplyPublicKey: "sk___", supplyType: "FINITE" } )
}
