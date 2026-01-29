<script lang="ts">
  import State from "./State.viand";
  import { ThemeToggleLogic } from "./ThemeToggle.viand.logic.svelte";
  const _ = new ThemeToggleLogic();
</script>

<button onclick={() => State.toggle()}>
  {State.theme}
</button>