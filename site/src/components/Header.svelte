<script lang="ts">
  import {type MenuSchemaType} from "../content/config";
  import {fly} from "svelte/transition";
  import type {Locale} from "../customTypes/types";
  let showMenu = false;
  export let headerJson: MenuSchemaType;
  export let isHomePage: boolean;
  export let locale: Locale;
  let windowWidth: undefined | number;

  // export let lang: string;
  function toggleMenu() {
    showMenu = !showMenu;
  }
  function isInternal(link: string) {
    return !link.startsWith("http") && !link.startsWith("file");
  }
  function prefixWithLang(link: string) {
    if (link.startsWith(`/${locale.code}/`)) {
      return `/${link}`;
    } else {
      return `/${locale.code}/${link}`;
    }
  }
</script>

<svelte:window bind:innerWidth={windowWidth} />

<!-- <div> -->
<div id="mobileOnly" class="md:hidden">
  <nav class="bg-black">
    <div class="relative flex justify-between px-4 md:px-8 py-4 items-center">
      <span class="inline-block w-50">
        <a href="/">
          <img src="/images/wa-logo.webp" alt="Wycliffe Associates Logo" />
        </a>
      </span>
      <button
        class="cursor-pointer bg-transparent text-white active:text-yellow text-[50px]"
        on:click={toggleMenu}>☰</button
      >
      {#if showMenu}
        <div
          class="absolute top-full left-0 w-full overflow-hidden transition-all duration-300 bg-black px-4 md:px-8 py-4"
          transition:fly={{y: 0, duration: 300}}
        >
          <ul>
            {#each headerJson.links as link}
              <li>
                <a
                  class={`decoration-none capitalize ${
                    isHomePage ? "text-white" : ""
                  }`}
                  href={link.url}>{link.label}</a
                >
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>
  </nav>
</div>
<div id="deskTop" class="hidden md:block">
  <nav
    class={`bg-transparent flex justify-between px-4 md:px-8 py-4 items-center ${
      isHomePage ? "text-white absolute top-0 w-full" : ""
    }`}
  >
    <span class="inline-block w-50">
      <a href="/">
        <img src="/images/wa-logo.webp" alt="Wycliffe Associates Logo" />
      </a>
    </span>
    <ul class="flex space-x-6">
      {#each headerJson.links as link}
        <li>
          <a
            class={`decoration-none capitalize ${
              isHomePage ? "text-white" : ""
            }`}
            href={`${
              isInternal(link.url) ? prefixWithLang(link.url) : link.url
            }`}
            >{link.label}
          </a>
        </li>
      {/each}
    </ul>
  </nav>
</div>
<!-- </div> -->
