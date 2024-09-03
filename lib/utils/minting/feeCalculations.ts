const DUST_SIZE = 333;

export function calculateDust(fileSize: number): number {
  const outputCount = Math.ceil(fileSize / 32);
  let totalDust = 0;
  for (let i = 0; i < outputCount; i++) {
    totalDust += DUST_SIZE + i;
  }
  return totalDust;
}

export function estimateP2WSHTransactionSize(fileSize: number): number {
  const outputVB = Math.ceil(fileSize / 32) * 43;
  const overHeadVB = 185; // estimate based on 1 input 1 op return and 2 outputs
  const totalSizeInB = overHeadVB + outputVB;
  return totalSizeInB;
}

export function calculateMiningFee(
  fileSize: number,
  feeSatsPerVByte: number,
): number {
  const totalSizeInB = estimateP2WSHTransactionSize(fileSize);
  let totalMiningFee = totalSizeInB * feeSatsPerVByte;
  totalMiningFee = Math.round(totalMiningFee * 100000000) / 100000000;
  return totalMiningFee;
}
