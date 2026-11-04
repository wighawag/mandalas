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
				// No proxy on a LAN box either, and there it is deployed through the
				// CREATE2 factory, as the LAN package needs (nix/lan.nix: every address
				// must depend on the code alone). Not with a proxy: under CREATE2 the
				// proxy's constructor is called by the factory, and `postUpgrade`'s
				// `proxied` check wants the proxy's admin, so it reverts. Elsewhere,
				// mainnet included, the deploy stays as it was.
				proxyDisabled: env.name === 'localhost' || env.name === 'lan', // TODO tags ?
				deterministic: env.name === 'lan',
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
