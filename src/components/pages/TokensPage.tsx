import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Search, Plus, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { type Token } from "@/HederaChat/utils/HederaAPIs/TokenAPIs";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/contexts/hashconnect";
import { appwriteService } from "@/appwrite/config";
import { Client, tokenUtils } from "@tikz/hedera-mirror-node-ts";
import LoadingComponent from "../LoadingComponent";
import ErrorComponent from "../ErrorComponent";
import { useChatState } from "@/contexts/useChatState";
import { useChatSDK } from "@/HederaChat";


const TokenPage = () => {
  const {user} = useAuth()
  const {selectedAccount,isConnected,pairingData,isLoading} = useWallet()
  const { setInputValue, setIsMinimized } = useChatState();
  const {addMessage} = useChatSDK()
  if (!isConnected) return <ErrorComponent message="Wallet Not Connected" />;
  if (isLoading) return <LoadingComponent/>;

  const { data: tokens, error, isPending, isError } = useQuery({
    queryKey: ["tokens",selectedAccount,pairingData?.network],
    queryFn: async () => {
      if(!isConnected) throw new Error("Wallet Not Connected")
      if(!selectedAccount) throw new Error("Wallet connected but no accounts selected")
      const client = new Client(
          `https://${pairingData!.network}.mirrornode.hedera.com`
        );
      // const docs = await appwriteService.listTokens(selectedAccount!,user!.$id)
      // if(!docs) return []
      // return docs.documents as any
      const tokensCursor = tokenUtils(client)
      const {tokens} = await tokensCursor.Tokens.setAccountId(selectedAccount).order("desc").get()
      return tokens 
    },retry:()=>isConnected
  });
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTokens =
    tokens &&
    tokens.filter(
      (token) =>
        token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isPending) return <LoadingComponent/>;

    if (isError) return <ErrorComponent message={error.message} />;
// "Create a new token (NFT) for housing warranties, user will mint nfts under it to issue a warranty to their customers, as such for this use case a wipeKey, freezeKey and pauseKey might be required, explain the user what these do and ask if they want to specify any of them and also if they would like to cap how many warranties they can mint under this token or not"}
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tokens</h1>
        <Button className="flex items-center" onClick={()=>{
          addMessage({
            id:new Date().toString(),
            content:"",
            isVisible:false,
            type:"system",
            rawChatBody:{role:"system",content:"You are an AI assitant that helps users manage their shop warranties that are issued as NFTs, housed under a token for the shop, user will mint nfts under it to issue a warranty to their customers, as such for this use case a wipeKey, freezeKey and pauseKey might be required, explain the user what these do and ask if they want to specify any of them and also if they would like to cap how many warranties they can mint under this token or not. Confirm the name and symbol for shoft nft"}
          })
          setInputValue("Create new Shop token")
          setIsMinimized(false)
        }}>
          <Plus className="mr-2 h-4 w-4" /> Create A Shop
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Token Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tokens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Token Type</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTokens &&
                filteredTokens.map((token) => (
                  <TableRow
                    key={token.token_id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="font-medium">{token.name}</TableCell>
                    <TableCell>{token.symbol}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Coins className="mr-2 h-4 w-4 text-muted-foreground" />
                        {token.type}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        to={{
                          pathname: `/dashboard/tokens/${token.token_id}`,
                          search: `?network=${pairingData?.network || "testnet"}`,
                        }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center"
                        >
                          View Details <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenPage;
