<script lang="ts">
  import { State } from "./State.viand.logic.svelte";
  import { ThemeToggleLogic } from "./ThemeToggle.viand.logic.svelte";
  const $ = new ThemeToggleLogic();
</script>

<button onclick={(...args) => State.toggle(...args)}>
  {State.theme}
</button>
