import { z } from "zod";
import { handleSnapAPIRequest } from "../SnapSDK";
import { DynamicStructuredTool } from "../aiUtils";
import { baseResponseSchema, getExternalAccountParams, getTransformedResponse, HederaAPIsResponse, transformResponse, TransformSchema } from "./utils";
import { AccountId, TokenCreateTransaction, TokenType, TokenSupplyType, PublicKey, Status, TokenMintTransaction,TokenBurnTransaction,TokenId,TokenAssociateTransaction } from "@hashgraph/sdk";
import { executeTransaction } from "@/hashconnect"

import { Client, tokenUtils } from "@tikz/hedera-mirror-node-ts";
import { Models } from "appwrite";
import { appwriteService } from "@/appwrite/config";
const accountIdMessage = "One of user connected accounts"
// Token Create Transaction
export const createTokenAPISchema = z.object( {
  network: z.enum( [ 'testnet', 'mainnet' ] ).default( 'testnet' ).describe("Used to identify where token belongs to"),
  assetType: z.enum( [ 'TOKEN', 'NFT' ] ),
  name: z.string().max( 100 ).describe( "Name of token" ),
  symbol: z.string().max( 100 ).describe( "Token Symbol" ),
  decimals: z.number().int().max(18).describe( "number of decimal places the token can have" ).default(8),
  initialSupply: z.number().optional().describe("Only applicable for TOKEN Number of tokens minted initially" ),
  supplyType: z.enum( [ 'FINITE', 'INFINITE' ] ).default("INFINITE").describe( `Specifies the token supply type. Defaults to INFINITE` ),
  kycPublicKey: z.string().optional().describe( "Key that sets kyc flags" ),
  freezePublicKey: z.string().optional().describe( "The key which can sign to freeze or unfreeze an account for token transactions." ),
  pausePublicKey: z.string().optional().describe( "The key which has the authority to pause or unpause a token. Pausing a token prevents the token from participating in all transactions." ),
  wipePublicKey: z.string().optional().describe( "The key which can wipe the token balance of an account. If empty, wipe is not possible" ),
  supplyPublicKey: z.string().describe( "Must be provided, if user does not provide one, first fetch the pubkey and then use the returned public key" ),
  // adminPublicKey: z.string().describe( "Allows Changing keys and metadata of token" ).optional(),
  // feeSchedulePublicKey: z.string().optional(),
  freezeDefault: z.boolean().optional(),
  tokenMemo: z.string().optional(),
  // metadata: z.string().describe( "Metadata to be attached to the token" ).optional(),
  accountId: z.string().describe( "One of user connected accounts" ),
  maxSupply: z.number().describe( `Max Tokens that can ever be minted for NFTs and max tokens in circulation for TOKENs`).optional(),
} ).refine((args) => args.supplyType === "FINITE" && args.maxSupply,{message:"You must provide maxSupply when supplyType is set FINITE"});

// export const createTokenAPI = async (
//   params: z.infer<typeof createTokenAPISchema>
// ): Promise<HederaAPIsResponse> =>
// {
//   const externalAccountParams = getExternalAccountParams( params.accountId )

//   console.log( params );

//   try
//   {
//     if ( params.assetType === "NFT" )
//     {
//       params.decimals = 0
//       params.initialSupply = 0
//     }
//     const response = await handleSnapAPIRequest( {
//       request: {
//         method: 'hts/createToken',
//         params: {
//           network: params.network,
//           assetType: params.assetType,
//           name: params.name,
//           symbol: params.symbol,
//           decimals: params.decimals,
//           supplyType: params.supplyType,
//           initialSupply: params.initialSupply,
//           kycPublicKey: params.kycPublicKey,
//           freezePublicKey: params.freezePublicKey,
//           pausePublicKey: params.pausePublicKey,
//           wipePublicKey: params.wipePublicKey,
//           supplyPublicKey: params.supplyPublicKey,
//           feeSchedulePublicKey: params.feeSchedulePublicKey,
//           freezeDefault: params.freezeDefault,
//           tokenMemo: params.tokenMemo,
//           // customFees: params.customFees,
//           maxSupply: params.maxSupply,
//           // Uncomment the below line if you want to connect 
//           // to a non-metamask account
//           ...externalAccountParams
//         }
//       }
//     } );

//     return {
//       response: response,
//       error: null
//     };
//   } catch ( err: any )
//   {
//     console.error( err );
//     alert( "Error while creating token: " + err.message || err );
//     return {
//       response: null,
//       error: err.message || err
//     };
//   }
// };


// Token Mint Transaction

const stringToUtf8Array = ( str: string ): Uint8Array =>
{
  return new TextEncoder().encode( str );
};

export const createTokenAPI = async ( params: z.infer<typeof createTokenAPISchema> ): Promise<HederaAPIsResponse> =>
{
  console.log( params );
  try
  {
    if ( params.assetType === "NFT" )
    {
      params.decimals = 0;
      params.initialSupply = 0;
    }
    const accountId = AccountId.fromString( params.accountId )
    // Create a token create transaction
    const transaction = new TokenCreateTransaction()
      .setTokenName( params.name )
      .setTokenSymbol( params.symbol )
      .setDecimals( params.decimals )
      .setInitialSupply( params.initialSupply || 0 )
      .setTreasuryAccountId( accountId )
      .setSupplyKey( PublicKey.fromString( params.supplyPublicKey ) )
      .setTokenType( params.assetType === 'NFT' ? TokenType.NonFungibleUnique : TokenType.FungibleCommon )
      .setSupplyType( params.supplyType === 'FINITE' ? TokenSupplyType.Finite : TokenSupplyType.Infinite );

    // if ( params.metadata ) transaction.setMetadata( stringToUtf8Array( params.metadata ) )
    if ( params.supplyPublicKey ) transaction.setAdminKey( PublicKey.fromString( params.supplyPublicKey ) )
    if ( params.kycPublicKey ) transaction.setKycKey( PublicKey.fromString( params.kycPublicKey ) );
    if ( params.freezePublicKey ) transaction.setFreezeKey( PublicKey.fromString( params.freezePublicKey ) );
    if ( params.pausePublicKey ) transaction.setPauseKey( PublicKey.fromString( params.pausePublicKey ) );
    if ( params.wipePublicKey ) transaction.setWipeKey( PublicKey.fromString( params.wipePublicKey ) );
    // if ( params.feeSchedulePublicKey ) transaction.setFeeScheduleKey( PublicKey.fromString( params.feeSchedulePublicKey ) );
    if ( params.freezeDefault !== undefined ) transaction.setFreezeDefault( params.freezeDefault );
    if ( params.tokenMemo ) transaction.setTokenMemo( params.tokenMemo );
    if ( params.maxSupply !== undefined ) transaction.setMaxSupply( params.maxSupply );

    // Get the current topic and save the transaction to it

    // Send the transaction to the HashPack wallet for signing
    const result = await executeTransaction( transaction, accountId )

    if ( result.status === Status.Success )
    {
      const response = {
        accountId: accountId?.toString(),
        receipt: result.toJSON()
      }
      return { response: response, error: null };
    }
    console.error(result)
    return { response: null, error: `An error occured after executing transaction ${result.status.toString()}` };
  } catch ( err: any )
  {
    console.error( err );
    return { response: null, error: err.message || err };
  }
};

export const mintTokenAPISchema = z.object( {
  // network: z.enum( [ 'testnet', 'mainnet' ] ).default( 'testnet' ),
  assetType: z.enum( [ 'TOKEN', 'NFT' ] ).default( 'TOKEN' ),
  tokenId: z.string(),
  accountId: z.string().describe( accountIdMessage ),
  amount: z.number().describe( "Amount of tokens to mit, should be 0 for NFTs" ).int().optional(),
  metadata: z.array( z.string() ).describe( "No need to pass the metadata for fungible tokens, MUST be passed for NFTs" ).optional(), // Only needed for NFT
} );

export const mintTokenAPI = async (
  params: z.infer<typeof mintTokenAPISchema>
): Promise<HederaAPIsResponse> =>
{
  console.log( params );
  try
  {
    if ( params.assetType === "NFT" )
    {
      delete params.amount;
    }

    // Create a token mint transaction
    const transaction = new TokenMintTransaction()
      .setTokenId( params.tokenId );

    if ( params.assetType === 'TOKEN' )
    {
      transaction.setAmount( params.amount || 0 );
    } else if ( params.assetType === 'NFT' )
    {
      if ( !params.metadata )
      {
        throw new Error( "Metadata is required for minting NFTs" );
      }
      transaction.setMetadata( params.metadata.map( stringToUtf8Array ) );
    }

    // Get the current topic and save the transaction to it
    const accountId = AccountId.fromString( params.accountId )

    // Send the transaction to the HashPack wallet for signing
    const result = await executeTransaction( transaction, accountId );

    if ( result.status === Status.Success )
    {
      const response = {
        accountId: accountId.toString(),
        receipt: {
          status:result.status.toString()
        }
      };
      return { response: response, error: null };
    }
    return { response: null, error: `An error occurred after executing transaction ${result.status.toString()}` };
  } catch ( err: any )
  {
    console.error( err );
    return { response: null, error: err.message || err };
  }
};

// Token Burn Transaction
export const burnTokenAPISchema = z.object( {
  // network: z.enum( [ 'testnet', 'mainnet' ] ).default( 'testnet' ),
  assetType: z.enum( [ 'TOKEN', 'NFT' ] ).default( 'TOKEN' ),
  tokenId: z.string(),
  accountId: z.string().describe( accountIdMessage ),
  amount: z.number().describe( "Not need for NFTs" ).int().optional(),
  serialNumbers: z.array( z.number() ).describe( "Only needed for NFTs" ).optional(),
} );

export const burnTokenAPI = async (
  params: z.infer<typeof burnTokenAPISchema>
): Promise<HederaAPIsResponse> => {
  console.log(params);

  try {
    const transaction = new TokenBurnTransaction()
      .setTokenId(TokenId.fromString(params.tokenId));

    if (params.assetType === "TOKEN") {
      if (params.amount === undefined) {
        throw new Error("Amount is required for burning fungible tokens");
      }
      transaction.setAmount(params.amount);
    } else if (params.assetType === "NFT") {
      if (!params.serialNumbers || params.serialNumbers.length === 0) {
        throw new Error("Serial numbers are required for burning NFTs");
      }
      transaction.setSerials(params.serialNumbers);
    }

    // Get the account ID to use for the transaction
    const accountId = AccountId.fromString(params.accountId)

    // Send the transaction to the HashPack wallet for signing
    const result = await executeTransaction(transaction, accountId);

    if (result.status === Status.Success) {
      const response = {
        accountId: accountId?.toString(),
        receipt: result.toJSON()
      };
      return { response: response, error: null };
    }
    return { response: null, error: `An error occurred after executing transaction ${result.status.toString()}` };
  } catch (err: any) {
    console.error(err);
    return { response: null, error: err.message || err };
  }
};

// Token Associate Transaction
export const associateTokensAPISchema = z.object( {
  // network: z.enum( [ 'testnet', 'mainnet' ] ).default( 'testnet' ),
  tokenIds: z.array( z.string() ).min( 1 ).describe( "Array of token IDs to associate with the account" ),
  accountId: z.string().describe( accountIdMessage ),
} );

export const associateTokensAPI = async (
  params: z.infer<typeof associateTokensAPISchema>
): Promise<HederaAPIsResponse> =>
{
  console.log(params);

  try {
    const transaction = new TokenAssociateTransaction()
      .setTokenIds(params.tokenIds.map(id => TokenId.fromString(id)));

    // Get the account ID to use for the transaction
    const accountId = params.accountId ? AccountId.fromString(params.accountId) : undefined;

    if (accountId) {
      transaction.setAccountId(accountId);
    }

    // Send the transaction to the HashPack wallet for signing
    const result = await executeTransaction(transaction, accountId);

    if (result.status === Status.Success) {
      const response = {
        accountId: accountId?.toString(),
        receipt: result.toJSON()
      };
      return { response: response, error: null };
    }
    return { response: null, error: `An error occurred after executing transaction ${result.status.toString()}` };
  } catch (err: any) {
    console.error(err);
    return { response: null, error: err.message || err };
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
    // return getTransformedResponse( response, mintTokenResponseSchema );
    return ` \`\`\`json\n${JSON.stringify(response)}\n\`\`\``
  },
  schema: mintTokenAPISchema
} );

export type Token = Omit<z.infer<typeof createTokenAPISchema>, "accountId"> & { ownerAccountId: string, tokenId: string }

const create_token_tool = new DynamicStructuredTool<{ openAlert?: ( name: string, desc: string, content: string ) => string,user:Models.User<Models.Preferences> }>( {
  name: "create_hedera_token",
  description: `Creates a new TOKEN or NFT on the Hedera network. 
  IMPORTANT: Requires specific key information. If user doesn't provide keys, you must fetch them first using appropriate tools.
  Always provide supplyPublicKey - fetch user's public key if not given.
  Ask user about supplyType and maxSupply if it can't be infered from user query. Ask if your confused`,
  func: async ( params ) =>
  {
    const { response, error } = await createTokenAPI( params );
    if ( error )
    {
      console.error( error );
      return JSON.stringify( { error: error } );
    }
    return { content: ` \`\`\`json\n${JSON.stringify(response)}\n\`\`\``, artifact: response };
  },
  schema: createTokenAPISchema,
  afterCallback: async ( result, input:z.infer<typeof createTokenAPISchema>, context )=>
  {
    console.log( result.artifact, input,context )
    try{
      if ( result.artifact && result.artifact.receipt.tokenId )
        {
          const tokenId = result.artifact.receipt.tokenId as string
          const inputs = {...input}
          // @ts-ignore
          delete inputs.accountId
          const token: Token = {
            ...inputs,
            tokenId: tokenId,
            ownerAccountId: result.artifact.accountId
          }
          if(context && context.user){
            await appwriteService.createTokenDocument(token,context.user.$id)
          }
          // const tokenId = result.artifact.receipt.tokenId as string
          // const tokensSTR = localStorage.getItem( "tokens" )
          // const tokens: Token[] = tokensSTR ? JSON.parse( tokensSTR ) : []
          // delete input.accountId
          // const token: Token = {
          //   ...input,
          //   tokenId: tokenId,
          //   ownerAccountId: result.artifact.accountId
          // }
          // tokens.push( token )[0.0.4688223](/dashboard/tokens/0.0.4688223)
          // localStorage.setItem( "tokens", JSON.stringify( tokens ) )
          if ( context && context.openAlert ) context.openAlert(
            `${token.assetType} Created`, `You can view the token in dashboard`,
            `${token.name} (${token.symbol})\n\n TokenId  [${token.tokenId}](/dashboard/tokens/${token.tokenId})` )
        }
    }catch(err){
      console.error(err)
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
