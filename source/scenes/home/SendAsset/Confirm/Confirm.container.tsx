///////////////////////////
// Components
///////////////////////////

import React, { useState } from 'react';
import queryString from 'query-string';
import find from 'lodash/find';
import { useHistory } from 'react-router-dom';
import { useLinkTo } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { KeyringWalletType } from '@stardust-collective/dag4-keyring';
// import { useAlert } from 'react-alert';

///////////////////////////
// Navigation
///////////////////////////

// import confirmHeader from 'navigation/headers/confirm';

///////////////////////////
// Components
///////////////////////////

import Container, { CONTAINER_COLOR } from 'components/Container';

///////////////////////////
// Types
///////////////////////////

import IVaultState, { AssetType, IWalletState, IActiveAssetState } from 'state/vault/types';
import IAssetListState, { IAssetInfoState } from 'state/assets/types';
import { ITransactionInfo } from 'scripts/types';

///////////////////////////
// Hooks
///////////////////////////

import { RootState } from 'state/store';
import { useFiat } from 'hooks/usePrice';

///////////////////////////
// Utils
///////////////////////////

import { getAccountController } from 'utils/controllersUtils';
import { usePlatformAlert } from 'utils/alertUtil';
import { isError } from 'scripts/common';

///////////////////////////
// Selectors
///////////////////////////

import walletSelectors from 'selectors/walletsSelectors';

///////////////////////////
// Scene
///////////////////////////

import Confirm from './Confirm';

///////////////////////////
// Constants
///////////////////////////

const BITFI_PAGE  = "bitfi";
const LEDGER_PAGE = "ledger";

///////////////////////////
// Container
///////////////////////////


const ConfirmContainer = () => {

  const showAlert = usePlatformAlert()

  let activeAsset: IAssetInfoState | IActiveAssetState;
  let activeWallet: IWalletState;
  let activeWalletPublicKey: any = useSelector(walletSelectors.selectActiveAssetPublicKey)
  let history: any;
  let isExternalRequest: boolean;

  if (!!location) {
    isExternalRequest = location.pathname.includes('confirmTransaction');
  }

  const accountController = getAccountController();
  // const alert = useAlert();
  const linkTo = useLinkTo();
  const vault: IVaultState = useSelector(
    (state: RootState) => state.vault
  );
  const assets: IAssetListState = useSelector(
    (state: RootState) => state.assets
  );
  let assetInfo: IAssetInfoState;


  if (isExternalRequest) {
    const {
      to
    } = queryString.parse(location.search);


    activeAsset = useSelector(
      (state: RootState) => find(state.assets, { address: Array.isArray(to) ? to[0] : to })
    ) as IAssetInfoState;

    if (!activeAsset) {
      activeAsset = useSelector(
        (state: RootState) => find(state.assets, { type: AssetType.Ethereum })
      ) as IAssetInfoState;
    }

    activeWallet = vault.activeWallet;
    assetInfo = assets[activeAsset.id];

    history = useHistory();

  } else {

    activeAsset = vault.activeAsset;
    activeWallet = vault.activeWallet;

    assetInfo = assets[activeAsset.id];
    // Sets the header for the confirm screen.
    // useLayoutEffect(() => {
    //   navigation.setOptions(confirmHeader({ navigation, asset: assetInfo }));
    // }, []);

  }

  const getFiatAmount = useFiat(false, assetInfo);

  const feeUnit = assetInfo.type === AssetType.Constellation ? 'DAG' : 'ETH'

  const tempTx = accountController.getTempTx();
  const [confirmed, setConfirmed ] = useState(false);
  const [disabled, setDisabled] = useState(false);


  const getSendAmount = () => {

    const fiatAmount = Number(getFiatAmount(Number(tempTx?.amount || 0), 8, assetInfo.priceId));

    return (fiatAmount).toLocaleString(navigator.language, {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  }

  const getFeeAmount = () => {

    let priceId = assetInfo.priceId;

    if (activeAsset.type === AssetType.ERC20) {
      priceId = AssetType.Ethereum
    }

    return Number(getFiatAmount(Number(tempTx?.fee || 0), 8, priceId));

  }

  const getTotalAmount = () => {

    let amount = Number(getFiatAmount(Number(tempTx?.amount || 0), 8));
    amount += getFeeAmount();

    return (amount).toLocaleString(navigator.language, {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  };

  const handleCancel = () => {
    if (isExternalRequest) {
      history.goBack();
    } else {
      linkTo('/send');
    }
  }

  const handleConfirm = async (browser: any = null) => {
    setDisabled(true);

    const background = await browser.runtime.getBackgroundPage();
    const { windowId } = queryString.parse(window.location.search);

    try {
      if (isExternalRequest) {
        const txConfig: ITransactionInfo = {
          fromAddress: tempTx.fromAddress,
          toAddress: tempTx.toAddress,
          timestamp: Date.now(),
          amount: tempTx.amount,
          ethConfig: tempTx.ethConfig,
          onConfirmed: () => {
            // NOOP
          },
        };

        accountController.updateTempTx(txConfig);
        const trxHash = await accountController.confirmContractTempTx(activeAsset);

        background.dispatchEvent(new CustomEvent('transactionSent', {
          detail: { windowId, approved: true, result: trxHash },
        }));

        if (window) {
          window.close();
        }
      } else {
        if (activeWallet.type === KeyringWalletType.LedgerAccountWallet || 
            activeWallet.type === KeyringWalletType.BitfiAccountWallet ) {


          const page = activeWallet.type === KeyringWalletType.LedgerAccountWallet ? LEDGER_PAGE : BITFI_PAGE;

          const params = new URLSearchParams();
          params.set('route', 'signTransaction');
          params.set('windowId', Array.isArray(windowId) ? windowId[0] : windowId);
          params.set('id', activeWallet.id);
          params.set('publicKey', activeWalletPublicKey)
          params.set('amount', tempTx!.amount);
          params.set('fee', String(tempTx!.fee));
          params.set('from', tempTx!.fromAddress)
          params.set('to', tempTx!.toAddress)

          window.open(`/${page}.html?${params.toString()}`, '_newtab');
        } else {

          const trxHash = await accountController.confirmTempTx()
          background.dispatchEvent(new CustomEvent('transactionSent', {
            detail: { windowId, approved: true, result: trxHash },
          }));  
          setConfirmed(true);

        }
      }
    } catch (e) {
      if (isError(e)) {
        let message = e.message;
        if (e.message.includes('insufficient funds') && [AssetType.ERC20, AssetType.Ethereum].includes(assetInfo.type)) {
          message = 'Insufficient ETH to cover gas fee.';
        }

        background.dispatchEvent(new CustomEvent('transactionSent', {
          detail: { windowId, approved: false, error: e.message },
        }));

        showAlert(message, 'danger');
      }
      console.error(e)
    }
  };

  return (
    <Container color={CONTAINER_COLOR.EXTRA_LIGHT}>
      <Confirm
        isExternalRequest={isExternalRequest}
        confirmed={confirmed}
        activeAsset={activeAsset}
        tempTx={tempTx}
        assetInfo={assetInfo}
        getSendAmount={getSendAmount}
        activeWallet={activeWallet}
        feeUnit={feeUnit}
        getFeeAmount={getFeeAmount}
        getTotalAmount={getTotalAmount}
        handleCancel={handleCancel}
        handleConfirm={handleConfirm}
        disabled={disabled}
      />
    </Container>
  );

}

export default ConfirmContainer;