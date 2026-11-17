import {deployScript, artifacts} from '../rocketh/deploy.js';
import {parseEther} from 'viem';

export default deployScript(
	async (env) => {
		// Get named accounts configured in rocketh/config.ts
		const {deployer, admin} = env.namedAccounts;

		const initialPrice = parseEther('0.001');
		const creatorCutPer10000th = 500n;
		const linearCoefficient = parseEther('0.0005');

		await env.deployViaProxy(
			'MandalaToken',
			{
				account: deployer,
				artifact: artifacts.MandalaToken,
				args: [deployer, initialPrice, creatorCutPer10000th, linearCoefficient],
			},
			{
				proxyDisabled: env.name === 'localhost', // TODO tags ?
				execute: 'postUpgrade',
				linkedData: {
					initialPrice: initialPrice,
					creatorCutPer10000th,
					linearCoefficient: linearCoefficient,
				},
			},
		);
	},
	{tags: ['MandalaToken', 'MandalaToken_deploy']},
);
