<script lang="ts">
  import { BindingTestLogic } from "./BindingTest.viand.logic.svelte";
  const $ = new BindingTestLogic();
</script>

<form onsubmit|preventDefault={(...args) => $.handleSubmit(...args)}>
  <input bind:value={$.text} placeholder="Type here" />
  <button>
    Submit
  </button>
  <button onclick={(...args) => $.handleSubmit(...args)}>
    Explicit Click
  </button>
  <button onclick={() => $.handleSubmit()}>
    Shorthand Click
  </button>
</form>
