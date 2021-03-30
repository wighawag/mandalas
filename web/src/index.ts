import {init} from './init';
import './service-worker-handler';
import App from './App.svelte';

init();
const app = new App({
  target: document.body,
});

export default app;
