<script lang="ts">
  import { MatchTestLogic } from "./MatchTest.viand.logic.svelte";
  const _ = new MatchTestLogic();
</script>

{#if _.status === "loading"}
  <p>
    Loading...
  </p>
{:else if _.status === "error"}
  <p>
    Error!
  </p>
{:else}
  <p>
    Content
  </p>
{/if}
