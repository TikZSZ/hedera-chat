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

ChatSDK is a flexible and powerful React-based SDK for building chat applications. It provides a state management solution and hooks for easy integration with AI models, making it ideal for creating conversational interfaces.

## Installation

```bash
npm install chat-sdk
```

## Basic Usage

To use the ChatSDK in your React application, follow these steps:

1. Wrap your application or chat component with the `ChatSDK` provider:

```jsx
import { ChatSDK } from 'chat-sdk';

const App = () => {
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

```jsx
import { useChatSDK, useAIChat } from 'chat-sdk';

const ChatBox = () => {
  const { messages, addMessage } = useChatSDK();
  const { inProgress, setContext } = useAIChat({
    params: { model: "gpt-4-mini" },
    context: { /* Your context object */ },
  });

  // ... rest of your component logic
};
```

3. Implement the chat interface:

```jsx
const ChatBox = () => {
  // ... previous code

  const [inputValue, setInputValue] = useState('');

  const handleSend = async () => {
    if (inputValue.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        type: "user",
        content: inputValue,
        isVisible: true,
        rawChatBody: { role: "user", content: inputValue },
      };
      
      addMessage(newMessage);
      setInputValue("");
    }
  };

  return (
    <div>
      {/* Render messages */}
      {messages.map(message => (
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

```jsx
const customMessageProcessor = async (messages, params) => {
  // Your custom logic here
};

const { inProgress } = useAIChat({
  params: { model: "gpt-4-mini" },
  messageProcessor: customMessageProcessor,
});
```

### Using Tools

You can define and use custom tools with the ChatSDK:

```jsx
const myTool = {
  name: 'myCustomTool',
  toolDef: {
    // Tool definition
  },
  invoke: async (params, context) => {
    // Tool implementation
  },
};

const config = {
  tools: [myTool],
};

<ChatSDK config={config}>
  {/* Your chat component */}
</ChatSDK>
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

5. **Decoupled Logic**: The separation of state (ChatSDK) and logic (useAIChat) allows for easier testi