import {get} from 'svelte/store';
import {
	InsufficientFundsError,
	isUserRejectionError,
} from '$lib/core/transaction';
import {
	txErrorDetails,
	txErrorSummary,
} from '$lib/core/transaction/tx-error-summary';
import type {Context} from '$lib/context/types';

export type BurnResult =
	| {status: 'submitted'}
	| {status: 'cancelled'}
	| {status: 'cannot-send'}
	| {status: 'error'; message: string; details: string};

export type BurnDeps = Pick<
	Context,
	'connection' | 'executor' | 'deployments' | 'balanceCheck'
>;

/**
 * Burn a Mandala, returning ~95% of the current price to the owner.
 *
 * Owns the whole onchain flow (ensure connected, balance check, write) and
 * normalises outcomes so the component only has to render:
 * - `submitted`: the tx was sent.
 * - `cancelled`: the user dismissed the funds modal or rejected in-wallet
 *   (no error should be shown).
 * - `cannot-send`: the connected account cannot send under the configured
 *   execution mode.
 * - `error`: a real failure, with a user-facing message.
 */
export async function burnMandala(
	deps: BurnDeps,
	tokenID: bigint,
): Promise<BurnResult> {
	const {connection, executor, deployments, balanceCheck} = deps;

	try {
		await connection.ensureConnected();

		const $executor = get(executor);
		if ($executor.status === 'cannot-send') return {status: 'cannot-send'};
		if ($executor.status !== 'ready') return {status: 'cancelled'};

		const $deployments = get(deployments);

		const contractRequest = await balanceCheck.ensureCanAfford(
			{
				contract: {
					address: $deployments.contracts.MandalaToken.address,
					abi: $deployments.contracts.MandalaToken.abi,
					functionName: 'burn',
					args: [tokenID],
					account: $executor.account,
				},
			},
			// The gas store polls every 10 minutes; a stale fee ceiling gets the send
			// rejected outright. Re-read right before signing.
			{forceUpdate: true},
		);

		await $executor.client.writeContract(contractRequest);
		return {status: 'submitted'};
	} catch (error) {
		if (
			error instanceof InsufficientFundsError ||
			isUserRejectionError(error)
		) {
			return {status: 'cancelled'};
		}
		console.error('Failed to burn Mandala:', error);
		return {
			status: 'error',
			message: txErrorSummary(error),
			details: txErrorDetails(error),
		};
	}
}
