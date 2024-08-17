import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, FileText, ArrowLeft } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { Client, nftUtils, TokenTypeFilter, tokenUtils } from '@tikz/hedera-mirror-node-ts';
import { Tokens } from '@tikz/hedera-mirror-node-ts/dist/RestMirrorNode/tokenBaseClasses';


const TokenDetailPage = () => {
  console.log("hi")
    const { tokenId } = useParams<{ tokenId: string }>();
    const [searchParams] = useSearchParams();
    // const [token, setToken] = useState<Token | null>(null);
    // const [balances, setBalances] = useState<Balance[] | null>(null);
    // const [nfts, setNfts] = useState<NFT[] | null>(null);
    const [network,setNetwork] = useState(searchParams.get("network") || "testnet")
    const client = useMemo(()=>new Client(`https://${network}.mirrornode.hedera.com`),[network])
    const {
      data: token,
      error,
      isPending,
      isError,
    } = useQuery({
      queryKey: ["Token", tokenId],
      queryFn: async () => {
        const accountsCursor = Tokens.v1(client);
        const { tokens } = await accountsCursor
          .setTokenId(tokenId!)
          .get();
        return tokens[0];
      },
    });
    const assetType =  token && token.type

    const {
      data: balances,
    } = useQuery({
      queryKey: ["Balances", tokenId],
      queryFn: async () => {
        const TBCursor = tokenUtils(client).TokenBalance
        const { balances } = await TBCursor
          .setTokenId(tokenId!)
          .get();
        return balances;
      },
      enabled:(!!assetType && assetType === TokenTypeFilter.FUNGIBLE_COMMON.toUpperCase())
    });

    const {
      data: nfts,
    } = useQuery({
      queryKey: ["Balances", tokenId],
      queryFn: async () => {
        const NFTsCursor = nftUtils(client).NFTs
        const { nfts } = await NFTsCursor
          .setTokenId(tokenId!)
          .get();
        return nfts;
      },
      enabled:(!!assetType && assetType === TokenTypeFilter.NON_FUNGIBLE_UNIQUE.toUpperCase())
    });
  
  
    const getDate = useCallback(
      (timeStamp: string) => {
        const [seconds, nanoSeconds] = timeStamp.split(".");
        const date = new Date();
        date.setTime(parseInt(seconds) * 1000);
        return date.toLocaleString();
      },
      []
    );
  
    if (isPending) return "Loading...";
  
    if (isError) return "An error has occurred: " + error.message;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">{token.name} ({token.symbol})</h1>
                <Link to="/dashboard/tokens">
                    <Button variant="outline" className="flex items-center">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tokens
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Token Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <dt className="font-medium">Token ID:</dt>
                            <dd>{token.token_id}</dd>
                        </div>
                        <div>
                            <dt className="font-medium">Type:</dt>
                            <dd>{token.type}</dd>
                        </div>
                        <div>
                            <dt className="font-medium">Decimals:</dt>
                            <dd>{token.decimals}</dd>
                        </div>
                        <div>
                            <dt className="font-medium">Admin Key Type:</dt>
                            <dd>{token.admin_key?._type || 'N/A'}</dd>
                        </div>
                    </dl>
                </CardContent>
            </Card>

            {/* <Card>
                <CardHeader>
                    <CardTitle>Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                        {token.metadata}
                    </pre>
                </CardContent>
            </Card> */}

            <Tabs defaultValue={token.type === "FUNGIBLE_COMMON" ? "balances" : "nfts"}>
                <TabsList>
                    {token.type === "FUNGIBLE_COMMON" && <TabsTrigger value="balances">Balances</TabsTrigger>}
                    {token.type === "NON_FUNGIBLE_UNIQUE" && <TabsTrigger value="nfts">NFTs</TabsTrigger>}
                </TabsList>
                {token.type === "FUNGIBLE_COMMON" && (
                    <TabsContent value="balances">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Coins className="mr-2" /> Token Balances
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Account</TableHead>
                                            <TableHead>Balance</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {balances?.map((balance, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{balance.account}</TableCell>
                                                <TableCell>{balance.balance / Math.pow(10, balance.decimals)} {token.symbol}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
                {token.type === "NON_FUNGIBLE_UNIQUE" && (
                    <TabsContent value="nfts">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <FileText className="mr-2" /> NFTs
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Serial Number</TableHead>
                                            <TableHead>Owner</TableHead>
                                            <TableHead>Minted</TableHead>
                                            <TableHead>Metadata</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {nfts?.map((nft, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{nft.serial_number}</TableCell>
                                                <TableCell>{nft.account_id}</TableCell>
                                                <TableCell>{getDate(nft.created_timestamp).toLocaleString()}</TableCell>
                                                <TableCell className="truncate max-w-xs">{atob(nft.metadata)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
};

export default TokenDetailPage;