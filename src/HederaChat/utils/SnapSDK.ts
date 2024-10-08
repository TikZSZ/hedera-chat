const snapId = `npm:@hashgraph/hedera-wallet-snap`;
import { MetaMaskInpageProvider } from "@metamask/providers";


declare global
{
  interface Window
  {
    ethereum: MetaMaskInpageProvider
  }
}

export const getProvider = async () =>
{
  let mmFound = false;
  if ( "detected" in window.ethereum )
  {
    for ( const provider of window.ethereum.detected as any )
    {
      console.log( "provider found", provider )
      try
      {
        // Detect snaps support
        await provider.request( {
          method: "wallet_getSnaps"
        } );
        // @ts-ignore
        // enforces MetaMask as provider
        window.ethereum.setProvider( provider );

        mmFound = true;
        return provider;
      } catch
      {
        // no-op
      }
    }
  }

  if ( !mmFound && "providers" in window.ethereum )
  {
    // @ts-ignore
    for ( const provider of window.ethereum.providers )
    {
      try
      {
        // Detect snaps support
        await provider.request( {
          method: "wallet_getSnaps"
        } );

        window.ethereum = provider;

        mmFound = true;
        return provider;
      } catch
      {
        // no-op
      }
    }
  }

  return window.ethereum;
};

// Get permissions to interact with and install the Hedera Wallet Snap
export async function connect (): Promise<boolean>
{
  const provider = await getProvider() as MetaMaskInpageProvider;
  console.log( "provider", provider === window.ethereum )
  let snaps = await provider.request( {
    method: "wallet_getSnaps"
  } );
  // console.log("Installed snaps: ", snaps);

  try
  {
    const result = await provider.request( {
      method: "wallet_requestSnaps",
      params: {
        [ snapId ]: {}
      }
    } );
    // console.log("result: ", result);

    snaps = await provider.request( {
      method: "wallet_getSnaps"
    } );
    // console.log("snaps: ", snaps);

    if ( snaps && snapId in snaps )
    {
      // the snap is installed
      console.log( "Hedera Wallet Snap is installed" );
      return true
    } else
    {
      console.log(
        "Hedera Wallet Snap is not installed. Please install it at https://snaps.metamask.io/snap/npm/hashgraph/hedera-wallet-snap"
      );
      alert(
        "Hedera Wallet Snap is not installed. Please install it at https://snaps.metamask.io/snap/npm/hashgraph/hedera-wallet-snap"
      );
      return false
    }

  } catch ( e )
  {
    console.log(
      `Failed to obtain installed snaps: ${JSON.stringify( e, null, 4 )}`
    );
    alert( `Failed to obtain installed snaps: ${JSON.stringify( e, null, 4 )}` );
    return false
  }
}

export type RequestArguments = {
  /** The RPC method to request. */
  method: string;
  /** The params of the RPC method, if any. */
  params?: { request: { method: string, params: Record<string, any> } };
};
export const handleHelloAPI = async () =>
{
  const resp = await window.ethereum.request( {
    method: 'wallet_invokeSnap',
    params: {
      snapId,
      request: {
        method: 'hello',
        params: {
          network: 'testnet',
          mirrorNodeUrl: 'https://testnet.mirrornode.hedera.com'
        }
      }
    }
  } )
  console.log( resp )
  return resp
}

// Interact with 'hello' API of Hedera Wallet Snap
export async function handleSnapAPIRequest ( params: RequestArguments[ "params" ] )
{
  if ( params && params.request.params[ "network" ] )
  {
    params.request.params[ "mirrorNodeUrl" ] = `https://${params.request.params[ "network" ]}.mirrornode.hedera.com`
  }
  const provider = await getProvider();
  const response = await provider.request( {
    method: "wallet_invokeSnap",
    params: { ...params, snapId }
  } );
  return response
}
