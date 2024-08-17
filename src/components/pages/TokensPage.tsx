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

export const useTokensQuery = () => {
  return useQuery({
    queryKey: ["tokens"],
    queryFn: (): Token[] => {
      const tokensSTR = localStorage.getItem("tokens");
      if (tokensSTR) {
        return JSON.parse(tokensSTR);
      }
      return [];
    },
  });
};

const TokenPage = () => {
  // const [tokens, setTokens] = useState<Token[]>([
  //   { id: "1", name: "Hedera Token", symbol: "HBAR", balance: 1000 },
  //   { id: "2", name: "Custom Token", symbol: "CTK", balance: 500 },
  // ]);
  const { data: tokens, error, isPending, isError } = useTokensQuery();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTokens =
    tokens &&
    tokens.filter(
      (token) =>
        token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (isPending) return "Loading...";

  if (isError) return "An error has occurred: " + error.message;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tokens</h1>
        <Button className="flex items-center">
          <Plus className="mr-2 h-4 w-4" /> Create New Token
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
                <TableHead>Balance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTokens &&
                filteredTokens.map((token) => (
                  <TableRow
                    key={token.tokenId}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="font-medium">{token.name}</TableCell>
                    <TableCell>{token.symbol}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Coins className="mr-2 h-4 w-4 text-muted-foreground" />
                        {token.assetType}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        to={{
                          pathname: `/dashboard/tokens/${token.tokenId}`,
                          search: `?network=${token.network}`,
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
