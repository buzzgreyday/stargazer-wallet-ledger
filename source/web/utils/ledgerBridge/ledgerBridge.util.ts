import { LedgerBridge, LedgerAccount } from '@stardust-collective/dag4-ledger';
import * as txTranscodeUtil from '@stardust-collective/dag4-ledger/src/lib/tx-transcode';
// Import keystore transaction
import { TransactionV2, PostTransactionV2 } from '@stardust-collective/dag4-keystore';
//////////////////////////////
import webHidTransport from '@ledgerhq/hw-transport-webhid';
import { dag4 } from '@stardust-collective/dag4';
import { DAG_NETWORK } from 'constants/index';
import store from 'state/store';
// import PostTransactionV2 from '@stardust-collective/dag4-keystore/transaction-v2';

const MESSAGE_TYPE_CODES = {
  SIGN_TRANSACTION: "02",
  GET_PUBLIC_KEY: "04",
  SIGN_MESSAGE: "06"
}

/////////////////////////////
// Interface
/////////////////////////////


class LedgerBridgeUtil {

  /////////////////////////////
  // Properties
  /////////////////////////////

  /**
   * transport
   * Stores an instance of the web HID object
   */

  private transport: any;

  /**
   * ledgerBridge
   * Stores an instance of the LedgerBridge object
   */
  private ledgerBridge: LedgerBridge;

  /**
   * startIndex
   * The starting index to look up accounts.
   */

  public startIndex: number = 0;

  /**
   * onProgressUpdate
   * Called when the ledger bridged has loaded an account.
   */

  private onProgressUpdate: (update: number) => void;

  /////////////////////////////
  // Constants Properties
  ////////////////////////////

  /**
   * NUMBER_OF_ACCOUNTS
   * The number of accounts that should be fetched per page request.
   */

  // Pagination has been disabled source/web/pages/Ledger/views/accounts until support is added for multiple wallets
  //private readonly NUMBER_OF_ACCOUNTS = 5;
  private readonly NUMBER_OF_ACCOUNTS = 1;

  /////////////////////////////
  // Constructor
  /////////////////////////////

  constructor() {
    // Initialize required dependencies
    this.initialize();
  }

  /////////////////////////////
  // Private Methods
  /////////////////////////////

  private initialize = async () => {
    // Configure Dag4 network
    const { activeNetwork } = store.getState().vault;
    const dagNetworkValue = activeNetwork.Constellation;
    dag4.account.connect(
      {
        id: DAG_NETWORK[dagNetworkValue].id,
        networkVersion: DAG_NETWORK[dagNetworkValue].version,
        ...DAG_NETWORK[dagNetworkValue].config,
      },
      false
    );
  };

  private getAccountData = async (startIndex: number): Promise<LedgerAccount[]> => {
    // Close any existing connection before creating a new one.
    this.transport.close();
    // Begins requesting public keys from ledger
    const publicKeys = await this.ledgerBridge.getPublicKeys(
      startIndex,
      this.NUMBER_OF_ACCOUNTS,
      this.onProgressUpdate
    );
    const accountData = await this.ledgerBridge.getAccountInfoForPublicKeys(publicKeys);
    return accountData.map((d: LedgerAccount) => ({
      ...d,
      balance: Number(d.balance).toFixed(2).toString(),
    }));
  };

  /////////////////////////////
  // Public Methods
  /////////////////////////////

  public buildTransaction = (
    amount: number,
    publicKey: string,
    bipIndex: number,
    fromAddress: string,
    toAddress: string
  ) => {
    return this.ledgerBridge.buildTx(
      amount,
      publicKey,
      bipIndex,
      fromAddress,
      toAddress
    );
  };

  //////////////////////////////////////
  // ENABLE LEDGER TX SUPPORT (START)
  //////////////////////////////////////

  // Copied from node_modules\@stardust-collective\dag4-keystore\src\key-store.ts
  async generateTransactionWithHashV2 (amount: number, publicKey: string, from: string, to: string, fee = 0) {

    if (!publicKey) {
      throw new Error('No public key set');
    }

    // buildTx
    const lastRef = await dag4.network.getAddressLastAcceptedTransactionRef(from);
    const { tx, hash } = dag4.keyStore.prepareTx(amount, to, from, lastRef, fee, '2.0');
    console.log('prepared transaction with hash: ', hash);
    const ledgerEncodedTx = txTranscodeUtil.encodeTx(tx, false, false);
    // bipIndex should be arrived at automatically
    const bipIndex = 0
    // signTransaction
    const results = await this.ledgerBridge.sign(ledgerEncodedTx, bipIndex, MESSAGE_TYPE_CODES.SIGN_TRANSACTION);
    // add proof to transaction
    tx.proofs = [{
      signature: results.signature,
      id: publicKey.substring(2), // uncompressed publicKey (remove 04 prefix)
    }];

    try {
      
      const success = dag4.keyStore.verify(publicKey, hash, results.signature.toString());
      console.log('verify: ', success);


      if (!success) {
        throw new Error('Sign-Verify failed');
      }

      const signatureAddress = dag4.keyStore.getDagAddressFromPublicKey(publicKey.substring(2));

      if (signatureAddress != from) {
        console.log(`Signature address ${signatureAddress} does not match from address ${from}`);
      }

      const signatureElt: any = {};
      signatureElt.id = publicKey.substring(2);
      signatureElt.signature = results.signature;

      const transaction = TransactionV2.fromPostTransaction(tx as PostTransactionV2);
      transaction.addSignature(signatureElt);

      return {
        hash,
        signedTx: transaction.getPostTransaction()
      };
    } catch (error) {
      console.log('Ledger transaction error:', error);
    }
  }

  /////////////////////////////////
  // ADD LEDGER TX SUPPORT (END)
  /////////////////////////////////

  public signMessage = (message: string, bipIndex: number) => {
    return this.ledgerBridge.signMessage(message, bipIndex);
  };

  /**
   * Closes any existing transport connections
   */
  public closeConnection = () => {
    // Close any existing connection before creating a new one.
    this.transport.close();
  };

  /**
   * Requests permission to access the Ledger device via USB.
   * And sets the transport to the Ledger Bridge.
   */
  public requestPermissions = async () => {
    // Instantiate the ledger transport
    this.transport = await webHidTransport.create();
    // Close any existing connections;
    if (this.transport.device) {
      this.transport.close();
    }
    // Instantiate the ledger bridge
    this.ledgerBridge = new LedgerBridge(webHidTransport);
  };

  /**
   * Sets the onProgressUpdate callback which is called with the progress signature.
   * The callback is fired every time a public key is retrieved from the ledger,
   * the progress parameter returns a decimal ex 0.1 to 1.00.
   * @param onProgressUpdate A callback that will be fired every time a
   */
  public setOnProgressUpdate(onProgressUpdate: (progress: number) => void) {
    // Set the progress update callback if it was passed.
    if (onProgressUpdate) {
      this.onProgressUpdate = onProgressUpdate;
    }
  }

  /**
   * Retrieves the first page of accounts from the Ledger. Note! If paging
   * has progressed and getInitialPage is called the paging count will
   * reset to 0.
   * @returns Returns a promise with the results of an Array of Ledger Accounts.
   */
  public getInitialPage = (): Promise<LedgerAccount[]> => {
    // Set the starting index to 0, to reset the paging back to the first page.
    this.startIndex = 0;
    // Fetch the initial page data.
    return this.getAccountData(this.startIndex);
  };

  /**
   * Retrieves the next page of accounts from the Ledger.
   * @returns Returns a promise with the results of an Array of Ledger Accounts.
   */
  public getNextPage = (): Promise<LedgerAccount[]> => {
    // Increment the startingIndex by the NUMBER_OF_ACCOUNTS to get the next page of data.
    this.startIndex += this.NUMBER_OF_ACCOUNTS;
    // Fetch the initial page data.
    return this.getAccountData(this.startIndex);
  };

  /**
   * Retrieves the previous page of accounts from the Ledger.
   * @returns Returns a promise with the results of an Array of Ledger Accounts.
   */

  public getPreviousPage = (): Promise<LedgerAccount[]> => {
    // If the startIndex is already 0 throw an error and warn the user.
    if (this.startIndex === 0) {
      throw Error('You are at page 1, no more previous pages');
    }
    // Decrement the startingIndex by the NUMBER_OF_ACCOUNTS to get the previous page of data.
    this.startIndex -= this.NUMBER_OF_ACCOUNTS;
    // Fetch the initial page data.
    return this.getAccountData(this.startIndex);
  };
}

export default new LedgerBridgeUtil();
