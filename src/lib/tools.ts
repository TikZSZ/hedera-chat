import { z } from "zod";
import { DynamicStructuredTool } from "./aiUtils";
import { accountInfoSchema, getAccountInfoAPI, getTransactionsAPI, sendCryptoSchema, transactionSchema, transferCryptoAPI, transformResponse, TransformSchema } from "./hederaUtils";

const get_delivery_date = ( params: Record<string, any> ) =>
{
  const delivery_date = new Date().toISOString();
  return JSON.stringify( {
    order_id: params.order_id,
    delivery_date: delivery_date,
  } );
}

function getTransformedResponse ( response: Record<string, any> | null, schema: TransformSchema )
{
  const transformedResp = transformResponse( response, schema )
  return "```json" + JSON.stringify( transformedResp, null, 4 ) + "`"
}

const get_delivery_date_tool = new DynamicStructuredTool( {
  description: "Get the delivery date for a customer's order. Call this whenever you need to know the delivery date, for example when a customer asks 'Where is my package'",
  func: get_delivery_date,
  schema: z.object( {
    order_id: z.string().describe( "The customer's order ID." )
  } )
} )


const get_transactions_tool = new DynamicStructuredTool( {
  name: "get_transactions_tool",
  description: "Retrieves transaction info for user's connected hedera account. Transaction id could be provided to get infomration about a particular transaction",
  func: async ( params: Parameters<typeof getTransactionsAPI>[ 0 ] ) =>
  {
    const { response, error } = await getTransactionsAPI( params )
    if ( error )
    {
      return JSON.stringify( { error: error } )
    }
    return getTransformedResponse( response, transactionSchema )
  },
  schema: z.object( {
    transaction_Id: z.string().describe( "User provided transaction Id" ).optional()
  } )
} )
const transfer_crypto_tool = new DynamicStructuredTool( {
  name: "transfer_crypto_tool",
  description: "Sends the assets to the receiver's address from users account. AssetType could be (HBAR|TOKEN|NFT) HBAR is default value, if user wants to send any other asset type they would need to provide the asset id as well.",
  func: async ( params: Parameters<typeof transferCryptoAPI>[ 0 ] ) =>
  {
    const { response, error } = await transferCryptoAPI( params )
    if ( error )
    {
      return JSON.stringify( { error: error } )
    }
    return getTransformedResponse( response, sendCryptoSchema )
  },
  schema: z.object( {
    assetType: z.enum( [ "HBAR", "TOKEN", "NFT" ] ).optional().default( "HBAR" ),
    to: z.string().describe( "Reciver's account id" ),
    amount: z.number(),
    assetId: z.string().describe( "Asset Id in case asset type is not HBAR" ).optional(),
    memo: z.string().describe( "Optional transaction memo, very important when sending assets to exchanges" ).optional()
  } )
} )


const get_account_info_tool = new DynamicStructuredTool( {
  name: "get_account_info_tool",
  description: "Get info for user's connected account hedera account or for external account. If user provides account id it would be external otherwise connected account id will be used",
  func: async ( params: Parameters<typeof getAccountInfoAPI>[ 0 ] ) =>
  {
    const { response, error } = await getAccountInfoAPI( params )
    if ( error )
    {
      return JSON.stringify( { error: error } )
    }
    return getTransformedResponse( response, accountInfoSchema )
  },
  schema: z.object( {
    account_id: z.string().describe( "User provided account id" ).optional()
  } )
} )



// console.dir(get_account_info_tool.toolDef,{depth:null})
// console.log(get_account_info_tool.invoke({account_id:"0.0.5"}))

export const tools = [ get_account_info_tool, get_transactions_tool, transfer_crypto_tool ]

if ( import.meta.main )
{
  const tool_defs_map = tools.map( ( tool ) => tool.toolDef );
  console.dir( tool_defs_map, { depth: null } )
}