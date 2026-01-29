<script lang="ts">
  import Layout from "./Layout.viand";
  import { AppLogic } from "./App.viand.logic.svelte";
  const _ = new AppLogic();
</script>

<Layout>
  {#snippet children()}
    <h1>
      Hello from Slot
    </h1>
  {/snippet}
</Layout>
