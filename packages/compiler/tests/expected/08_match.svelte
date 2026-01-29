<script lang="ts">
  let status: string = $state("loading");
</script>

{#if status === "loading"}
  <p>
    Loading...
  </p>
{:else if status === "error"}
  <p>
    Error!
  </p>
{:else}
  <p>
    Content
  </p>
{/if}
