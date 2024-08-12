import { ChatSDK, useChatSDK, Message } from "./ChatSDK";
import { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import AutoHideScrollbar from "@/components/AutoHideScrollbar"
import OpenAI from "openai";
import { tools } from "./lib/tools";
const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const tools_map = tools.reduce((acc, tool) => {
  acc[tool.name] = tool.invoke;
  return acc;
}, {} as Record<string, (inputs?:any)=>Promise<string|undefined>>);

const tool_defs_map = tools.map((tool) => tool.toolDef);

const App: React.FC = () => {
  const [_, setIsProcessing] = useState<boolean>(false);
  return (
    <div className="">
      <LandingPage/>
      {/* <ExternalMessageProcessor setIsProcessing={setIsProcessing} /> */}
    </div>
  );
};

const ExternalMessageProcessor: React.FC<{
  setIsProcessing: (val: boolean) => void;
}> = ({ setIsProcessing }) => {
  const { messages, addMessage, updateMessage, addMessages } = useChatSDK();

  useEffect(() => {
    // React to changes in messages
    console.log("use effect ran with", messages);
    if (messages.length > 0 && messages[messages.length - 1].type === "user") {
      processMessage(messages[messages.length - 1]);
    } else if (
      messages.length > 0 &&
      messages[messages.length - 1].type === "tool"
    ) {
      processMessage(messages[messages.length - 1]);
    }
  }, [messages]);

  const processMessage = async (message: Message) => {
    setIsProcessing(true);
    // Add a temporary "processing" message
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
    // console.log(messages, msgsToSend);
    try {
      // Simulate API call or complex processing
      // const response = await yourExternalAPIorProcessingLogic(message.content);

      const response = await client.chat.completions.create({
        messages: msgsToSend as any,
        model: "gpt-4o-mini",
        tools: tool_defs_map as any,
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
            const tools_result = await tools_map[tool_name](tool_params);
            tool_calls_result.push({
              role: "tool",
              content: `Called ${tool_name} with ${JSON.stringify(tool_params)} result -> \n ${tools_result}`,
              tool_call_id: tool_call.id,
            });
            console.log({ tool_name, tool_params, tools_result });
          }
        }

        console.log(tool_calls_result);
        // console.log(
        //   tool_calls_result.map((tool_call_result) => ({
        //     id: Date.now().toString(),
        //     type: "tool",
        //     metadata: tool_call_result,
        //   }))
        // );
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
      setIsProcessing(false);
    }
  };

  return null; // This component doesn't render anything
};

export default App;
