import { useState, useEffect, useCallback, useMemo, useId } from 'react';
import { useChatSDK, Message } from "./ChatSDK";
import OpenAI from "openai";

import { Tool } from './utils/aiUtils';
// Define types for customizable parts
export type AIMessageProcessor = ( messages: Message[], params: Omit<OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming, "messages"> ) => Promise<OpenAI.Chat.Completions.ChatCompletion>;

// type ToolExecutor = (toolName: string, params: any) => Promise<string | undefined>;

interface ChatConfig<T>
{
  messageProcessor?: AIMessageProcessor;
  params: Omit<OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming, "messages" | "tools">;
  context?: T
}

const defaultMessageProcessor: AIMessageProcessor = async ( messages, params ) =>
{
  const client = new OpenAI( {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  } );
  // console.log({
  //   messages: messages.map( m => m.rawChatBody ) as any,
  //   ...params
  // } )
  return client.chat.completions.create( {
    messages: messages.map( m => m.rawChatBody ) as any,
    ...params
  } );
};

export const useAIChat = <C> ( config: ChatConfig<C> ) =>
{
  const {
    messages,
    addMessage,
    updateMessage,
    addMessages,
    tools
  } = useChatSDK();

  const [ inProgress, setInProgress ] = useState<boolean>( false );
  const [ error, setError ] = useState<string | null>( null );
  const [ context, setContext ] = useState<undefined | C>( config.context )

  const messageProcessor = config.messageProcessor || defaultMessageProcessor;

  const toolsMap = useMemo( () =>
  {
    return tools.reduce( ( acc, tool ) =>
    {
      acc[ tool.name ] = tool;
      return acc;
    }, {} as Record<string, Tool<any>> )
  }, [ tools ] )

  const toolDefs = useMemo( () =>
  {
    return tools.map( ( tool ) => tool.toolDef );
  }, [ tools ] )


  useEffect( () =>
  {
    const lastMessage = messages[ messages.length - 1 ];
    if ( !lastMessage ) return;
    if ( lastMessage.type === "user" || lastMessage.type === "tool" )
    {
      invokeAI();
    }
    // toolCallsResult.map( async ( toolCallResult ) => {
    //   const [toolName,toolResult] = toolCallResult.metadata!
    //   if(toolsMap[ toolName as any ].afterCallback){
    //     // @ts-ignore
    //     await toolsMap[ toolName as any ].afterCallback(toolResult,context)
    //   }
    // }  )
    console.log( messages )
  }, [ messages ] );

  const invokeAI = useCallback( async () =>
  {
    setError( null );
    setInProgress( true );
    const processingMsgId = Date.now().toString();

    addMessage( {
      id: processingMsgId,
      type: "assistant",
      content: "Processing...",
      isVisible: true,
      rawChatBody: {
        role: "assistant",
        content: "Processing..."
      }
    } );

    try
    {
      const response = await messageProcessor( messages, { tools: toolDefs as any, ...config.params } );
      const choice0 = response.choices[ 0 ];

      if ( choice0.finish_reason === "tool_calls" )
      {
        const { tool_calls } = choice0.message;
        const toolCallsResult = [];


        for ( const toolCall of tool_calls || [] )
        {
          const toolName = toolCall.function.name;
          const toolParams = JSON.parse( toolCall.function.arguments );

          if ( toolsMap[ toolName ] )
          {
            const tools_result = await toolsMap[ toolName ].invoke( toolParams, context );
            toolCallsResult.push( {
              role: "tool",
              content: ` \`\`\`json \n${JSON.stringify( { [toolName]: toolParams } )}\n\`\`\` \n Results: \n ${tools_result.content}`,
              tool_call_id: toolCall.id,
            } );
          } else
          {
            toolCallsResult.push( {
              role: "tool",
              content: `Called ${toolName} with ${JSON.stringify( toolParams )} result -> \n Tool Not found`,
              tool_call_id: toolCall.id,
            } );
          }
        }

        updateMessage( processingMsgId, {
          isVisible: false,
          content: choice0.message.content,
          rawChatBody: choice0.message,
        } );

        addMessages(
          toolCallsResult.map( ( toolCallResult ) => ( {
            id: Date.now().toString(),
            type: "tool",
            rawChatBody: toolCallResult,
            isVisible: true,
            content: toolCallResult.content,
          } ) )
        );
      } else
      {
        updateMessage( processingMsgId, {
          type: "assistant",
          content: choice0.message.content,
          rawChatBody: choice0.message,
        } );
      }
    } catch ( error: any )
    {
      console.error( "Error processing message:", error );
      setError( error.message );
    } finally
    {
      setInProgress( false );
    }
  }, [ messages, addMessage, updateMessage, addMessages, messageProcessor ] );



  return { inProgress, error, setContext,context };
};