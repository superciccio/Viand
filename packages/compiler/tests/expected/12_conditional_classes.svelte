<script lang="ts">
  import { ConditionalClassLogic } from "./ConditionalClass.viand.logic.svelte";
  const $ = new ConditionalClassLogic();
</script>

<div class:active={$.isActive} class="box">
  Status Box
</div>
