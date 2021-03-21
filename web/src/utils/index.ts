import {BigNumber} from '@ethersproject/bignumber';
import contractsInfo from '../contracts.json';

const initialPrice = BigNumber.from(contractsInfo.contracts.BitmapToken.linkedData.initialPrice);
const creatorCutPer10000th = contractsInfo.contracts.BitmapToken.linkedData.creatorCutPer10000th;
const coefficient = BigNumber.from(contractsInfo.contracts.BitmapToken.linkedData.linearCoefficient);

export function computeBuffer(supply: BigNumber, currentPrice: BigNumber): BigNumber {
  const computed = initialPrice.add(supply.add(3).mul(coefficient)).sub(currentPrice)
  const min = BigNumber.from("10000000000000000");
  if (computed.gt(min)) {
    return computed;
  }
  return min;
}
