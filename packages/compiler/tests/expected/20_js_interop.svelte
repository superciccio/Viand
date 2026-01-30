<script lang="ts">
  import { onMount } from "svelte";
  import { Chart } from "chart.js";
  import { DashboardLogic } from "./Dashboard.viand.logic.svelte";
  const _ = new DashboardLogic();
  onMount(() => _.onMount());
</script>

<canvas bind:this={_.chartEl}>
</canvas>
