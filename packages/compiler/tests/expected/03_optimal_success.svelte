<script lang="ts">
  import { AppLogic } from "./App.viand.logic.svelte";
  const $ = new AppLogic();
</script>

<div class="container">
  <h1>
    Welcome {$.user}
  </h1>
  <p>
    The count is {$.count}
  </p>
  <button onclick={() => $.increment()}>
    Add 1
  </button>
</div>
