import { useEffect, useState ,useMemo} from "react";
import { useChatSDK,Message } from "./ChatSDK";
import OpenAI from "openai";
import { tools } from "./lib/tools";
import { Tool } from "./lib/aiUtils";

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const  useChat = () => {
  const {
    messages,
    addMessage,
    config,
    addMessages,
    updateMessage,
    removeMessage,
    clearMessages,
    isConnected,
    connect,
    tools
  } = useChatSDK();

  const tools_map = useMemo(() => {
    return tools.reduce((acc, tool) => {
      acc[tool.name] = tool;
      return acc;
    }, {} as Record<string, Tool<any>>)
  },[tools])

  const tool_defs = useMemo(()=>{
    return tools.map((tool) => tool.toolDef);
  },[tools])

  const [inProgress,setInProgress] = useState<boolean>(false)
  const [error,setError] = useState<string|null>(null)

  useEffect(() => {
    // React to changes in messages
    console.log("use effect ran with", messages);
    if (messages.length > 0 && messages[messages.length - 1].type === "user") {
      processMessage(messages[messages.length - 1]);
      setInProgress(true);
    } else if (
      messages.length > 0 &&
      messages[messages.length - 1].type === "tool"
    ) {
      processMessage(messages[messages.length - 1]);
      setInProgress(true);
    }else{
      if(messages.length > 0 && messages[messages.length - 1].type === "assistant" && messages[messages.length - 1].content!=="Processing..."){
        setInProgress(false);
      }
    }
  }, [messages]);

  const processMessage = async (message: Message) => {
    // Add a temporary "processing" message
    setError(null)
    const processingMsgId = Date.now().toString();

    addMessage({
      id: processingMsgId,
      type: "assistant",
      content: "Processing...",
      isVisible: true,
    });

    const msgsToSend: Record<string, any>[] = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.metadata) {
        msgsToSend.push(msg.metadata);
      }
    }
    try {

      const response = await client.chat.completions.create({
        messages: msgsToSend as any,
        model: "gpt-4o-mini",
        tools: tool_defs as any,
      });

      const choice0 = response.choices[0];

      // Create a message containing the result of the function call
      if (choice0.finish_reason === "tool_calls") {
        const { role, tool_calls } = choice0.message;
        const tool_calls_result = [];

        for (const tool_call of tool_calls!) {
          const tool_name = tool_call.function.name;
          const tool_params = JSON.parse(tool_call.function.arguments);

          if (tools_map[tool_name]) {
            const tools_result = await tools_map[tool_name].invoke(tool_params);
            tool_calls_result.push({
              role: "tool",
              content: `Called ${tool_name} with ${JSON.stringify(tool_params)} result -> \n ${tools_result}`,
              tool_call_id: tool_call.id,
            });
            console.log({ tool_name, tool_params, tools_result });
          }
        }

        console.log(tool_calls_result);
        
        updateMessage(processingMsgId, {
          type: role,
          isVisible: false,
          metadata: choice0.message,
        });

        addMessages(
          tool_calls_result.map((tool_call_result) => ({
            id: Date.now().toString(),
            type: "tool",
            metadata: tool_call_result,
            isVisible: true,
            content: tool_call_result.content,
          }))
        );
      } else {
        console.log(response);
        const content = choice0.message.content || "";
        // Update the processing message with the result
        updateMessage(processingMsgId, {
          type: "assistant",
          content: content,
          metadata: choice0.message,
        });
      }
    } catch (error:any) {
      console.error("Error processing message:", error);
      setError(error)
    }
  };
  return {inProgress}
}