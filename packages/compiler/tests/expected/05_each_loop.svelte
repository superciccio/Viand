<script lang="ts">
  let todos: any[] = $state([]);
</script>

<ul>
  {#each todos as item}
    <li>
      {item.text}
    </li>
  {/each}
</ul>
