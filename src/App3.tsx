import { ChatSDK, useChatSDK, Message } from "./ChatSDK";
import { useState, useEffect } from "react";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const tools = [
  {
    type: "function",
    function: {
      name: "get_delivery_date",
      description:
        "Get the delivery date for a customer's order. Call this whenever you need to know the delivery date, for example when a customer asks 'Where is my package'",
      parameters: {
        type: "object",
        properties: {
          order_id: {
            type: "string",
            description: "The customer's order ID.",
          },
        },
        required: ["order_id"],
      },
    },
  },
];

const App: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const config = {
    isOpen: true,
    onSendMessage: async (message: any, allMessages: any) => {
      // This is optional, you can handle sending entirely outside the SDK
      console.log("Message sent:", message);
      // Trigger your external message processing here
      // await processMessage(message, allMessages);
    },
    customStyles: {
      chatWindow: { boxShadow: "0 0 20px rgba(0,0,0,0.1)" },
      userMessage: { backgroundColor: "#4a9c6d", color: "white" },
      assistantMessage: { backgroundColor: "#f0f0f0", color: "black" },
    },
  };

  return (
    <ChatSDK config={config}>
      <div>Hello World</div>
      <ExternalMessageProcessor setIsProcessing={setIsProcessing} />
    </ChatSDK>
  );
};

const tools_map: Record<string, (params: Record<string, any>) => string> = {
  get_delivery_date: (params: Record<string, any>) => {
    const delivery_date = new Date().toISOString();
    return JSON.stringify({
      order_id: params["order_id"],
      delivery_date: delivery_date,
    });
  },
};

const ExternalMessageProcessor: React.FC<{
  setIsProcessing: (val: boolean) => void;
}> = ({ setIsProcessing }) => {
  const { messages, addMessage, updateMessage, addMessages,connect } = useChatSDK();
  
  useEffect(() => {
    // React to changes in messages
    if (messages.length > 0 && messages[messages.length - 1].type === "user") {
      processMessage(messages[messages.length - 1]);
    }
    connect()
  }, [messages]);

  
  const processMessage = async (message: Message) => {
    
    const processingMsgId = Date.now().toString();
    addMessage({
      id: processingMsgId,
      type: "system",
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
    console.log(messages, msgsToSend);
    try {
      // Simulate API call or complex processing
      // const response = await yourExternalAPIorProcessingLogic(message.content);
      const response = await client.chat.completions.create({
        messages: msgsToSend as any,
        model: "gpt-4o-mini",
        tools: tools as any,
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
            const tools_result = tools_map[tool_name](tool_params);
            tool_calls_result.push({
              role: "tool",
              content: tools_result,
              tool_call_id: tool_call.id,
            });
            console.log({ tool_name, tool_params, tools_result });
          }
        }

        console.log(tool_calls_result);
        console.log(
          tool_calls_result.map((tool_call_result) => ({
            id: Date.now().toString(),
            type: "tool",
            metadata: tool_call_result,
          }))
        );
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
    } catch (error) {
      console.error("Error processing message:", error);
      // Handle error (e.g., show error message)
    } finally {
      // setIsProcessing(false);
    }
  };

  return null; // This component doesn't render anything
};

export default App;
