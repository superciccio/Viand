<script lang="ts">
  import { BindingTestLogic } from "./BindingTest.viand.logic.svelte";
  const _ = new BindingTestLogic();
</script>

<form onsubmit|preventDefault={(...args) => _.handleSubmit(...args)}>
  <input bind:value={_.text} placeholder="Type here" />
  <button>
    Submit
  </button>
  <button onclick={(...args) => _.handleSubmit(...args)}>
    Explicit Click
  </button>
  <button onclick={() => _.handleSubmit()}>
    Shorthand Click
  </button>
</form>
