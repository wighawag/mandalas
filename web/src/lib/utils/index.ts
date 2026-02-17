import contractsInfo from '../contracts.json';

const initialPrice = BigInt(contractsInfo.contracts.MandalaToken.linkedData.initialPrice);
// const creatorCutPer10000th =
//   contractsInfo.contracts.MandalaToken.linkedData.creatorCutPer10000th;
const coefficient = BigInt(contractsInfo.contracts.MandalaToken.linkedData.linearCoefficient);

export function computeBuffer(supply: bigint, currentPrice: bigint): bigint {
  const computed = initialPrice + (supply + BigInt(3)) * coefficient - currentPrice;
  const min = BigInt('10000000000000000');
  if (computed > min) {
    return computed;
  }
  return min;
}

export function wait<T>(numSeconds: number, v: T): Promise<T> {
  return new Promise(function (resolve) {
    setTimeout(resolve.bind(null, v), numSeconds * 1000);
  });
}
