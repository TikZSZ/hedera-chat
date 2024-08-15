import { useState, useEffect, useCallback, useMemo } from 'react';
import { useChatSDK, Message } from "./ChatSDK";
import OpenAI from "openai";
import { Tool, ToolDef } from './utils/aiUtils';
// Define types for customizable parts
export type AIMessageProcessor = ( messages: Message[], params: Omit<OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming, "messages"> ) => Promise<OpenAI.Chat.Completions.ChatCompletion>;

// type ToolExecutor = (toolName: string, params: any) => Promise<string | undefined>;

interface ChatConfig
{
  messageProcessor?: AIMessageProcessor;
  params: Omit<OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming, "messages"|"tools">;
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

export const useAIChat = ( config: ChatConfig ) =>
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
    if ( messages.length > 0 && messages[ messages.length - 1 ].type === "user" )
    {
      invokeAI( messages[ messages.length - 1 ] );
    } else if (
      messages.length > 0 &&
      messages[ messages.length - 1 ].type === "tool"
    )
    {
      invokeAI( messages[ messages.length - 1 ] );
    }
    console.log(messages)
  }, [ messages ] );

  const invokeAI = useCallback( async ( _: Message ) =>
  {
    setError( null );
    setInProgress( true );
    const processingMsgId = Date.now().toString();

    addMessage( {
      id: processingMsgId,
      type: "assistant",
      isVisible: true,
      rawChatBody:{
        role:"assistant",
        content:"Processing..."
      }
    } );

    try
    {
      const response = await messageProcessor( messages, { tools: toolDefs as any, ...config.params } );
      const choice0 = response.choices[ 0 ];

      if ( choice0.finish_reason === "tool_calls" )
      {
        const { role, tool_calls } = choice0.message;
        const toolCallsResult = [];


        for ( const toolCall of tool_calls || [] )
        {
          const toolName = toolCall.function.name;
          const toolParams = JSON.parse( toolCall.function.arguments );

          if ( toolsMap[ toolName ] )
          {
            const tools_result = await toolsMap[ toolName ].invoke( toolParams );
            toolCallsResult.push( {
              role: "tool",
              content: `Called ${toolName} with ${JSON.stringify( toolParams )} result -> \n ${tools_result}`,
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
          type: role,
          isVisible: false,
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
        // const content = choice0.message.content || "";
        updateMessage( processingMsgId, {
          type: "assistant",
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



  return { inProgress, error };
};