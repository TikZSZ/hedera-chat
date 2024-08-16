import { z } from "zod";
import { handleSnapAPIRequest } from "../SnapSDK";
import { DynamicStructuredTool } from "../aiUtils";
import { baseResponseSchema, getExternalAccountParams, getTransformedResponse, HederaAPIsResponse, TransformSchema } from "./utils";

export const initiateSwapAPISchema = z.object( {
  network: z.enum( [ 'testnet', 'mainnet' ] ).default( 'testnet' ),
  atomicSwaps: z.array(
    z.object( {
      requester: z.object( {
        assetType: z.enum( [ 'HBAR', 'TOKEN', 'NFT' ] ),
        to: z.string(),
        amount: z.number().int(),
      } ),
      responder: z.object( {
        assetType: z.enum( [ 'HBAR', 'TOKEN', 'NFT' ] ),
        amount: z.number().int(),
        assetId: z.string().optional(), // For NFT, format is tokenId/serialNumber
      } )
    } ).describe( "Both the requester and responder must be passed" )
  ).describe( "You can have multiple atomic swaps as part of the same transaction with multiple requester and responder" ),
  memo: z.string().optional().describe( "Optional transaction memo" ),
  maxFee: z.number().optional().describe( "Optional max fee in hbars" ),
  accountId: z.string().describe( "Account ID user wants to use for the transaction" ).optional(),
} );

export const initiateSwapAPI = async (
  params: z.infer<typeof initiateSwapAPISchema>
): Promise<HederaAPIsResponse> =>
{

  const externalAccountParams = getExternalAccountParams( params.accountId );
  console.log( params );

  try
  {
    const response = await handleSnapAPIRequest( {
      request: {
        method: 'hts/initiateSwap',
        params: {
          network: params.network,
          atomicSwaps: params.atomicSwaps,
          memo: params.memo,
          maxFee: params.maxFee,
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
    alert( "Error while initiating swap: " + err.message || err );
    return {
      response: null,
      error: err.message || err
    };
  }
};

export const completeSwapAPISchema = z.object( {
  network: z.enum( [ 'testnet', 'mainnet' ] ).default( 'testnet' ),
  scheduleId: z.string().describe( "Schedule ID of the swap to complete" ),
  accountId: z.string().describe( "Account ID user wants to use for the transaction" ).optional(),
} );

export const completeSwapAPI = async (
  params: z.infer<typeof completeSwapAPISchema>
): Promise<HederaAPIsResponse> =>
{

  const externalAccountParams = getExternalAccountParams( params.accountId );
  console.log( params );

  try
  {
    const response = await handleSnapAPIRequest( {
      request: {
        method: 'hts/completeSwap',
        params: {
          network: params.network,
          scheduleId: params.scheduleId,
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
    alert( "Error while completing swap: " + err.message || err );
    return {
      response: null,
      error: err.message || err
    };
  }
};

export const initiateSwapResponseSchema: TransformSchema = {
  ...baseResponseSchema,
  receipt: {
    status: 'receipt.status',
    scheduleId: 'receipt.scheduleId',
    scheduledTransactionId:"receipt.scheduledTransactionId"
  }
};

export const completeSwapResponseSchema: TransformSchema = {
  ...baseResponseSchema,
  receipt: {
    status: 'receipt.status',
    scheduledTransactionId:"receipt.scheduledTransactionId"
  }
};

const initiate_swap_tool = new DynamicStructuredTool( {
  name: "initiate_swap_tool",
  description: "Initiates an atomic swap between two parties, with specified assets and amounts. Swap cannot be initiated with the same token. So, for example, requester cannot try to swap 1 Hbar with the responder for 10 Hbar",
  func: async ( params ) =>
  {
    const { response, error } = await initiateSwapAPI( params );
    if ( error )
    {
      console.error( error );
      return JSON.stringify( { error: error } );
    }
    return getTransformedResponse( response, initiateSwapResponseSchema );
  },
  schema: initiateSwapAPISchema
} );


const complete_swap_tool = new DynamicStructuredTool({
  name: "complete_swap_tool",
  description: "Completes a previously initiated atomic swap using a schedule ID.",
  func: async (params) => {
    const { response, error } = await completeSwapAPI(params);
    if (error) {
      console.error(error);
      return JSON.stringify({ error: error });
    }
    return getTransformedResponse(response, completeSwapResponseSchema);
  },
  schema: completeSwapAPISchema
});

export const SwapTools =
  [
    initiate_swap_tool,
    complete_swap_tool,
  ]

