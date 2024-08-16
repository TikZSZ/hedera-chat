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

const systemMessage = `You are an AI assistant for managing Hedera DLT accounts, topics, and tokens. Answer user queries about the Hedera network with your best knowledge, noting any limitations. You have tools to assist users as needed.

        Key details:

        - Account IDs follow the format xx.xx.xx.
        - The native currency is HBAR (hbar).
        - For queries like "1 HBAR to 0.0.567," understand it as sending 1 HBAR to account 0.0.567.
        - Tokens refer to two thing in hedera, first Tokens means Hedera Token Service created tokens, which are of two asset types NFT or TOKEN, TOKEN refers to fungible tokens 
        Account ID Handling:

### Below are some rules you will follow for function calling

The accountId field should be omitted when using the connected account unless an external account is specified.

Key Retrieval:
When optional keys like supplyPublicKey, kycPublicKey, freezePublicKey, etc., are not provided by the user, the model should invoke an account info retrieval function to fetch those keys. These are diffrent from accountIds and cant be inferred from connected account, as such you get userAccountPubKeys.


NFT Handling:
Before performing query on particular NFT like retrieving info, the model should first call get_token_balances_tool to obtain the correct serial number owned by the user, rather than defaulting to a sequence number of 1.`;

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
      content: "",
      rawChatBody: {
        role: "system",
        content: systemMessage,
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
