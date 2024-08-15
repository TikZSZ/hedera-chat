import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"; // Import DropdownMenu components
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWallet } from "@/contexts/hashconnect";
import { Skeleton } from "./ui/skeleton";
import { useChatSDK } from "@/HederaChat";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import React from "react";

const LoadingNavItems = () => (
  <div className="flex items-center space-x-4">
    <Skeleton className="h-10 w-20" />
    <Skeleton className="h-10 w-20" />
    <Skeleton className="h-10 w-10 rounded-full" />
  </div>
);

const NavItemsContent = ({ isLoading, children }:any) => {
  if (isLoading) {
    return <LoadingNavItems />;
  }
  return children;
};

const NavItems = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const {
    connectToExtension,
    disconnect,
    accountIds,
    setSelectedAccount,
    selectedAccount,
    isConnected,
    init,
    hashconnect,
  } = useWallet();


  const handleLogout = async () => {
    try {
      await logout();
      navigate("/"); // Redirect to the homepage or another route after logout
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };


  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (

      <>
        <Button variant="ghost" className="mr-4">
          Docs
        </Button>
        <Button variant="ghost" className="mr-4">
          Pricing
        </Button>
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="mr-4 md:mr-0" asChild>
              <Button variant="ghost" className="p-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={"/default-avatar.png"} alt={user.name} />
                  <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isConnected ? (
                <>
                  <DropdownMenuLabel>Wallet</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={selectedAccount!}
                    onValueChange={setSelectedAccount}
                  >
                    {accountIds?.map((account) => (
                      <DropdownMenuRadioItem key={account} value={account}>
                        <Wallet className="mr-2 h-4 w-4" />
                        {truncateAddress(account)}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => disconnect()}>
                    Disconnect Wallet
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={() => connectToExtension()}>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <Button
              onClick={() => navigate("/login")}
              variant="default"
              className="mr-4"
            >
              Log In
            </Button>
            {/* <Button onClick={() => connectToExtension()} variant="outline">
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button> */}
          </>
        )}
      </>
  );
};

export default React.memo(NavItems);
