// connectWallet.tsx
import { WalletModal } from "./WalletModal.tsx";
import { WalletConnector } from "./connectors/Wallet.connector.tsx";

export function ConnectWallet({ toggleModal }) {
  const connectors = [
    (extraProps) => <WalletConnector providerKey="unisat" {...extraProps} />,
    (extraProps) => <WalletConnector providerKey="leather" {...extraProps} />,
  ];

  return <WalletModal connectors={connectors} toggleModal={toggleModal} />;
}
