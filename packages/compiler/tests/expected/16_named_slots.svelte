<script lang="ts">
  import { SplitLogic } from "./Split.viand.logic.svelte";
  let { side, children } = $props();
  const _ = new SplitLogic();
</script>

<div class="left">
  {@render side()}
</div>
<div class="right">
  {@render children()}
</div>