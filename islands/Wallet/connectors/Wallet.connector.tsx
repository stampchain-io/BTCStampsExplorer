import { WALLET_PROVIDERS } from 'constants'
import { connectUnisat } from 'store/wallet/unisat.ts'
import { useToast } from '$islands/Toast/toast.tsx';
import { leatherProvider } from 'store/wallet/leather.ts'

export const WalletConnector = ({ providerKey, toggleModal }) => {
  const { addToast } = useToast();
  const providerInfo = WALLET_PROVIDERS[providerKey];
  console.log(providerInfo);
  const connectFunction = providerKey === 'unisat' ? connectUnisat : leatherProvider.connectLeather;



  return (
    <div
      onClick={() => {
        connectFunction(addToast)
        toggleModal()
      }}
      role="button"
      aria-label={`Connect to ${providerInfo.name}`}
      className="cursor-pointer flex items-center p-4 md:p-5 border rounded-lg border-gray-200 hover:border-gray-300 focus:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500 dark:focus:border-gray-500 transition-colors ease-in-out duration-150"
    >
      <p className="text-md text-gray-200 uppercase md:text-base font-medium">{providerInfo.name}</p>
      <img src={providerInfo.logo.small} alt={providerInfo.name} className="w-8 h-8 ml-auto" />
    </div>
  )
}
