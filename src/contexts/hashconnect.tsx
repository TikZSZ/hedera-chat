import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import type { HashConnect,SessionData } from "hashconnect";
import { type DappMetadata, HashConnectConnectionState } from "hashconnect/dist/types";
import { hashconnect} from "@/hashconnect";

export type HashConnectContent = {
    accountIds?:string[],
    setAccountIds: Function,
    selectedAccount:string|null
    setSelectedAccount:(accountId:string)=>void
    pairingData: SessionData | null,
    state: HashConnectConnectionState,
    hashconnect: HashConnect | null
    connectToExtension: Function,
    disconnect: Function,
    init:Function
    isConnected:boolean
    // sendTransaction: Function,
}
const HashConnectContext = createContext<HashConnectContent>({
  accountIds: [""],
  setAccountIds: (accountId:string) => {},
  pairingData: null,
  hashconnect: null,
  state: HashConnectConnectionState.Disconnected,
//   sendTransaction: () => {},
  connectToExtension: () => {},
  disconnect: () => {},
  init:()=>{},
  isConnected:false
} as any as HashConnectContent);

const appMetadata: DappMetadata = {
  name: "dApp Example",
  description: "An example hedera dApp",
  icons: ["https://www.hashpack.app/img/logo.svg"],
  url: "http://localhost:5173",
};

const projectId = "e49ed79ed340742be3e313a3405f03fc";

// let hashconnect = new HashConnect(
//   LedgerId.TESTNET,
//   projectId,
//   appMetadata,
//   false
// );

export default function HashConnectProvider({ children }: PropsWithChildren) {
  const [accountIds, setAccountIds] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [selectedAccount, setSelectedAccount] = useState<string|null>(null);
  const [pairingString, setPairingString] = useState<string|undefined>("");
  const [pairingData, setPairingData] =
    useState<SessionData | null>(null);

  const [state, setState] = useState(HashConnectConnectionState.Disconnected);

//   useEffect(() => {
//     init();
//   }, []);

  const init = async () => {
    // hashconnect = new HashConnect(
    //     LedgerId.TESTNET,
    //     projectId,
    //     appMetadata,
    //     false
    //   );
    //register events
    
    //initialize
    setUpHashConnectEvents();
    await hashconnect.init();
  };

  useEffect(()=>{
    if(pairingData && pairingData.accountIds.length > 0) {
      setIsConnected(true)
    }else{
      setIsConnected(false)
    }
  },[pairingData])

  const setUpHashConnectEvents = () => {

    //This is fired when a wallet approves a pairing
    hashconnect.pairingEvent.on((data) => {
      console.log("Paired with wallet", data);
      if(data){
        setPairingData(data);
        setAccountIds(data.accountIds)
        setSelectedAccount(data.accountIds[0])
      }
    });

    hashconnect.disconnectionEvent.on(() => {
      setPairingData(null);
      setAccountIds([])
      setState(HashConnectConnectionState.Disconnected)
    });

    //This is fired when HashConnect loses connection, pairs successfully, or is starting connection
    hashconnect.connectionStatusChangeEvent.on((state) => {
      console.log("hashconnect state change event", state);
      setState(state);
    });
  };

  const connectToExtension = async () => {
    //this will automatically pop up a pairing request in the HashConnect extension
    hashconnect.openPairingModal();
  };

//   const sendTransaction = async (
//     trans: Uint8Array,
//     acctToSign: string,
//     return_trans: boolean = false,
//     hideNfts: boolean = false
//   ) => {
//     const transaction: Transaction = {
//       acc: topic,
//       byteArray: trans,

//       metadata: {
//         accountToSign: acctToSign,
//         returnTransaction: return_trans,
//         hideNft: hideNfts,
//       },
//     };
//     Transaction

//     return await hashconnect.sendTransaction(topic, transaction);
//   };

//   const requestAccountInfo = async () => {
//     let request: MessageTypes.AdditionalAccountRequest = {
//       topic: topic,
//       network: "testnet",
//       multiAccount: true,
//     };

//     await hashconnect.requestAdditionalAccounts(topic, request);
//   };

  const disconnect = async () => {
    await hashconnect.disconnect();
  };


  return (
    <HashConnectContext.Provider
      value={{
        // hcData,
        init,
        hashconnect,
        accountIds,
        setAccountIds,
        pairingData,
        state,
        connectToExtension,
        disconnect,
        isConnected,
        selectedAccount,
        setSelectedAccount
        // sendTransaction,
      }}
    >
      {children}
    </HashConnectContext.Provider>
  );
}

export function useWallet() {
  return useContext(HashConnectContext);
}
