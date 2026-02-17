<script lang="ts">
	import {browser} from '$app/environment';
	import {url} from '$lib/core/utils/web/path';
	import {onMount} from 'svelte';
	import {fade} from 'svelte/transition';
	import {splash} from './splash';

	onMount(() => {
		splash.start(1);
	});
</script>

{#if !$splash.complete}
	{#if $splash.stage >= 1 || !browser}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			class="overlay game-logo"
			out:fade|global
			on:click={() => splash.nextStage()}
		>
			<div class="content">
				<img
					src={url('/game-title.png')}
					alt="Game Logo Title"
					on:load={() => splash.gameLogoReady()}
				/>

				<div class="loading-bar-container">
					<div
						class="loading-bar"
						style="width: {Math.max(
							0,
							Math.min(100, $splash.loadingValue * 100),
						)}%"
					></div>
				</div>
				<!-- <p class="description"></p> -->
			</div>
		</div>
	{:else}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			class="overlay studio-logo"
			out:fade|global
			on:click={() => splash.nextStage()}
		>
			<div class="content">
				<img
					src={url('/studio-logo.png')}
					alt="Game Studio Logo"
					on:load={() => splash.studioLogoReady()}
				/>
				<!-- <p class="description">presents</p> -->
			</div>
		</div>
	{/if}
{/if}

<style>
	.overlay {
		overflow-y: auto;
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		z-index: 50;
		background-color: #000000;

		height: 100%;
	}

	.overlay.game-logo {
		background-color: #24243c;
	}

	.game-logo .content {
		display: flex;
		text-align: center;
		justify-content: center;
		align-items: center;
		height: 100%;
	}

	.game-logo img {
		margin-left: auto;
		margin-right: auto;
		margin-bottom: 2rem;
		max-width: 28rem;

		width: 80%;
	}

	/* .game-logo .description {
		margin: 1.5rem;
		margin-top: 5rem;
		color: #6b7280;
		font-size: 1.5rem;
		line-height: 2rem;
		font-weight: 900;
	} */

	.studio-logo .content {
		display: flex;
		text-align: center;
		justify-content: center;
		align-items: center;
		height: 100%;
	}

	.studio-logo img {
		margin-left: auto;
		margin-right: auto;
		margin-bottom: 2rem;
		max-width: 20rem;
		width: 80%;
	}

	/* .studio-logo .description {
		margin: 1.5rem;
		color: #9ca3af;
		font-size: 2.25rem;
		line-height: 2.5rem;
		font-weight: 900;
	} */
	.loading-bar-container {
		position: absolute;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		width: 80%;
		max-width: 20rem;
		height: 0.5rem;
		background-color: rgba(255, 255, 255, 0.2);
		border-radius: 0.25rem;
		overflow: hidden;
	}

	.loading-bar {
		height: 100%;
		background-color: #ffffff;
		transition: width 0.3s ease;
	}
</style>
