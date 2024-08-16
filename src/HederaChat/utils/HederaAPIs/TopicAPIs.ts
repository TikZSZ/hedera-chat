import { z } from "zod";
import { baseResponseSchema, getExternalAccountParams, getTransformedResponse, HederaAPIsResponse, TransformSchema } from "./utils";
import { handleSnapAPIRequest } from "../SnapSDK";
import { DynamicStructuredTool } from "../aiUtils";
import { Client, topicMessages } from "@tikz/hedera-mirror-node-ts";
import { client } from "@/HederaChat/mirror-node";

const createTopicAPISchema = z.object( {
  network: z.enum( [ 'testnet', 'mainnet' ] ).default( 'testnet' ),
  memo: z.string().optional().describe( "Optional topic memo" ),
  adminKey: z.string().optional().describe( "Optional admin key required to be able to update the topic in the future. " ),
  submitKey: z.string().optional().describe( "Optional submit key, If key is not set topic will be public." ),
  // autoRenewPeriod: z.number().optional().describe("Optional auto-renew period in seconds"),
  // autoRenewAccount: z.string().optional().describe("Optional auto-renew account ID"),
  accountId: z.string().describe( "Account ID user wants to use for the transaction" ).optional(),
} );

const createTopicAPI = async (
  params: z.infer<typeof createTopicAPISchema>
): Promise<HederaAPIsResponse> =>
{

  const externalAccountParams = getExternalAccountParams( params.accountId );
  console.log( params );

  try
  {
    const response = await handleSnapAPIRequest( {
      request: {
        method: 'hcs/createTopic',
        params: {
          network: params.network,
          memo: params.memo,
          adminKey: params.adminKey,
          submitKey: params.submitKey,
          // autoRenewPeriod: params.autoRenewPeriod,
          // autoRenewAccount: params.autoRenewAccount,
          // Uncomment the below line if you want to connect 
          // to a non-metamask account
          ...externalAccountParams
        }
      }
    } );
    console.debug( response )
    return {
      response: response,
      error: null
    };
  } catch ( err: any )
  {
    console.error( err );
    alert( "Error while creating topic: " + err.message || err );
    return {
      response: null,
      error: err.message || err
    };
  }
};

export const updateTopicAPISchema = z.object( {
  network: z.enum( [ 'testnet', 'mainnet' ] ).default( 'testnet' ),
  topicId: z.string().describe( "Topic ID to update" ),
  memo: z.string().optional().describe( "Optional topic memo" ),
  // expirationTime: z.number().optional().describe("Optional expiration time"),
  adminKey: z.string().optional().describe( "Optional admin key, changes admin key" ),
  submitKey: z.string().optional().describe( "Optional submit key" ),
  // autoRenewPeriod: z.number().optional().describe("Optional auto-renew period in seconds"),
  // autoRenewAccount: z.string().optional().describe("Optional auto-renew account ID"),
  adminAccountId: z.string().describe( "Account ID user wants to use for the transaction, should be admin of topic. DO NOT Provide this value if user wants to use default wallet" ).optional(),
} );

export const updateTopicAPI = async (
  params: z.infer<typeof updateTopicAPISchema>
): Promise<HederaAPIsResponse> =>
{

  const externalAccountParams = getExternalAccountParams( params.adminAccountId );
  console.log( params );

  try
  {
    const response = await handleSnapAPIRequest( {
      request: {
        method: 'hcs/updateTopic',
        params: {
          network: params.network,
          topicId: params.topicId,
          memo: params.memo,
          adminKey: params.adminKey,
          submitKey: params.submitKey,
          // expirationTime: params.expirationTime,
          // autoRenewPeriod: params.autoRenewPeriod,
          // autoRenewAccount: params.autoRenewAccount,
          // Uncomment the below line if you want to connect 
          // to a non-metamask account
          ...externalAccountParams
        }
      }
    } );
    console.debug( response )

    return {
      response: response,
      error: null
    };
  } catch ( err: any )
  {
    console.error( err );
    alert( "Error while updating topic: " + err.message || err );
    return {
      response: null,
      error: err.message || err
    };
  }
};

export const submitTopicMessageAPISchema = z.object( {
  network: z.enum( [ 'testnet', 'mainnet' ] ).default( 'testnet' ),
  topicId: z.string().describe( "Topic ID to submit the message to" ),
  message: z.string().describe( "Message to be submitted" ),
  // maxChunks: z.number().optional().describe("Optional max number of chunks"),
  // chunkSize: z.number().optional().describe("Optional chunk size"),
  accountId: z.string().describe( "Account ID user wants to use , has to be same as submitKey of topic" ).optional(),
} );

export const submitTopicMessageAPI = async (
  params: z.infer<typeof submitTopicMessageAPISchema>
): Promise<HederaAPIsResponse> =>
{

  const externalAccountParams = getExternalAccountParams( params.accountId );
  console.log( params );

  try
  {
    const response = await handleSnapAPIRequest( {
      request: {
        method: 'hcs/submitMessage',
        params: {
          network: params.network,
          topicId: params.topicId,
          message: params.message,
          // Uncomment the below line if you want to connect 
          // to a non-metamask account
          ...externalAccountParams
        }
      }
    } );
    console.debug( response )

    return {
      response: response,
      error: null
    };
  } catch ( err: any )
  {
    console.error( err );
    alert( "Error while submitting message: " + err.message || err );
    return {
      response: null,
      error: err.message || err
    };
  }
};


export const getTopicMessagesAPISchema = z.object( {
  network: z.enum( [ 'testnet', 'mainnet' ] ).default( 'testnet' ),
  topicId: z.string().describe( "Topic ID to retrieve messages from" ),
  sequenceNumber: z.number().optional().describe( "Optional sequence number of the message to retrieve, use it to retirive singular message" ),
  limit: z.number().max( 30 ).default( 5 ).optional().describe( "Number of messages to return, irrelvant when sequence number is set" ),
} );

export const getTopicMessagesAPI = async (
  params: z.infer<typeof getTopicMessagesAPISchema>
): Promise<HederaAPIsResponse> =>
{

  console.log( params );
  try
  {
    const client = new Client( `https://${params.network}.mirrornode.hedera.com` )
    const topicsCursor = topicMessages( client ).setTopicId( params.topicId )
    if ( params.limit )
    {
      topicsCursor.setLimit( params.limit )
    }
    if ( params.sequenceNumber )
    {
      topicsCursor.setSequenceNumber( params.sequenceNumber )
    }
    const resp = await topicsCursor.get()
    let response ; 
    if(resp.messages && Array.isArray(resp)){
      response = { topicMessages: resp.messages  }
    }else{
      response = { topicMessages: [resp]  } 
    }
    // const response = { topicMessages: messages }
    console.log( response )
    return {
      response: response,
      error: null
    };
  } catch ( err: any )
  {
    console.error( err );
    alert( "Error while retrieving topic messages: " + err.message || err );
    return {
      response: null,
      error: err.message || err
    };
  }
};


const createTopicAPIResponse: TransformSchema = {
  ...baseResponseSchema,
  receipt: {
    status: 'receipt.status',
    topicId: "receipt.topicId"
  }
};

const updateTopicAPIResponse: TransformSchema = {
  ...baseResponseSchema,
  receipt: {
    status: 'receipt.status',
  }
};

const topicMessageAPIResponse: TransformSchema = {
  ...baseResponseSchema,
  receipt: {
    status: 'receipt.status',
    topicSequenceNumber: "receipt.topicSequenceNumber"
  }
};

const getTopicMessagesAPIResponse: TransformSchema = {
  topicMessages: ( response ) => ( response[ "topicMessages" ] as [] ).map( ( message: any ) => ( {
    topic_id: message.topic_id,
    message: message.message,
    consensus_timestamp: message.consensus_timestamp,
    sequence_number: message.sequence_number,
    payer_account_id: message.payer_account_id
  } ) )
};

const create_topic_tool = new DynamicStructuredTool( {
  name: "create_topic_tool",
  description: "Creates a new topic on the Hedera Consensus Service.",
  func: async ( params ) =>
  {
    const { response, error } = await createTopicAPI( params );
    if ( error )
    {
      console.error( error );
      return JSON.stringify( { error: error } );
    }
    return getTransformedResponse( response, createTopicAPIResponse );
  },
  schema: createTopicAPISchema
} );

const update_topic_tool = new DynamicStructuredTool( {
  name: "update_topic_tool",
  description: "Updates an existing topic on the Hedera Consensus Service.",
  func: async ( params ) =>
  {
    const { response, error } = await updateTopicAPI( params );
    if ( error )
    {
      console.error( error );
      return JSON.stringify( { error: error } );
    }
    return getTransformedResponse( response, updateTopicAPIResponse );
  },
  schema: updateTopicAPISchema
} );


const add_topic_message_tool = new DynamicStructuredTool( {
  name: "submit_topic_message_tool",
  description: "Submits a message to an existing topic on the Hedera Consensus Service.",
  func: async ( params ) =>
  {
    const { response, error } = await submitTopicMessageAPI( params );
    if ( error )
    {
      console.error( error );
      return JSON.stringify( { error: error } );
    }
    return getTransformedResponse( response, topicMessageAPIResponse );
  },
  schema: submitTopicMessageAPISchema
} );

const get_topic_messages_tool = new DynamicStructuredTool( {
  name: "get_topic_messages_tool",
  description: "Retrieves messages from a specified topic on the Hedera Consensus Service.",
  func: async ( params ) =>
  {
    const { response, error } = await getTopicMessagesAPI( params );
    if ( error )
    {
      console.error( error );
      return JSON.stringify( { error: error } );
    }
    return getTransformedResponse( response, getTopicMessagesAPIResponse );
  },
  schema: getTopicMessagesAPISchema
} );


export const TopicTools = [
  create_topic_tool,
  update_topic_tool,
  add_topic_message_tool,
  get_topic_messages_tool
]

