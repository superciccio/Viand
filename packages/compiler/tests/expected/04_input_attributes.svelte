<script lang="ts">
  import { InputTestLogic } from "./InputTest.viand.logic.svelte";
  const _ = new InputTestLogic();
</script>

<input type="text" value={_.myValue} />