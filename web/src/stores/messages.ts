import {chain, fallback, wallet} from './wallet';
import {BaseStore} from '../lib/utils/stores';
import {blockTime} from '../config';
import type {WalletStore} from 'web3w';

type Message = {
  id: string;
  message: string;
  pending: boolean;
  state: 'Loading' | 'Idle' | 'Ready';
  error?: any;
};

class MessageStore extends BaseStore<Message> {
  private interval: NodeJS.Timeout | undefined;
  constructor(private wallet: WalletStore) {
    super({
      id: '',
      message: '',
      pending: false,
      state: 'Idle',
    });

    // wallet.subscribe(($wallet) => {});
  }

  private async _fetch(walletAddress: string | undefined) {
    if (!walletAddress) {
      this.setPartial({message: '', pending: false, state: 'Idle'});
      return;
    }
    const contracts = chain.contracts || fallback.contracts;
    if (contracts) {
      if (this.$store.state === 'Idle') {
        this.setPartial({state: 'Loading'});
      }
      const message = await contracts.GreetingsRegistry.messages(walletAddress);
      this.set({message, pending: false, state: 'Ready', id: walletAddress});
    } else if (fallback.state === 'Ready') {
      this.setPartial({error: new Error('no contracts to fetch with')});
    } else {
      if (this.$store.state === 'Idle') {
        this.setPartial({state: 'Loading'});
      }
      console.log('waiting to be connected to a chain...');
    }
  }

  fetch(): void {
    this.interval = setInterval(
      () => this._fetch(this.wallet.address),
      1000 * blockTime
    );
  }
  cancel() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }
  acknowledgeError() {
    this.setPartial({error: undefined});
  }
}

export const messages = new MessageStore(wallet);
