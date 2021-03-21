<script lang="ts">
  import {Router, CurrentPage} from './lib/routing';
  import routes from './routes/_.routes';
  import NavBar from './components/navigation/NavBar.svelte';
  import Navigating from './lib/routing/curi/Navigating.svelte';
  import Loading from './components/Loading.svelte';
  import Notifications from './components/notification/Notifications.svelte';
  import NoInstallPrompt from './components/NoInstallPrompt.svelte';
  import NewVersionNotification from './components/NewVersionNotification.svelte';
  // import Install from './components/Install.svelte';
  import {onMount} from 'svelte';

  onMount(() => {
    document.body.classList.add('dark:bg-black');
    document.body.classList.add('bg-white');
    document.documentElement.classList.add('dark');
  });
</script>

<NoInstallPrompt />
<NewVersionNotification />
<Router {routes} globalQueryStrings={['debug', 'log', 'trace', '_d_eruda', 'eth_node']}>
  <Notifications />
  <NavBar
    links={[{name: 'index', title: 'MANDALAS'}, {name: 'me', title: 'My Mandalas'}, {name: 'about', title: 'About'}]} />
  <CurrentPage>
    <Loading />
    Loading...
  </CurrentPage>
  <Navigating component={Loading} />
</Router>
