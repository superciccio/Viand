<script lang="ts">
  import { TodoListLogic } from "./TodoList.viand.logic.svelte";
  const _ = new TodoListLogic();
</script>

<ul>
  {#each _.todos as item}
    <li>
      {item.text}
    </li>
  {/each}
</ul>
