<script lang="ts">
	import {url} from '$lib/core/utils/web/path';
</script>

<div
	class="mx-auto flex h-full w-full flex-col items-center justify-center text-center text-black dark:text-white"
>
	<p class="p-6">
		Mandalas are procedurelly generated bitmaps recorded as NFT on
		<a href="https://ethereum.org" target="_blank" class="underline">ethereum</a
		>. There are millions of millions of them, (2^160)-1 to be exact.
		<span class="uppercase">all unique</span>.
	</p>

	<p class="p-6">
		Their eight-fold symmetry also ensure that a single difference is actually
		repeated. As such they are also great for identity icon improving upon the
		classic
		<a
			href="https://github.com/ethereum/blockies"
			target="_blank"
			class="underline">blockies</a
		>. Their number is actually equal to the number of ethereum addresses and so
		each address has a unique representation in the form of a Mandala.
	</p>

	<p class="p-6">
		This website allows you to mint them on the
		<a href="https://ethereum.org" target="_blank" class="underline"
			>ethereum network</a
		>. Each time you mint you pay at a certain price and the price then
		increase. You can later burn the mandala to get back 95% of the current
		price. This is similar to
		<a class="underline" href="https://neolastics.com/" target="_blank"
			>neolastics/</a
		>
		by
		<a class="underline" href="https://blog.simondlr.com/" target="_blank"
			>Simon de la Rouviere</a
		>
		which I recommend to check out.
	</p>

	<p class="p-6">
		Mandalas have also the particularity that their bitmap and metadata is fully
		generated on-chain. And contrary to many other on-chain projects, Mandalas
		make full use of the tokenURI standard. Hence no backend will ever be
		required to host the image.
	</p>

	<p class="p-6">
		The source code can be found
		<a
			href="https://github.com/wighawag/mandalas"
			target="_blank"
			class="underline">here</a
		>
		and the contract address is
		<a
			href="https://etherscan.io/address/0xDaCa87395f3b1Bbc46F3FA187e996E03a5dCc985"
			target="_blank"
			class="underline">0xDaCa87395f3b1Bbc46F3FA187e996E03a5dCc985</a
		>
	</p>

	<p class="p-6">
		This project was created by
		<a href="https://ronan.eth.limo" target="_blank" class="underline"
			>Ronan Sandford</a
		>
		(a.k.a
		<a href="https://twitter.com/wighawag" target="_blank" class="underline"
			>wighawag
			<img
				class="inline h-4 w-4"
				alt="wighawag"
				src={`${url('/images/wig256x256.jpg')}`}
			/></a
		>) as part of the
		<a href="https://nft.ethglobal.co/" target="_blank" class="underline"
			>NFT Hack</a
		>.
	</p>
</div>
