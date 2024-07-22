import { abbreviateAddress } from "utils/util.ts";

interface BTCAddressInfoProps {
  btc: {
    address: string;
    balance: number;
    txCount: number;
    unconfirmedBalance: number;
    unconfirmedTxCount: number;
  };
}

export default function BtcAddressInfo(props: BTCAddressInfoProps) {
  const { btc } = props;

  return (
    <div class="relative overflow-x-auto shadow-md sm:rounded-lg py-2">
      <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <tbody>
          <tr class="border-b">
            <th scope="row" class="whitespace-nowrap px-6 py-3">Address</th>
            <td class="whitespace-nowrap">{abbreviateAddress(btc.address)}</td>
            <th scope="row" class="whitespace-nowrap px-6 py-3">BTC Balance</th>
            <td class="whitespace-nowrap">{btc.balance} BTC</td>
            <th scope="row" class="whitespace-nowrap px-6 py-3">
              Confirmed TXs
            </th>
            <td class="whitespace-nowrap">{btc.txCount}</td>
          </tr>
          <tr class="border-b">
            <th scope="row" class="px-6 py-3">Unconfirmed Balance</th>
            <td class="whitespace-nowrap">{btc.unconfirmedBalance}</td>
            <th scope="row" class="whitespace-nowrap px-6 py-3">
              Unconfirmed TXs
            </th>
            <td class="whitespace-nowrap">{btc.unconfirmedTxCount}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
