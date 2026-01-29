<script lang="ts">
  import { AppLogic } from "./App.viand.logic.svelte";
  const _ = new AppLogic();
</script>

<div class="container">
  <h1>
    {"Welcome " + _.user}
  </h1>
  <p>
    {"The count is " + _.count}
  </p>
  <button onclick={() => _.increment()}>
    Add 1
  </button>
</div>