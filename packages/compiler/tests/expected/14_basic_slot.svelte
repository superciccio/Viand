<script lang="ts">
  import { LayoutLogic } from "./Layout.viand.logic.svelte";
  let { children } = $props();
  const _ = new LayoutLogic();
</script>

<div class="shell">
  {@render children()}
</div>