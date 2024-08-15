import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./scrollbar.css";
import { ThemeProvider } from "./components/theme-provider.tsx";
import { ChatSDK, ChatSDKConfig, SnapSDK, tools } from "./HederaChat";
import { RouterProvider } from "react-router-dom";
import { router } from "./router.tsx";
import { AuthProvider } from "./hooks/useAuth.tsx";

const HashConnectProvider = lazy(() => import("./contexts/hashconnect.tsx"));
const config: ChatSDKConfig = {
  initialOpen: true,
  // customStyles: {
  //   chatWindow: { boxShadow: "0 0 20px rgba(0,0,0,0.1)"},
  //   userMessage: { backgroundColor: "#4a9c6d", color: "white" },
  //   assistantMessage: { backgroundColor: "#f0f0f0", color: "black" },
  // },
  messages: [
    {
      id: Date.now().toString(),
      type: "system",
      rawChatBody: {
        role: "system",
        content:
          "Your an Ai assistant that helps users manage their Hedera DLT account, manage hedera topics, hedera tokens. If user has queries releated to hedera network u answer to best of ur knowledge with cavets. You may have access to few tools that u can call to assist user when needed. Here is some info about Hedera Network, account ids are represented in format xx.xx.xx, the native currency of hedera is hbar or HBAR. User queries like 1Hbar to 0.0.567 in which case u need to see its 1 hbar to send to account.",
      },
    },
  ],
  connect: SnapSDK.connect,
  tools: tools,
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <ChatSDK config={config}>
          <Suspense>
            <HashConnectProvider>
              <RouterProvider router={router} />
            </HashConnectProvider>
          </Suspense>
        </ChatSDK>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);
