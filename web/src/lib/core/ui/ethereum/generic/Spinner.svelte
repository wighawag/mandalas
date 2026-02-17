<script lang="ts">
	interface Props {
		color?: string;
		size?: number;
		strokeWidth?: number;
		class?: string;
	}

	let {
		color = 'currentColor',
		size = 24,
		strokeWidth = 2,
		class: className = '', // inline-block align-middle
	}: Props = $props();
</script>

<div class={className} aria-label="loader-circle" role="img">
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke={color}
		stroke-width={strokeWidth}
		stroke-linecap="round"
		stroke-linejoin="round"
		class="lucide lucide-loader-circle-icon lucide-loader-circle loader-circle-icon"
	>
		<g class="circle animate">
			<path d="M21 12a9 9 0 1 1-6.219-8.56" />
		</g>
	</svg>
</div>

<style>
	.loader-circle-icon {
		overflow: visible;
	}

	.circle {
		transform-origin: center;
		transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}

	.circle.animate {
		animation: spin 0.6s ease-in-out infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
