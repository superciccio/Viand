<script lang="ts">
  import { router } from "./viand-router.svelte.ts";
  import { AppLogic } from "./App.viand.logic.svelte";
  const _ = new AppLogic();
</script>

{#if router.path === "/"}
  Home
{:else if router.path === "/about"}
  About
{:else}
  404
{/if}
