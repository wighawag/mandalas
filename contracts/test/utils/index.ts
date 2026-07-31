import {Deployment} from 'rocketh/types';
import {Abi_MandalaToken} from '../../generated/abis/MandalaToken.js';
import {loadAndExecuteDeploymentsFromFiles} from '../../rocketh/environment.js';
import {EthereumProvider} from 'hardhat/types/providers';

/** The bonding-curve parameters, as stored on the deployment. */
export type CurveParams = {
	initialPrice: string;
	creatorCutPer10000th: number | string;
	linearCoefficient: string;
};

/**
 * Mirrors MandalaToken._curve: the mint price at a given supply.
 *
 *     initialPrice + supply * linearCoefficient
 */
export function curve(params: CurveParams, supply: bigint): bigint {
	return (
		BigInt(params.initialPrice) + supply * BigInt(params.linearCoefficient)
	);
}

/**
 * Mirrors MandalaToken._forReserve: the share of a mint price that stays in the
 * reserve, the rest going to the creator.
 *
 * The cut applies to the WHOLE price, not just the linear part - getting that
 * wrong is what made `mint, mint, mint transfer, burn` fail.
 */
export function forReserve(params: CurveParams, mintPrice: bigint): bigint {
	return (mintPrice * (10000n - BigInt(params.creatorCutPer10000th))) / 10000n;
}

/**
 * What `burn` pays the caller, given the supply BEFORE the burn.
 *
 * Mirrors MandalaToken.burn: `_forReserve(_curve(_supply - 1))`, i.e. the
 * reserve share of the price at the supply the burn brings us back down to.
 * That is exactly what the corresponding mint put into the reserve, which is
 * why the reserve stays solvent.
 *
 * Derive expectations from this rather than re-deriving the arithmetic per
 * test: both burn tests previously did the latter and both got it wrong, in
 * two different ways.
 */
export function burnPayout(
	params: CurveParams,
	supplyBeforeBurn: bigint,
): bigint {
	return forReserve(params, curve(params, supplyBeforeBurn - 1n));
}

export function setupFixtures(provider: EthereumProvider) {
	return {
		async deployAll() {
			const env = await loadAndExecuteDeploymentsFromFiles({
				provider: provider,
			});
			const MandalaToken = env.get<Abi_MandalaToken>('MandalaToken');
			return {
				env,
				MandalaToken: MandalaToken as Deployment<Abi_MandalaToken> & {
					linkedData: {
						initialPrice: string;
						creatorCutPer10000th: number;
						linearCoefficient: string;
					};
				},
				namedAccounts: env.namedAccounts,
				unnamedAccounts: env.unnamedAccounts,
			};
		},
	};
}
