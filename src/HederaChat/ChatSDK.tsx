import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Tool } from "./utils/aiUtils";
import { ChatBox } from "../components/ChatBox";
export type MessageType = "user" | "assistant" | "system" | "tool";

export interface RawChatBody<
  Roles extends string = string,
  ToolCalls extends any[] = any[]
> extends Record<string, any> {
  role: Roles;
  content: string | null;
  tool_calls?: ToolCalls;
}

export interface Message {
  id: string;
  type: MessageType;
  content:string|null;
  isVisible?: boolean;
  metadata?: Record<string, any>;
  rawChatBody: RawChatBody;
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
  messages?: Message[];
  tools: Tool<any>[];
}

export interface ChatSDKActions {
  addMessage: (message: Message) => void;
  addMessages: (message: Message[]) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  removeMessage: (id: string) => void;
  clearMessages: () => void;
  setTools: (tools: Tool<any>[]) => void;
  getSystemMessage:() => Message|null;
  updateSystemMessage:(msg:Message) => void
}

interface ChatSDKContextType extends ChatSDKActions {
  messages: Message[];
  config: ChatSDKConfig;
  tools: Tool<any>[];
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

// const dummyMsg: Message = {
//   id: "1723251651824",
//   isVisible: true,
//   rawChatBody: {
//     role: "assistant",
//     content:
//       "Here's a sample of random Markdown content:\n\n```markdown\n# Welcome to My Markdown Guide\n\n## Introduction\n\nMarkdown is **a lightweight markup language** that you can use to add formatting elements to plaintext text documents. It’s widely used for writing on the web and offers great flexibility.\n\n### Features of Markdown\n\n- Easy to Read: \n  - Even in its raw form, it's easy to read and write.\n\n- Formatting Capabilities: \n  - You can create headings, lists, links, images, and more.\n\n- Compatibility:\n  - Works well with various platforms like GitHub, Reddit, and many blogging platforms.\n\n## Basic Syntax\n\n### Headings\n\nTo create headings, use the `#` symbol followed by a space. The number of `#` symbols indicates the level of the heading.\n\n```markdown\n# This is a Heading 1\n## This is a Heading 2\n### This is a Heading 3\n```\n\n### Lists\n\nYou can create ordered and unordered lists.\n\n#### Unordered List\n- Item 1\n- Item 2\n  - Subitem 2.1\n  - Subitem 2.2\n\n#### Ordered List\n1. First item\n2. Second item\n   1. Subitem 2.1\n   2. Subitem 2.2\n\n### Links and Images\n\nTo add a link, use the following syntax:\n\n```markdown\n[Link Text](URL)\n```\n\nTo add an image, use:\n\n```markdown\n![Alt Text](Image URL)\n```\n\n## Conclusion\n\nMarkdown is simple yet powerful. By using this guide, you can start creating your documents today!\n\n```\n\nFeel free to modify it or use it as per your needs!",
//     refusal: null,
//   },
//   type: "assistant",
// };
// const dummyMsg1: Message = {
//   id: "1723337348958",
//   type: "user",
//   isVisible: true,
//   rawChatBody: {
//     role: "user",
//     content: "Hello",
//   },
// };
// const dummyMsg2: Message = {
//   id: "1723337348918",
//   type: "assistant",
//   rawChatBody: {
//     role: "tool",
//     content:
//       '```json{\n    "currentAccount": {\n        "metamaskEvmAddress": "0x205b9db8cf246891bef88b50eeb83b0eb1b109fc",\n        "externalEvmAddress": "",\n        "hederaAccountId": "0.0.4653631",\n        "hederaEvmAddress": "0xa3560ba085d67b5315864a033c3a1148491055e2",\n        "publicKey": "0x02766abf24a271be65218c8407774417275e60a98afdee08ea2aade5c7864fe721",\n        "balance": {\n            "hbars": 98.99824476,\n            "timestamp": "Sat, 10 Aug 2024 03:42:05 GMT",\n            "tokens": {}\n        },\n        "network": "testnet",\n        "mirrorNodeUrl": "https://testnet.mirrornode.hedera.com"\n    },\n    "accountInfo": {\n        "accountId": "0.0.4653631",\n        "alias": "UNLAXIEF2Z5VGFMGJIBTYOQRJBERAVPC",\n        "createdTime": "Sun, 04 Aug 2024 18:14:54 GMT",\n        "expirationTime": "Sat, 02 Nov 2024 18:14:54 GMT",\n        "memo": "lazy-created account",\n        "evmAddress": "0xa3560ba085d67b5315864a033c3a1148491055e2",\n        "key": {\n            "type": "ECDSA_SECP256K1",\n            "key": "02766abf24a271be65218c8407774417275e60a98afdee08ea2aade5c7864fe721"\n        },\n        "autoRenewPeriod": "7776000",\n        "ethereumNonce": "0",\n        "isDeleted": false,\n        "stakingInfo": {\n            "declineStakingReward": false,\n            "stakePeriodStart": "",\n            "pendingReward": "0",\n            "stakedToMe": "0",\n            "stakedAccountId": "",\n            "stakedNodeId": ""\n        },\n        "balance": {\n            "hbars": 98.99824476,\n            "timestamp": "Sat, 10 Aug 2024 03:42:05 GMT",\n            "tokens": {}\n        }\n    }\n}`',
//     tool_call_id: "call_5btrQV7pTHDbQCoVs8hK6Fgj",
//   },
//   isVisible: true,
// };

// const dummyMsg3: Message = {
//   id: "1723379076349",
//   type: "assistant",
//   isVisible: true,
//   rawChatBody: {
//     role: "assistant",
//     content:
//       "Sure! Here are some links to the official Hedera documentation:\n\n1. **Hedera Documentation Overview**: [Hedera Docs](https://hedera.com/docs)\n2. **Hedera Hashgraph Documentation**: [Hedera Hashgraph](https://docs.hedera.com)\n3. **Developer Portal**: [Hedera Developer Portal](https://hedera.com/developers)\n4. **SDKs and APIs**: [Hedera SDKs](https://hedera.com/developers/sdk)\n5. **Hedera Token Service**: [Token Service](https://hedera.com/token)\n\nFeel free to explore these resources for more detailed information on using the Hedera network and its services!",
//     refusal: null,
//   },
// };

export const ChatSDKProvider: React.FC<{
  children: ReactNode;
  config: ChatSDKConfig;
}> = ({ children, config }) => {
  const [tools, setTools] = useState(config.tools);
  const [messages, setMessages] = useState<Message[]>(
    config.messages && config.messages?.length > 0 ? config.messages : []
  );

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

  const getSystemMessage = useCallback(() => {
    if (messages[0].type === "system") {
      return messages[0]
    }
    return null
  }, [messages]);

  const updateSystemMessage = useCallback((message: Message) => {
    if (messages[0].type === "system") {
      setMessages((_) => [
        message,
        ...messages.slice(1),
      ]);
    }
  }, [messages]);

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

  const contextValue: ChatSDKContextType = {
    messages,
    addMessage,
    updateMessage,
    removeMessage,
    clearMessages,
    config,
    addMessages,
    tools,
    setTools,
    getSystemMessage,
    updateSystemMessage
  };

  return (
    <ChatSDKContext.Provider value={contextValue}>
      {children}
    </ChatSDKContext.Provider>
  );
};

export const ChatSDK: React.FC<{
  config: ChatSDKConfig;
  children: ReactNode;
}> = ({ config, children }) => {
  return <ChatSDKProvider config={config}>{children}</ChatSDKProvider>;
};
