import { useEffect } from "react";
const snapId = `npm:@hashgraph/hedera-wallet-snap`;
import { MetaMaskInpageProvider } from "@metamask/providers";

declare global {
  interface Window {
      ethereum: MetaMaskInpageProvider
  }
}

const getProvider = async () => {
  let mmFound = false;
  if ("detected" in window.ethereum) {
    for (const provider of window.ethereum.detected as any) {
      console.log("provider found",provider)
      try {
        // Detect snaps support
        await provider.request({
          method: "wallet_getSnaps"
        });
        // enforces MetaMask as provider
        window.ethereum.setProvider(provider);

        mmFound = true;
        return provider;
      } catch {
        // no-op
      }
    }
  }

  if (!mmFound && "providers" in window.ethereum) {
    for (const provider of window.ethereum.providers) {
      try {
        // Detect snaps support
        await provider.request({
          method: "wallet_getSnaps"
        });

        window.ethereum = provider;

        mmFound = true;
        return provider;
      } catch {
        // no-op
      }
    }
  }

  return window.ethereum;
};

// Get permissions to interact with and install the Hedera Wallet Snap
async function connect() {
  console.log("snap id", snapId);
  const provider = await getProvider() as MetaMaskInpageProvider;
  console.log("provider",provider===window.ethereum)
  let snaps = await provider.request({
    method: "wallet_getSnaps"
  });
  console.log("Installed snaps: ", snaps);

  try {
    const result = await provider.request({
      method: "wallet_requestSnaps",
      params: {
        [snapId]: {}
      }
    });
    console.log("result: ", result);
    
    snaps = await provider.request({
      method: "wallet_getSnaps"
    });
    console.log("snaps: ", snaps);

    if (snaps && snapId in snaps) {
      // the snap is installed
      console.log("Hedera Wallet Snap is installed");
    } else {
      console.log(
        "Hedera Wallet Snap is not installed. Please install it at https://snaps.metamask.io/snap/npm/hashgraph/hedera-wallet-snap"
      );
      alert(
        "Hedera Wallet Snap is not installed. Please install it at https://snaps.metamask.io/snap/npm/hashgraph/hedera-wallet-snap"
      );
    }
  } catch (e) {
    console.log(
      `Failed to obtain installed snaps: ${JSON.stringify(e, null, 4)}`
    );
    alert(`Failed to obtain installed snaps: ${JSON.stringify(e, null, 4)}`);
  }
}

// Interact with 'hello' API of Hedera Wallet Snap
async function handleSnapAPIRequest() {
  console.log("Interacting with 'hello' API of Hedera Wallet Snap");
  try {
    const provider = await getProvider();
    const response = await provider.request({
      method: "wallet_invokeSnap",
      params: {
        snapId,
        request: { method: "hello", params: { network: "testnet" } }
      }
    });
    const response_str = JSON.stringify(response, null, 4);
    console.log("response: ", response_str);
    if (response_str && response_str != "null") {
      alert(response_str);
    }
  } catch (err:any) {
    console.error(err);
    alert("Error while interacting with the snap: " + err.message || err);
  }
}

const getAccountInfoAPI = async () => {
  
  try {
    const externalAccountParams = {
      externalAccount: {
        accountIdOrEvmAddress: '0.0.12345',
        curve: 'ED25519'
      }
    }
    const provider = await getProvider();
    const response = await provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId,
        request: {
          method: 'getAccountInfo',
          params: {
            network: 'testnet',
            mirrorNodeUrl: 'https://testnet.mirrornode.hedera.com',
            // Pass 'accountId' is useful if you want to retrieve account info 
            // for someone else rather than yourself
            accountId: externalAccountParams.externalAccount.accountIdOrEvmAddress, 
          }
        }
      }
    })
    const response_str = JSON.stringify(response, null, 4);
    console.log("response: ", response_str);
    if (response_str && response_str != "null") {
      alert(response_str);
    }
  } catch (err:any) {
    console.error(err);
    alert("Error while interacting with the snap: " + err.message || err);
  }
}

const App = function () {
  useEffect(() => {

  })

  return (
    <div>
      <h1>Hello, Hedera Wallet Snap!</h1>
      <summary>Instructions:</summary>
      <ul>
        <li>
          First, click "Connect". This will check whether
          <a href="https://metamask.io/" target="_blank">
            Metamask
          </a>{" "}
          is installed and if so, it'll install Hedera Wallet Snap within
          Metamask.
        </li>
        <li>
          Whenever there is a new version of the Hedera Wallet Snap, always make
          sure to first uninstall the old version of the snap from Metamask and
          only then try this demo so it can use the latest version
        </li>
      </ul>
      <br />

      <button className="connect" onClick={connect}>Connect to Snap</button>
      <br />
      <hr />

      <button className="snapAPI" onClick={getAccountInfoAPI}>Send Hello</button>
      <br />
    </div>
  );
};

export default App;
