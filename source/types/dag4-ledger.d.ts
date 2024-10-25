declare module '@stardust-collective/dag4-ledger/src/lib/tx-transcode' {
    export function encodeTx(
      tx: string,
      embedSpaces: boolean,
      hashReference: boolean
    ): string;

    // You can declare other methods and exports here as needed
  }

declare module '@stardust-collective/dag4-ledger' {
    export type LedgerAccount = {
      publicKey: string;
      address: string;
      balance: string;
    };

    export class LedgerBridge {
      constructor(transport: any);

      getPublicKeys(startIndex: number, numberOfAccounts: number, onProgressUpdate: (update: number) => void): Promise<string[]>;

      getAccountInfoForPublicKeys(publicKeys: string[]): Promise<LedgerAccount[]>;

      signTransaction(publicKey: string, bipIndex: number, hash: string, ledgerEncodedTx: string): Promise<{ signature: string }>;

      sign(ledgerEncodedTx: string, bip44Index: number, messageTypeCode: string): Promise<{
        success: boolean;
        message: string;
        signature: string;
        }>;

      signMessage(message: any, bipIndex: number): Promise<string[]>;

      buildTx(amount: number, publicKey: string, bipIndex: number, fromAddress: string, toAddress: string): any;
    }
  }