import {Deployment} from 'rocketh/types';
import {Abi_MandalaToken} from '../../generated/abis/MandalaToken.js';
import {loadAndExecuteDeploymentsFromFiles} from '../../rocketh/environment.js';
import {EthereumProvider} from 'hardhat/types/providers';

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
