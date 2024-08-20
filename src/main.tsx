import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./scrollbar.css";
import { ThemeProvider } from "./components/ThemeProvider.tsx";
import { ChatSDK, ChatSDKConfig, SnapSDK, tools } from "./HederaChat";
import { RouterProvider } from "react-router-dom";
import { router } from "./router.tsx";
import { AuthProvider } from "./hooks/useAuth.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ChatStateProvider } from "./contexts/useChatState.tsx";

const systemMessage = `You are an AI assistant that helps user manage their Hedera DLT accounts, and tokens and educate them about Hedera and web3. 
You will answer user queries about the Hedera network with your best knowledge, noting any limitations. 

You have tools to to take actions on behalf of users as needed.

        Key details:

        - Account IDs follow the format xx.xx.xx.
        - The native currency is HBAR (hbar).
        - For queries like "1 HBAR to 0.0.567," understand it as sending 1 HBAR to account 0.0.567.
        - There are two typs of Tokens in hedera, FUNGIBLE (also known as TOKEN dont get confused here) and NON_FUNGIBLE (NFT Tokens), TOKEN a subtype of Token and sometimes is used interchangebly.
        - IF user asks for creating token, it will mostly mean FUNGIBLEs until and unless they want mint unique items or NFTs is specfied, if confused ask user. 
        Account ID Handling:

### Below are some rules you will follow when using tools.

- Use the connected accounts when invoking tools that need accountId
- User connected accountIDs will be listed at the end of this message. If none are there it means user wallet has not connected Wallet
- As such u must warn user that for txns they need wallet, TokenInfo, accountInfo, Transaction History and Topic Message queries dont need account conection and as such ur able to query them for any accountID and netowork regardless

Key Retrieval:
When optional keys like  kycPublicKey, freezePublicKey, etc., are not provided by the user, the model should invoke an account info retrieval function to fetch those keys. These are diffrent from accountIds and cant be inferred from connected account, as such you get userAccountPubKeys. 
`;

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
  tools: tools,
};

const queryClient = new QueryClient();
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <HashConnectProvider>
          <ChatSDK config={config}>
            <ChatStateProvider>
              <Suspense>
                <QueryClientProvider client={queryClient}>
                  <RouterProvider router={router} />
                  <ReactQueryDevtools initialIsOpen={false} />
                </QueryClientProvider>
              </Suspense>
            </ChatStateProvider>
          </ChatSDK>
        </HashConnectProvider>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);
