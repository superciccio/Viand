<script lang="ts">
  import { InputTestLogic } from "./InputTest.viand.logic.svelte";
  const $ = new InputTestLogic();
</script>

<input type="text" value={$.myValue} />