# ChatSDK Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Basic Usage](#basic-usage)
4. [Advanced Usage](#advanced-usage)
5. [API Reference](#api-reference)
6. [Customization](#customization)
7. [Benefits](#benefits)

## Introduction

HederaChat is a flexible and powerful React-based SDK for building Web3 actionable AI applications. It provides streamlined tools and tool use API, along with state management and hooks for easy integration with AI models in Apps.

## Why should you use HederaChat SDK

1. **Flexibility**: Easily swap out AI models or message processing logic without changing your UI code.

2. **State Management**: Built-in state management for messages and tools, reducing boilerplate in your application.

3. **TypeScript Support**: Full TypeScript support for improved developer experience and type safety.

4. **Extensibility**: The tool system allows for easy addition of new capabilities to your chat application.

5. **Decoupled Logic**: The separation of state (ChatSDK) and logic (useAIChat) allows for easier testing

## Installation

```bash
npm install hederachat
```

## Basic Usage

To use the ChatSDK in your React application, follow these steps:

1. Wrap your application or chat component with the `ChatSDK` provider:
It holds all the state for messages
```tsx
import { ChatSDK,ChatSDKConfig } from "hederachat";

const App:ChatSDKConfig = () => {
  const config = {
    tools: [], // Add any custom tools here
    messages: [], // Initial messages (optional)
  };

  return (
    <ChatSDK config={config}>
      <YourChatComponent />
    </ChatSDK>
  );
};
```

2. Use the `useChatSDK` and `useAIChat` hooks in your chat component:

```tsx
import { useChatSDK, useAIChat } from "hederachat";

const ChatBox = () => {
  const { messages, addMessage } = useChatSDK();
  const { inProgress, setContext } = useAIChat({
    params: { temprature: 0.5,model: {model name} },
    context: {
      /* Your context object */
    },
  });

};
```

3. Implement the chat interface:

```tsx
const ChatBox = () => {
  // ... previous code

  const [inputValue, setInputValue] = useState("");

  const handleSend = async () => {
    if (inputValue.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        type: "user",
        content: inputValue, // set content to be shown to user
        isVisible: true, // set if should be visible in chat componenet
        // use rawChatBody to store full chat response from your model
        rawChatBody: { role: "user", content: inputValue },
      };
      // add the message and let hedera chat handle the rest
      addMessage(newMessage);
      setInputValue("");
    }
  };

  return (
    <div>
      {/* Render messages */}
      {messages.map((message) => (
        <div key={message.id}>{message.content}</div>
      ))}

      {/* Input area */}
      <textarea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={handleSend} disabled={inProgress}>
        Send
      </button>
    </div>
  );
};
```

## Advanced Usage

### Custom Message Processor

You can provide a custom message processor to `useAIChat`:

```tsx
// import type from hederachat
type AIMessageProcessor = ( messages: Message[], params: Omit<OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming, "messages"> ) => Promise<OpenAI.Chat.Completions.ChatCompletion>;

const customMessageProcessor:AIMessageProcessor = async (messages, params) => {
  // Call you model here
};

const { inProgress } = useAIChat({
  params: { temprature:0.5} //model params
  messageProcessor: customMessageProcessor,
});
```

### Using Tools
You can provide hederachat with tools that form the action component, thats the bread and butter of hederachat below is shown how to create you own tools 
You can define and use custom tools with the ChatSDK:

```tsx
import { DynamicStructuredTool,ChatSDKConfig,hederaChatTools } from "hederachat";

import {z} from "zod"
// define tools schema
const toolSchema = z.object( {
  param1: z.number(),
  param2: z.string(),
} );

// define tools
const myTool = new DynamicStructuredTool({
  name: "Tool Name",
  description: "Tool description",
  func: async (params) => {
    // tool code
  },
  schema: toolSchema,
  afterCallback(result, context) {
    // do something after tool call
  },
});

const config: ChatSDKConfig = {
  messages: [
    {
      id: Date.now().toString(),
      type: "system",
      content: "",
      rawChatBody: {
        role: "system",
        content: systemMessage,
      },
    },
  ],
  // use tools as config
  tools: [myTool],
  // use tools: hederaChatTools for our provided tools.
};
// in main.tsx/main.tsx
<ChatSDK config={config}>
  <App />
</ChatSDK>;
```
Apart from this you can also dynamically change tools by calling setTools from useChatSDK.
### Using PreAdd Custom Messages

You can pre add messages, this is useful for system messages or restoring the conversation 

```tsx
import { ChatSDKConfig } from "hederachat";

const config: ChatSDKConfig = {
  messages: [
    {
      id: Date.now().toString(),
      type: "system",
      content: "",
      rawChatBody: {
        role: "system",
        content: systemMessage,
      },
    },
  ],
};

// in main.tsx/main.tsx
<ChatSDK config={config}>
  <App />
</ChatSDK>;
```

## API Reference

### `ChatSDK`

Props:

- `config: ChatSDKConfig`
- `children: ReactNode`

### `useChatSDK`

Returns:

- `messages: Message[]`
- `addMessage: (message: Message) => void`
- `updateMessage: (id: string, updates: Partial<Message>) => void`
- `removeMessage: (id: string) => void`
- `clearMessages: () => void`
- `addMessages: (messages: Message[]) => void`
- `tools: Tool[]`
- `setTools: (tools: Tool[]) => void`
- `getSystemMessage: () => Message | null`
- `updateSystemMessage: (message: Message) => void`

### `useAIChat`

Props:

- `config: ChatConfig<C>`

Returns:

- `inProgress: boolean`
- `error: string | null`
- `setContext: (context: C) => void`
- `context: C | undefined`

## Customization

The ChatSDK offers several ways to customize its behavior:

1. **Custom Message Processor**: Provide your own `messageProcessor` to `useAIChat` for complete control over how messages are processed.

2. **Tools**: Define custom tools that can be invoked by the AI, extending the capabilities of your chat application.

3. **Context**: Use the `context` prop in `useAIChat` to provide additional data or functions to your chat logic.

4. **UI Customization**: The SDK doesn't impose any UI constraints, allowing you to create your own custom chat interface.

## Benefits

1. **Flexibility**: Easily swap out AI models or message processing logic without changing your UI code.

2. **State Management**: Built-in state management for messages and tools, reducing boilerplate in your application.

3. **TypeScript Support**: Full TypeScript support for improved developer experience and type safety.

4. **Extensibility**: The tool system allows for easy addition of new capabilities to your chat application.

5. **Decoupled Logic**: The separation of state (ChatSDK) and logic (useAIChat) allows for easier testing
