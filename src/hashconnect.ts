import  { AccountId, Transaction,LedgerId } from "@hashgraph/sdk";
import { type DappMetadata,HashConnect } from "hashconnect";

const appMetadata: DappMetadata = {
    name: "dApp Example",
    description: "An example hedera dApp",
    icons: [ "https://www.hashpack.app/img/logo.svg" ],
    url: import.meta.env["DEV"] ?"http://localhost:5173":"https://precise-jaguar-properly.ngrok-free.app/",
};

const projectId = "e49ed79ed340742be3e313a3405f03fc";

export let hashconnect = new HashConnect(
    LedgerId.TESTNET,
    projectId,
    appMetadata,
    false
);
// @ts-ignore
export const getConnectedAccountIds = () =>
{
    return hashconnect.connectedAccountIds;
};
// export const hashconnectInitPromise = hashconnect.init;


export const signTransaction = async (
    trans: Transaction,
    accountIdForSigning?: AccountId
) =>
{
    // await hashconnectInitPromise;
    const accountIds = getConnectedAccountIds();
    if(!accountIdForSigning){
        accountIdForSigning = accountIds[0]
    }
    if ( !accountIds )
    {
        throw new Error( "No connected accounts" );
    }

    const isAccountIdForSigningPaired = accountIds.some(
        ( id ) => id.toString() === accountIdForSigning.toString()
    );
    if ( !isAccountIdForSigningPaired )
    {
        throw new Error( `Account ${accountIdForSigning} is not paired` );
    }

    const result = await hashconnect.signTransaction( accountIdForSigning, trans );
    return result;
};

export const executeTransaction = async (
    accountIdForSigning: AccountId,
    trans: Transaction
) =>
{
    // await hashconnectInitPromise;

    const accountIds = getConnectedAccountIds();
    if ( !accountIds )
    {
        throw new Error( "No connected accounts" );
    }

    const isAccountIdForSigningPaired = accountIds.some(
        ( id ) => id.toString() === accountIdForSigning.toString()
    );
    if ( !isAccountIdForSigningPaired )
    {
        throw new Error( `Account ${accountIdForSigning} is not paired` );
    }

    const result = await hashconnect.sendTransaction( accountIdForSigning, trans );
    return result;
};

export const signMessages = async (
    accountIdForSigning: AccountId,
    message: string
) =>
{
    // await hashconnectInitPromise;

    const accountIds = getConnectedAccountIds();
    if ( !accountIds )
    {
        throw new Error( "No connected accounts" );
    }

    const isAccountIdForSigningPaired = accountIds.some(
        ( id ) => id.toString() === accountIdForSigning.toString()
    );
    if ( !isAccountIdForSigningPaired )
    {
        throw new Error( `Account ${accountIdForSigning} is not paired` );
    }

    const result = await hashconnect.signMessages( accountIdForSigning, message );
    return result;
};