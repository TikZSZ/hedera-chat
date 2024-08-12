import { useState, useEffect, useCallback, useMemo } from 'react';
import { useChatSDK, Message } from "./ChatSDK";
import OpenAI from "openai";
import { Tool, ToolDef } from './lib/aiUtils';

// Define types for customizable parts
type MessageProcessor = ( messages: Message[],toolDefs:ToolDef[] ) => Promise<OpenAI.Chat.Completions.ChatCompletion>;

// type ToolExecutor = (toolName: string, params: any) => Promise<string | undefined>;

interface ChatConfig
{
  messageProcessor?: MessageProcessor;
  model?: string;
}

const defaultMessageProcessor: MessageProcessor = async ( messages,toolDefs ) =>
{
  const client = new OpenAI( {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  } );

  return client.chat.completions.create({
    messages: messages.map( m => m.metadata ) as any,
    model: "gpt-4-0125-preview",
    tools: toolDefs as any,
  });
};

export const useChat = ( config: ChatConfig = {} ) =>
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
  const model = config.model || "gpt-4-0125-preview";

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

  const processMessage = useCallback( async ( _: Message ) =>
  {
    setError( null );
    setInProgress( true );
    const processingMsgId = Date.now().toString();

    addMessage( {
      id: processingMsgId,
      type: "assistant",
      content: "Processing...",
      isVisible: true,
    } );

    try
    {
      const response = await messageProcessor( messages,toolDefs );
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
          metadata: choice0.message,
        } );

        addMessages(
          toolCallsResult.map( ( toolCallResult ) => ( {
            id: Date.now().toString(),
            type: "tool",
            metadata: toolCallResult,
            isVisible: true,
            content: toolCallResult.content,
          } ) )
        );
      } else
      {
        const content = choice0.message.content || "";
        updateMessage( processingMsgId, {
          type: "assistant",
          content: content,
          metadata: choice0.message,
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
  }, [ messages, addMessage, updateMessage, addMessages, messageProcessor] );

  useEffect( () =>
  {
    if (messages.length > 0 && messages[messages.length - 1].type === "user") {
      processMessage(messages[messages.length - 1]);
    } else if (
      messages.length > 0 &&
      messages[messages.length - 1].type === "tool"
    ) {
      processMessage(messages[messages.length - 1]);
    }
  }, [ messages, processMessage ] );

  return { inProgress, error };
};