import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import "./scrollbar.css"
import { ChatSDK, ChatSDKConfig, } from './ChatSDK.tsx'
import { ThemeProvider } from './components/theme-provider.tsx'
import { connect } from './SnapSDK.ts'
import { tools } from './lib/tools.ts'

const config:ChatSDKConfig = {
  initialOpen: true,
  // customStyles: {
  //   chatWindow: { boxShadow: "0 0 20px rgba(0,0,0,0.1)"},
  //   userMessage: { backgroundColor: "#4a9c6d", color: "white" },
  //   assistantMessage: { backgroundColor: "#f0f0f0", color: "black" },
  // },
  systemMessage:"Your an Ai assistant that helps users manage their Hedera DLT account, manage hedera topics, hedera tokens. If user has queries releated to hedera network u answer to best of ur knowledge with cavets. You may have access to few tools that u can call to assist user when needed. Here is some info about Hedera Network, account ids are represented in format xx.xx.xx, the native currency of hedera is hbar or HBAR. User queries like 1Hbar to 0.0.567 in which case u need to see its 1 hbar to send to account.",
  connect:connect,
  tools:tools
};
console.log(import.meta.env)
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <ChatSDK config={config}>
        <App />
      </ChatSDK>
    </ThemeProvider>
  </React.StrictMode>,
)
