<script lang="ts">
	import DefaultHead from '$lib/metadata/DefaultHead.svelte';
	import {url} from '$lib/core/utils/web/path';

	const CONTRACT_ADDRESS = '0xDaCa87395f3b1Bbc46F3FA187e996E03a5dCc985';
	const REPO_URL = 'https://github.com/wighawag/mandalas';
</script>

<DefaultHead title="About" />

<!-- Left-aligned and measure-constrained on purpose: this is the only page on
     the site that is read rather than scanned. See `.prose-mandala` in app.css
     for why the previous centred, full-bleed treatment was dropped.

     The measure is in `ch`, so it is tied to this element's own font-size: the
     type scale below is what widens the column on a large screen, and the cap
     only steps 65ch -> 72ch on top. Widening by max-width alone would have
     bought width at the cost of the measure, which is the one thing the cap
     exists to protect. Line-height lives here once rather than on every <p>. -->
<article
	class="prose-mandala mx-auto w-full max-w-prose px-6 py-10 text-base leading-relaxed text-foreground lg:max-w-[72ch] lg:px-8 lg:py-14 lg:text-lg xl:text-xl"
>
	<header>
		<h1
			class="text-3xl font-black tracking-wider text-yellow-400 uppercase lg:text-4xl"
		>
			About
		</h1>
		<p class="mt-3 text-lg text-muted-foreground lg:text-xl">
			Procedurally generated, eight-fold symmetric bitmaps, drawn entirely
			on-chain.
		</p>
	</header>

	<section class="mt-10">
		<h2 class="text-lg font-semibold tracking-wide lg:text-xl">
			What they are
		</h2>
		<p class="mt-3">
			Mandalas are procedurally generated bitmaps, recorded as NFTs on
			<a href="https://ethereum.org" target="_blank" rel="noopener">ethereum</a
			>. There are millions of millions of them, 2<sup>160</sup> &minus; 1 to be
			exact, and <strong class="font-semibold uppercase">all unique</strong>.
		</p>
	</section>

	<section class="mt-8">
		<h2 class="text-lg font-semibold tracking-wide lg:text-xl">
			One per address
		</h2>
		<p class="mt-3">
			Their eight-fold symmetry also ensures that a single difference is
			actually repeated. As such they make great identity icons, improving upon
			the classic
			<a
				href="https://github.com/ethereum/blockies"
				target="_blank"
				rel="noopener">blockies</a
			>. Their number is exactly equal to the number of ethereum addresses, so
			each address has a unique representation in the form of a Mandala.
		</p>
	</section>

	<section class="mt-8">
		<h2 class="text-lg font-semibold tracking-wide lg:text-xl">
			Minting and burning
		</h2>
		<p class="mt-3">
			This website allows you to mint them on the
			<a href="https://ethereum.org" target="_blank" rel="noopener"
				>ethereum network</a
			>. Each time you mint you pay the current price, and the price then
			increases. You can later burn the Mandala to get back 95% of the current
			price.
		</p>
		<p class="mt-3">
			This is similar to
			<a href="https://neolastics.com/" target="_blank" rel="noopener"
				>neolastics</a
			>
			by
			<a href="https://blog.simondlr.com/" target="_blank" rel="noopener"
				>Simon de la Rouviere</a
			>, which I recommend checking out.
		</p>
	</section>

	<section class="mt-8">
		<h2 class="text-lg font-semibold tracking-wide lg:text-xl">
			Fully on-chain
		</h2>
		<p class="mt-3">
			Mandalas also have the particularity that their bitmap and metadata are
			fully generated on-chain. And contrary to many other on-chain projects,
			Mandalas make full use of the tokenURI standard. Hence no backend will
			ever be required to host the image.
		</p>
	</section>

	<!-- Broken out of the prose as a labelled list: a 42-character address is
	     unreadable mid-sentence, and unbreakable enough to overflow a narrow
	     viewport. Monospace + `break-all` makes it both readable and safe. -->
	<section class="mt-10 border-t border-border pt-6">
		<h2 class="text-lg font-semibold tracking-wide lg:text-xl">
			Source and contract
		</h2>
		<dl class="mt-4 space-y-4 text-sm lg:text-base">
			<div>
				<dt class="text-muted-foreground">Source code</dt>
				<dd class="mt-1">
					<a href={REPO_URL} target="_blank" rel="noopener"
						>github.com/wighawag/mandalas</a
					>
				</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">Contract address</dt>
				<dd class="mt-1">
					<a
						class="font-mono break-all"
						href={`https://etherscan.io/address/${CONTRACT_ADDRESS}`}
						target="_blank"
						rel="noopener">{CONTRACT_ADDRESS}</a
					>
				</dd>
			</div>
		</dl>
	</section>

	<footer
		class="mt-8 border-t border-border pt-6 text-sm text-muted-foreground lg:text-base"
	>
		<p>
			Created by
			<a href="https://ronan.eth.limo" target="_blank" rel="noopener"
				>Ronan Sandford</a
			>
			(a.k.a
			<a
				class="inline-flex items-baseline gap-1"
				href="https://twitter.com/wighawag"
				target="_blank"
				rel="noopener"
				>wighawag<img
					class="inline h-4 w-4 self-center"
					alt=""
					src={`${url('/images/wig256x256.jpg')}`}
				/></a
			>) as part of the
			<a href="https://nft.ethglobal.co/" target="_blank" rel="noopener"
				>NFT Hack</a
			>.
		</p>
	</footer>
</article>
