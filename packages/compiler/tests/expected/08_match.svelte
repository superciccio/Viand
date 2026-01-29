<script lang="ts">
  import { MatchTestLogic } from "./MatchTest.viand.logic.svelte";
  const $ = new MatchTestLogic();
</script>

{#if $.status === "loading"}
  <p>
    Loading...
  </p>
{:else if $.status === "error"}
  <p>
    Error!
  </p>
{:else}
  <p>
    Content
  </p>
{/if}
