<script lang="ts">
  let todos: any = [];
</script>

<ul>
  {#each todos as item}
    <li>{item.text}</li>
  {/each}
</ul>