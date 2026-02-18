<script lang="ts">
	import {
		generateTokenURI,
		template19_bis,
		generateBitmapDataURI,
	} from 'mandalas-common';
	import {onMount} from 'svelte';

	let name = $state<string | undefined>(undefined);
	let image = $state<string | undefined>(undefined);
	onMount(() => {
		let mandalaId =
			typeof location !== 'undefined' ? location.hash.substr(1) : '0x00';
		console.log({mandalaId});

		// $: tokenURI = generatePureSVGTokenURI(mandalaId, pure_svg_template_19_bis);
		let tokenURI = generateTokenURI(mandalaId, template19_bis);

		let metadata = JSON.parse(tokenURI.substr('data:text/plain,'.length));
		image = generateBitmapDataURI(mandalaId, template19_bis);
		// $: image = metadata.image;
		name = metadata.name;
		console.log({tokenURI, metadata, image, name});
	});
</script>

<section
	class="mx-auto flex h-full flex-col items-center justify-center px-10 py-8 text-black md:w-3/4 dark:text-white"
>
	<div class="space-y-4 p-8">
		<img
			style={`image-rendering: pixelated; max-height:70vh`}
			class="object-contain"
			alt={name}
			src={image}
		/>
	</div>
</section>
