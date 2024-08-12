import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, Minimize, Maximize, X, Loader2 } from "lucide-react";
import Markdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  duotoneSpace,
} from "react-syntax-highlighter/dist/esm/styles/prism";
// Types
import AutoHideScrollbar from "@/components/AutoHideScrollbar"
const markdownTheme = duotoneSpace
export type MessageType = "user" | "assistant" | "system" | "tool";

export interface Message {
  id: string;
  type: MessageType;
  content?: string;
  isVisible?: boolean;
  metadata?: Record<string, any>;
}

export interface ChatSDKConfig {
  onNewMessage?: (
    message: Message,
    allMessages: Message[],
    actions: ChatSDKActions
  ) => Promise<void>;
  customStyles?: {
    chatWindow?: React.CSSProperties;
    messageContainer?: React.CSSProperties;
    userMessage?: React.CSSProperties;
    assistantMessage?: React.CSSProperties;
  };
  initialOpen?: boolean;
  systemMessage?: string;
  connect: () => Promise<boolean>;
}

export interface ChatSDKActions {
  addMessage: (message: Message) => void;
  addMessages: (message: Message[]) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  removeMessage: (id: string) => void;
  clearMessages: () => void;
}

interface ChatSDKContextType extends ChatSDKActions {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  messages: Message[];
  config: ChatSDKConfig;
  isMinimized: boolean;
  toggleMinimize: () => void;
  isFullScreen: boolean;
  toggleFullScreen: () => void;
  isConnected: boolean;
  setIsConnected: (val: boolean) => void;
  connect: () => Promise<void>;
}

// Create a context for the SDK
const ChatSDKContext = createContext<ChatSDKContextType | undefined>(undefined);

export const useChatSDK = () => {
  const context = useContext(ChatSDKContext);
  if (context === undefined) {
    throw new Error("useChatSDK must be used within a ChatSDKProvider");
  }
  return context;
};

const dummyMsg: Message = {
  content:
    "Here's a sample of random Markdown content:\n\n```markdown\n# Welcome to My Markdown Guide\n\n## Introduction\n\nMarkdown is **a lightweight markup language** that you can use to add formatting elements to plaintext text documents. It’s widely used for writing on the web and offers great flexibility.\n\n### Features of Markdown\n\n- Easy to Read: \n  - Even in its raw form, it's easy to read and write.\n\n- Formatting Capabilities: \n  - You can create headings, lists, links, images, and more.\n\n- Compatibility:\n  - Works well with various platforms like GitHub, Reddit, and many blogging platforms.\n\n## Basic Syntax\n\n### Headings\n\nTo create headings, use the `#` symbol followed by a space. The number of `#` symbols indicates the level of the heading.\n\n```markdown\n# This is a Heading 1\n## This is a Heading 2\n### This is a Heading 3\n```\n\n### Lists\n\nYou can create ordered and unordered lists.\n\n#### Unordered List\n- Item 1\n- Item 2\n  - Subitem 2.1\n  - Subitem 2.2\n\n#### Ordered List\n1. First item\n2. Second item\n   1. Subitem 2.1\n   2. Subitem 2.2\n\n### Links and Images\n\nTo add a link, use the following syntax:\n\n```markdown\n[Link Text](URL)\n```\n\nTo add an image, use:\n\n```markdown\n![Alt Text](Image URL)\n```\n\n## Conclusion\n\nMarkdown is simple yet powerful. By using this guide, you can start creating your documents today!\n\n```\n\nFeel free to modify it or use it as per your needs!",
  id: "1723251651824",
  isVisible: true,
  metadata: {
    role: "assistant",
    content:
      "Here's a sample of random Markdown content:\n\n```ma…el free to modify it or use it as per your needs!",
    refusal: null,
  },
  type: "assistant",
};
const dummyMsg1:Message = {
  "id": "1723337348958",
  "type": "user",
  "isVisible": true,
  "content":"Hello"
}
const dummyMsg2: Message = {
  "id": "1723337348918",
  "type": "assistant",
  "metadata": {
      "role": "tool",
      "content": "```json{\n    \"currentAccount\": {\n        \"metamaskEvmAddress\": \"0x205b9db8cf246891bef88b50eeb83b0eb1b109fc\",\n        \"externalEvmAddress\": \"\",\n        \"hederaAccountId\": \"0.0.4653631\",\n        \"hederaEvmAddress\": \"0xa3560ba085d67b5315864a033c3a1148491055e2\",\n        \"publicKey\": \"0x02766abf24a271be65218c8407774417275e60a98afdee08ea2aade5c7864fe721\",\n        \"balance\": {\n            \"hbars\": 98.99824476,\n            \"timestamp\": \"Sat, 10 Aug 2024 03:42:05 GMT\",\n            \"tokens\": {}\n        },\n        \"network\": \"testnet\",\n        \"mirrorNodeUrl\": \"https://testnet.mirrornode.hedera.com\"\n    },\n    \"accountInfo\": {\n        \"accountId\": \"0.0.4653631\",\n        \"alias\": \"UNLAXIEF2Z5VGFMGJIBTYOQRJBERAVPC\",\n        \"createdTime\": \"Sun, 04 Aug 2024 18:14:54 GMT\",\n        \"expirationTime\": \"Sat, 02 Nov 2024 18:14:54 GMT\",\n        \"memo\": \"lazy-created account\",\n        \"evmAddress\": \"0xa3560ba085d67b5315864a033c3a1148491055e2\",\n        \"key\": {\n            \"type\": \"ECDSA_SECP256K1\",\n            \"key\": \"02766abf24a271be65218c8407774417275e60a98afdee08ea2aade5c7864fe721\"\n        },\n        \"autoRenewPeriod\": \"7776000\",\n        \"ethereumNonce\": \"0\",\n        \"isDeleted\": false,\n        \"stakingInfo\": {\n            \"declineStakingReward\": false,\n            \"stakePeriodStart\": \"\",\n            \"pendingReward\": \"0\",\n            \"stakedToMe\": \"0\",\n            \"stakedAccountId\": \"\",\n            \"stakedNodeId\": \"\"\n        },\n        \"balance\": {\n            \"hbars\": 98.99824476,\n            \"timestamp\": \"Sat, 10 Aug 2024 03:42:05 GMT\",\n            \"tokens\": {}\n        }\n    }\n}`",
      "tool_call_id": "call_5btrQV7pTHDbQCoVs8hK6Fgj"
  },
  "isVisible": true,
  "content": "Called get_account_info_tool with {} result -> \n ```json{\n    \"currentAccount\": {\n        \"metamaskEvmAddress\": \"0x205b9db8cf246891bef88b50eeb83b0eb1b109fc\",\n        \"externalEvmAddress\": \"\",\n        \"hederaAccountId\": \"0.0.4653631\",\n        \"hederaEvmAddress\": \"0xa3560ba085d67b5315864a033c3a1148491055e2\",\n        \"publicKey\": \"0x02766abf24a271be65218c8407774417275e60a98afdee08ea2aade5c7864fe721\",\n        \"balance\": {\n            \"hbars\": 98.99824476,\n            \"timestamp\": \"Sat, 10 Aug 2024 03:42:05 GMT\",\n            \"tokens\": {}\n        },\n        \"network\": \"testnet\",\n        \"mirrorNodeUrl\": \"https://testnet.mirrornode.hedera.com\"\n    },\n    \"accountInfo\": {\n        \"accountId\": \"0.0.4653631\",\n        \"alias\": \"UNLAXIEF2Z5VGFMGJIBTYOQRJBERAVPC\",\n        \"createdTime\": \"Sun, 04 Aug 2024 18:14:54 GMT\",\n        \"expirationTime\": \"Sat, 02 Nov 2024 18:14:54 GMT\",\n        \"memo\": \"lazy-created account\",\n        \"evmAddress\": \"0xa3560ba085d67b5315864a033c3a1148491055e2\",\n        \"key\": {\n            \"type\": \"ECDSA_SECP256K1\",\n            \"key\": \"02766abf24a271be65218c8407774417275e60a98afdee08ea2aade5c7864fe721\"\n        },\n        \"autoRenewPeriod\": \"7776000\",\n        \"ethereumNonce\": \"0\",\n        \"isDeleted\": false,\n        \"stakingInfo\": {\n            \"declineStakingReward\": false,\n            \"stakePeriodStart\": \"\",\n            \"pendingReward\": \"0\",\n            \"stakedToMe\": \"0\",\n            \"stakedAccountId\": \"\",\n            \"stakedNodeId\": \"\"\n        },\n        \"balance\": {\n            \"hbars\": 98.99824476,\n            \"timestamp\": \"Sat, 10 Aug 2024 03:42:05 GMT\",\n            \"tokens\": {}\n        }\n    }\n}`"
}
export const ChatSDKProvider: React.FC<{
  children: ReactNode;
  config: ChatSDKConfig;
}> = ({ children, config }) => {
  const [isOpen, setIsOpen] = useState(config.initialOpen ?? false);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>(
    config.systemMessage
      ? [
          {
            id: Date.now().toString(),
            type: "system",
            content: config.systemMessage,
            metadata: { role: "system", content: config.systemMessage },
          },
          // dummyMsg1,
          // dummyMsg2,
        ]
      : []
  );
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const addMessage = useCallback(
    (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    },
    [messages, config]
  );

  const addMessages = useCallback(
    (message: Message[]) => {
      setMessages((prevMessages) => [...prevMessages, ...message]);
    },
    [messages, config]
  );

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg))
    );
  }, []);

  const removeMessage = useCallback((id: string) => {
    setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== id));
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  const toggleFullScreen = useCallback(() => {
    setIsFullScreen((prev) => !prev);
  }, []);

  const connect = useCallback(async () => {
    const resp = await config.connect();
    setIsConnected(() => resp);
  }, []);

  const contextValue: ChatSDKContextType = {
    isOpen,
    setIsOpen,
    messages,
    addMessage,
    updateMessage,
    removeMessage,
    clearMessages,
    config,
    isMinimized,
    toggleMinimize,
    isFullScreen,
    toggleFullScreen,
    addMessages,
    connect: connect,
    isConnected,
    setIsConnected,
  };

  return (
    <ChatSDKContext.Provider value={contextValue}>
      {children}
    </ChatSDKContext.Provider>
  );
};

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

export const ChatDialog: React.FC = () => {
  const {
    isOpen,
    setIsOpen,
    messages,
    addMessage,
    config,
    isMinimized,
    toggleMinimize,
    addMessages,
    updateMessage,
    removeMessage,
    clearMessages,
    isFullScreen,
    toggleFullScreen,
    isConnected,
    connect,
  } = useChatSDK();

  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>();
  const [submitInProgress, setSubmitInProgress] = useState<boolean>(false);

  

  // useEffect(() => {
  //   console.log(messages, submitInProgress);
  //   if (messages.length > 0) {
  //   const lastMessage = messages[messages.length - 1];
  //   setSubmitInProgress(lastMessage.type === "user");
  // } else {
  //   setSubmitInProgress(false);
  // }
  // }, [messages]);

  useEffect(() => {
    if (!isConnected) {
      connect();
    }
  }, []);

  useEffect(() => {
    if (isConnected) {
      setError(null);
    }
  }, [isConnected]);

  
  useEffect(() => {
    // React to changes in messages
    console.log("use effect ran with", messages);
    if (messages.length > 0 && messages[messages.length - 1].type === "user") {
      processMessage(messages[messages.length - 1]);
      setSubmitInProgress(true);

    } else if (
      messages.length > 0 &&
      messages[messages.length - 1].type === "tool"
    ) {
      processMessage(messages[messages.length - 1]);
      setSubmitInProgress(true);
    }else{
      if(messages.length > 0 && messages[messages.length - 1].type === "assistant" && messages[messages.length - 1].content!=="Processing..."){
        setSubmitInProgress(false);
      }
    }
  }, [messages]);

  const processMessage = async (message: Message) => {
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
    }
  };

  const handleSend = async () => {
    if (inputValue.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        type: "user",
        content: inputValue,
        isVisible: true,
        metadata: { role: "user", content: inputValue },
      };

      if (!isConnected) {
        setError("Hedera wallet not connected");
        return;
      }

      addMessage(newMessage);
      setInputValue("");
    }
  };


  return (
    <div
      className={`fixed bottom-4 right-4 ${
        isMinimized ? "w-auto" : isFullScreen ? "w-1/2 h-5/6" : "w-96 h-[500px]"
      } rounded-lg border bg-card text-card-foreground shadow-sm`}
      style={config.customStyles?.chatWindow}
    >
      <div
        className={`flex flex-col ${
          isMinimized ? "h-12" : "h-full"
        }`}
      >
        <div className={`flex justify-between items-center p-4 ${isMinimized && "-mt-2.5 ml-5"}`}>
          <span className="font-medium">Chat Assistant</span>
          <div>
            {!isMinimized && (
              <Button size="sm" variant="ghost" onClick={toggleFullScreen}>
                {isFullScreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button className={`${isMinimized && "mt-0.5"}`} size="sm" variant="ghost" onClick={toggleMinimize}>
              {isMinimized ? (
                <Maximize className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4  " />
              )}
            </Button>
          </div>
        </div>
        {!isMinimized && (
          <>
            {error && (
              <div className="bg-destructive text-destructive-foreground p-4 text-center">
                {error}
              </div>
            )}
            
            <AutoHideScrollbar
              className="flex-1 overflow-y-auto p-4 space-y-4 chat-messages"
              style={config.customStyles?.messageContainer}
            >
              {messages.map((message, index) => (
                message.isVisible && (
                  <div
                    key={index}
                    className={`flex m-auto ${isFullScreen && "w-3/4"}`}
                  >
                    <div
                      className={`flex w-full flex-col gap-2 rounded-lg px-3 py-2 text-sm chat-message  ${
                        message.type === "user"
                          ? " bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                      style={message.type === "user" ? config.customStyles?.userMessage : config.customStyles?.assistantMessage}
                    >
                      <Markdown
                        components={{
                          //@ts-ignore
                          code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline && match ? (
                              // @ts-ignore
                              <SyntaxHighlighter
                                {...props}
                                children={String(children).replace(/\n$/, '')}
                                style={markdownTheme}
                                language={match[1]}
                                PreTag="div"
                              />
                            ) : (
                              <code {...props} className={className}>
                                {children}
                              </code>
                            )
                          }
                        }}
                        className="prose prose-sm max-w-none"
                      >
                        {message.content}
                      </Markdown>
                    </div>
                  </div>
                )
              ))}
            </AutoHideScrollbar>
            <div className="p-4 border-t">
              <form className="flex w-full items-center space-x-2" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={submitInProgress}>
                  {submitInProgress ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
                <Button type="button" size="icon">
                  <Paperclip className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const ChatSDK: React.FC<{
  config: ChatSDKConfig;
  children: ReactNode;
}> = ({ config, children }) => {
  return (
    <ChatSDKProvider config={config}>
      {children}
      <ChatDialog />
    </ChatSDKProvider>
  );
};
