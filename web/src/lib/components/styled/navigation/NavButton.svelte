<script lang="ts">
  import type {Snippet} from 'svelte';

  interface Props {
    class?: string;
    params?: Record<string, any>;
    state?: any;
    href?: string | undefined;
    blank?: boolean;
    type?: 'button' | 'submit' | 'reset' | undefined;
    label: string;
    big?: boolean;
    active?: boolean;
    disabled?: boolean;
    waitOnDisabled?: boolean;
    secondary?: boolean;
    tertiary?: boolean;
    danger?: boolean;
    white?: boolean;
    customPadding?: string;
    onclick?: (e: MouseEvent) => void;
    children?: Snippet;
  }

  let {
    class: _class = '',
    params: _params = {},
    state: _state = null,
    href = undefined,
    blank = false,
    type = undefined,
    label,
    big = false,
    active = false,
    disabled = false,
    waitOnDisabled = false,
    secondary = false,
    tertiary = false,
    danger = false,
    white = false,
    customPadding = '',
    onclick,
    children,
  }: Props = $props();

  const primary = $derived(!secondary && !tertiary && !danger && !white);

  const sizeClasses = $derived(
    big
      ? `${customPadding || 'px-8 py-3 md:px-10 md:py-4'} border-4 leading-6 space-x-3 rounded-lg md:text-lg`
      : `${customPadding || 'px-4 py-2'} text-sm border-2 space-x-1 rounded-md sm:leading-5`,
  );

  const colorClasses = $derived.by(() => {
    let hoverClasses = 'hover:-translate-y-px ';
    let focusClasses = 'focus:-translate-y-px ';
    let activeClasses = 'active:-translate-y-px ';
    let activatedClasses = '-translate-y-px ';
    let disabledClasses = 'opacity-50 ' + (waitOnDisabled ? 'cursor-wait ' : '');

    if (primary) {
      return {
        colorClasses: `text-white bg-pink-600`,
        hoverClasses: hoverClasses + `hover:bg-pink-500`,
        focusClasses: focusClasses + `focus-not-active:bg-pink-500`,
        activeClasses: activeClasses + `active:bg-pink-600 active:border-pink-500`,
        activatedClasses: activatedClasses + `bg-pink-600 border-pink-500`,
        disabledClasses,
      };
    } else if (secondary) {
      return {
        colorClasses: `text-pink-600 bg-gray-100 dark:text-pink-500 dark:bg-gray-900`,
        hoverClasses: hoverClasses + `hover:bg-gray-50 dark:hover:bg-gray-800`,
        focusClasses: focusClasses + `focus-not-active:bg-gray-50 dark:focus-not-active:bg-gray-800`,
        activeClasses:
          activeClasses +
          `active:bg-gray-100 active:border-gray-50 dark:active:bg-gray-900 dark:active:border-gray-800`,
        activatedClasses: activatedClasses + `bg-gray-100 border-gray-50 dark:bg-gray-900 dark:border-gray-800`,
        disabledClasses,
      };
    } else if (tertiary) {
      return {
        colorClasses: `text-gray-500 dark:text-gray-400`,
        hoverClasses:
          hoverClasses + `hover:text-gray-600 hover:bg-gray-50 dark:hover:text-gray-300 dark:hover:bg-gray-900`,
        focusClasses:
          focusClasses +
          `focus-not-active:text-gray-600 focus-not-active:bg-gray-50 dark:focus-not-active:text-gray-300 dark:focus-not-active:bg-gray-900`,
        activeClasses:
          activeClasses +
          `active:text-gray-600 active:bg-white active:border-gray-50 dark:active:text-gray-300 dark:active:bg-black dark:active:border-gray-900`,
        activatedClasses:
          activatedClasses + `bg-transparent border-gray-50 text-gray-600 dark:text-gray-300 dark:border-gray-900`,
        disabledClasses,
      };
    } else if (danger) {
      return {
        colorClasses: `text-red-700 bg-red-100`,
        hoverClasses: hoverClasses + `hover:bg-red-50`,
        focusClasses: focusClasses + `focus-not-active:bg-red-50`,
        activeClasses: activeClasses + `active:bg-red-100`,
        activatedClasses: activatedClasses + `bg-red-100`,
        disabledClasses,
      };
    } else if (white) {
      return {
        colorClasses: `text-pink-600 bg-white`,
        hoverClasses: hoverClasses + `hover:text-pink-500`,
        focusClasses: focusClasses + `focus-not-active:text-pink-500`,
        activeClasses: activeClasses + `active:text-pink-600`,
        activatedClasses: activatedClasses + `text-pink-600`,
        disabledClasses,
      };
    }
    return {
      colorClasses: '',
      hoverClasses,
      focusClasses,
      activeClasses,
      activatedClasses,
      disabledClasses,
    };
  });

  const classes = $derived(
    `w-full flex items-center justify-center font-medium select-none transition transform duration-150 ease-in-out focus:outline-none ${colorClasses.colorClasses} ${sizeClasses} ${
      disabled
        ? colorClasses.disabledClasses
        : active
          ? colorClasses.activatedClasses
          : `border-transparent ${colorClasses.hoverClasses} ${colorClasses.focusClasses} ${colorClasses.activeClasses}`
    } ${_class}`,
  );

  function canNavigate(event: MouseEvent, target: EventTarget | null) {
    return (
      !event.defaultPrevented &&
      !target &&
      event.button === 0 &&
      !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
    );
  }

  const isInternalLink = $derived(!!(href && !href.startsWith('http')));

  function handlePageLink(event: MouseEvent) {
    if (isInternalLink && canNavigate(event, event.currentTarget)) {
      event.preventDefault();
    }
  }
</script>

{#if href}
  {#if isInternalLink}
    <a aria-label={label} title={label} {href} class={classes} onclick={handlePageLink}>
      {#if children}
        {@render children()}
      {:else}
        Name
      {/if}
    </a>
  {:else}
    <a
      aria-label={label}
      title={label}
      {href}
      rel={blank === true ? 'noopener noreferrer' : ''}
      target={blank === true ? '_blank' : ''}
      class={classes}
    >
      {#if children}
        {@render children()}
      {:else}
        Name
      {/if}
    </a>
  {/if}
{:else if type}
  <button aria-label={label} title={label} {type} {disabled} class={classes}>
    {#if children}
      {@render children()}
    {:else}
      Name
    {/if}
  </button>
{:else}
  <button {onclick} aria-label={label} title={label} type="button" {disabled} class={classes}>
    {#if children}
      {@render children()}
    {:else}
      Name
    {/if}
  </button>
{/if}
