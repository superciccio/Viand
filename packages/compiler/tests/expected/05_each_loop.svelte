<script lang="ts">
  import { TodoListLogic } from "./TodoList.viand.logic.svelte";
  const $ = new TodoListLogic();
</script>

<ul>
  {#each $.todos as item}
    <li>
      {item.text}
    </li>
  {/each}
</ul>
