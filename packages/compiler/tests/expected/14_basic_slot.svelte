<script lang="ts">
  import { LayoutLogic } from "./Layout.viand.logic.svelte";
  let { children } = $props();
  const $ = new LayoutLogic();
</script>

<div class="shell">
  {@render children()}
</div>