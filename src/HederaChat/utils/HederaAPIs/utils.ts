// const baseApi = async ( params: { transaction_Id?: string } ) =>
// {
//   try
//   {
//     const response = await handleSnapAPIRequest( {
//       request: {
//         method: 'getTransactions',
//         params: {}
//       }
//     } )
//     const response_str = JSON.stringify( response, null, 4 );
//     console.log( "response: ", response_str );
//     return response_str
//   } catch ( err: any )
//   {
//     console.error( err );
//     alert( "Error while interacting with the snap: " + err.message || err );
//     return err.message
//   }

import { optionalFilters } from "@tikz/hedera-mirror-node-ts";

// }
export const baseResponseSchema: TransformSchema = {
  accountId: 'currentAccount.hederaAccountId',
  network: 'currentAccount.network',
  balance: 'currentAccount.balance.hbars',
}
export type TransformSchema = {
  [ key: string ]: string | TransformSchema | ( ( value: any ) => any );
};

type TransformFunction = ( response: any, schema: TransformSchema ) => any;

export const transformResponse: TransformFunction = ( response, schema ): Record<string, any> =>
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

export function getExternalAccountParams ( accountId?: string | null )
{
  const externalAccountParams = accountId
    ? {
      externalAccount: {
        accountIdOrEvmAddress: accountId,
        curve: 'ED25519'
      }
    }
    : {}
  return externalAccountParams
}

export function getTransformedResponse ( response: Record<string, any> | null, schema: TransformSchema )
{
  const transformedResp = transformResponse( response, schema )
  return "```json" + JSON.stringify( transformedResp, null, 4 ) + "`"
}

export interface HederaAPIsResponse
{
  response: Record<string, any> | null,
  error: string | null
}
type Operator = 'gt' | 'gte' | 'lt' | 'lte' | 'ne' | 'eq'
export function translateFilter ( filter: { operator: Operator, value: string | number } )
{
  const operatorMap = {
    gt: 'greaterThan',
    gte: 'greaterThanEqualTo',
    lt: 'lessThan',
    lte: 'lessThanEqualTo',
    ne: 'notEqualTo',
    eq: 'equalTo',
  } as Record<Operator, keyof typeof optionalFilters>;

  const {  operator, value } = filter;
  const methodName = operatorMap[ operator ];

  return {
    filter: optionalFilters[ methodName ]( value ),
  };
}
