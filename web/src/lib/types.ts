import type {ConnectionStore, UnderlyingEthereumProvider} from '@etherplay/connect';
import type {PublicClient, WalletClient} from 'viem';
import type {BalanceStore} from './core/connection/balance';
import type {GasFeeStore} from './core/connection/gasFee';
import type {PurchaseFlowStore} from './ui/purchaseFlow';
import type {AccountStore, DeploymentsStore} from './core/connection/types';

export type Dependencies = {
  gasFee: GasFeeStore;
  balance: BalanceStore;
  connection: ConnectionStore<UnderlyingEthereumProvider>;
  walletClient: WalletClient;
  publicClient: PublicClient;
  account: AccountStore;
  deployments: DeploymentsStore;
  purchaseFlow: PurchaseFlowStore;
};
