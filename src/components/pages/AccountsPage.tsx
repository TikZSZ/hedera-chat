import React, { useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { User, Key, Calendar, Coins } from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { Client, Accounts } from "@tikz/hedera-mirror-node-ts";


const accountId = "0.0.4653631";
const network = "testnet";
const AccountPage = () => {

  const {
    data: accountInfo,
    error,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["Account", accountId],
    queryFn: async () => {
      const client = new Client(`https://${network}.mirrornode.hedera.com`);
      const accountsCursor = Accounts.v1(client);
      const { accounts: accs } = await accountsCursor
        .setAccountId(accountId)
        .get();
      return accs[0];
    },
  });

  const getDate = useCallback(
    (timeStamp: string) => {
      const [seconds, nanoSeconds] = timeStamp.split(".");
      const date = new Date();
      date.setTime(parseInt(seconds) * 1000);
      return date.toLocaleString();
    },
    [accountInfo]
  );

  if (isPending) return "Loading...";

  if (isError) return "An error has occurred: " + error.message;

  return (
    <div className="space-y-6 ">
      <h1 className="text-3xl font-bold">Account Information</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2" /> Account Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="font-medium">Account ID:</dt>
                <dd>{accountInfo.account}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Memo:</dt>
                <dd>{accountInfo.memo}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Created:</dt>
                <dd>{getDate(accountInfo.created_timestamp)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Max Auto Token Associations:</dt>
                <dd>{accountInfo.max_automatic_token_associations}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="mr-2" /> Account Key
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="font-medium">Key Type:</dt>
                <dd>{accountInfo.key._type}</dd>
              </div>
              <div>
                <dt className="font-medium">Public Key:</dt>
                <dd className="break-all text-sm mt-1">
                  {accountInfo.key.key}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Coins className="mr-2" /> Balance & Tokens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <span className="text-lg font-medium">Current Balance: </span>
            <span className="text-2xl font-bold">
              {accountInfo.balance.balance} HBAR
            </span>
            <div className="text-sm text-muted-foreground">
              Last updated: {getDate(accountInfo.balance.timestamp)}
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token ID</TableHead>
                <TableHead>Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountInfo.balance.tokens.map((token) => (
                <TableRow key={token.token_id}>
                  <TableCell>{token.token_id}</TableCell>
                  <TableCell>{token.balance}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountPage;
