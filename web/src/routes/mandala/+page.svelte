<script lang="ts">
  import {
    generateTokenURI,
    template19_bis,
    generateBitmapDataURI,
  } from 'mandalas-common';
import { onMount } from 'svelte';

  let name: string;
  let image: string;
  onMount(() => {
    let mandalaId = typeof location !== "undefined" ? location.hash.substr(1): "0x00";
    console.log({mandalaId});

    // $: tokenURI = generatePureSVGTokenURI(mandalaId, pure_svg_template_19_bis);
    let tokenURI = generateTokenURI(mandalaId, template19_bis);

    let metadata = JSON.parse(tokenURI.substr('data:text/plain,'.length));
    image = generateBitmapDataURI(mandalaId, template19_bis);
    // $: image = metadata.image;
    name = metadata.name;
    console.log({tokenURI, metadata, image, name});
  })

</script>


<section
  class="py-8 px-10 md:w-3/4 h-full mx-auto flex flex-col items-center justify-center text-black dark:text-white ">
  <div class="space-y-4 p-8">
    <img
      style={`image-rendering: pixelated; max-height:70vh`}
      class="object-contain"
      alt={name}
      src={image} />
  </div>
</section>
