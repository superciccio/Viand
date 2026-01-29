<script lang="ts">
  import { ConditionalClassLogic } from "./ConditionalClass.viand.logic.svelte";
  const _ = new ConditionalClassLogic();
</script>

<div class:active={_.isActive} class="box">
  Status Box
</div>
