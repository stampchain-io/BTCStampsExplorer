interface SRC20TXProps {
  txs: unknown[];
  total: number;
  type: "TRANSFER" | "MINT";
}

export const SRC20TX = (props: SRC20TXProps) => {
  const { txs, total, type } = props;
  return (
    null
  );
};
