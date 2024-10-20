# Stargazer Ledger Wallet Extension

This is an **unofficial release** of Stargazer Wallet with Tessellation v2 support for the unofficial Constellation Ledger app. Due to the unofficial state of this release you will not see USD values displayed.

## Walkthrough

To make thie process as accessible as possible this walkthrough doesn't cover building/compiling the Stargazer extension from source. You can choose to build/compile the extension yourself using these [instructions](BUILD.md). I'm currently looking for ways to make the process less nerdy.
### 1.1. Install Chrome Extension

* [Download](https://github.com/buzzgreyday/stargazer-wallet-ledger/releases/latest) the Stargazer extension with support for Ledger
- Extract the `zip` somewhere nice

* Load the Stargazer Ledger Wallet extension
  - Go to the Extensions page by entering `chrome://extensions` in a new tab. (By design `chrome:// URLs` are not linkable.)
    - Alternatively, click the Extensions menu `puzzle button` and select `Manage Extensions` at the bottom of the menu.
    - Or, click the Chrome menu, hover over More Tools, then select Extensions.
  - Enable Developer Mode by clicking the toggle switch next to Developer mode.
  - Click the Load unpacked button and select the extension directory (extracted above).
  - Ta-da! The extension has been successfully installed.

### 1.2. Constellation Ledger App

Since the app (v1.0.7) isn't available through Ledger Live we'll have to build it.

**1.2.1. Preliminaries**

- [Install Docker](https://docs.docker.com/engine/install/).
- Download [constellation-ledger-native-app-master.zip](https://github.com/buzzgreyday/constellation-ledger-native-app/releases/latest).
  - Alernatively, clone `https://github.com/StardustCollective/constellation-ledger-native-app.git` using `git`.
- Extract it somewhere nice (ex: C:/Users/john/constellation-ledger-native-app-master).

**1.2.2. Build/compile ([source](https://github.com/LedgerHQ/ledger-app-builder/?tab=readme-ov-file#compile-your-app-in-the-container))**
  - NB: Replace the path of the app’s local path (ex: replace `"C:/Users/john/constellation-ledger-native-app:/app"` with `"C:/Users/jane/constellation-ledger-native-app:/app"`).

    1.2.2a. Windows:
    ```
    docker run --rm -ti  -v "C:/Users/john/constellation-ledger-native-app:/app" --privileged -v "/dev/bus/usb:/dev/bus/usb" --user $(id -u $USER):$(id -g $USER) ghcr.io/ledgerhq/ledger-app-builder/ledger-app-builder:latest
    ```
    1.2.2b. Linux/MacOS:
    ```
    sudo docker run --rm -ti  -v "/Users/john/constellation-ledger-native-app:/app" --privileged -v "/dev/bus/usb:/dev/bus/usb" --user $(id -u $USER):$(id -g $USER) ghcr.io/ledgerhq/ledger-app-builder/ledger-app-builder:latest
    ```
**1.2.3. Build/compile for Nano S**
    ```
    BOLOS_SDK=$NANOS_SDK make
    ```
**1.2.4. Load app onto Ledger device**
    - NB: Make sure the Ledger is connected to your computer.
    ```
    BOLOS_SDK=$NANOS_SDK make load
    ```

### 1.3. Connect Stargazer Ledger Wallet and Constellation Ledger App

**1.3.1. Prepare Stargazer Ledger Wallet**

- Open Stargazer Ledger Wallet.
- Click `Setiings` and import a new `Constellation` wallet.
- Select `Harware wallet` from the selection menu.
- Click the `Ledger button`.
- You should now see a page with a `Connect to Ledger` button 

**1.3.2. Prepare the Constellation Ledger App**

- Open the `Constellation` app on your Ledger device.
- You will see the following message `This app is not genuine`. This is due to lack of official support by Ledger.
- Click the left button on your device two time and select `Open application`.
- You will see the following message `Pending Ledger review`
- Click the two buttons to accept and the Ledger app should now be displaying `Constellation`. This means the app is now open for business.

**1.3.3. Pair Device with the Stargazer Ledger Wallet**

- Click the `Connect to Ledger` button.
- IMPORTANT: Select the first wallet address and click `Next` (more wallets will be supported in the future).
- Let the pairing finish.
- Now open the Stargazer Ledger Wallet extension again and you should see the wallet `Ledger 1` is now available.

**All done.**