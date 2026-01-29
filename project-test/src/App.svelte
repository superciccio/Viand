<script lang="ts">
  import TodoItem from "./TodoItem.viand";
  let title: string = $state("Viand Task Manager (Live)");
  let todos: any[] = $state([]);
  let newTodo: string = $state("");

  function addTodo() {
    if ($newTodo.trim()) {
      todos = [...todos, { text: newTodo, done: false }];
      newTodo = "";
    }
  }
</script>

<div class="container">
  <h1>
    {title}
  </h1>
  <div class="input-group">
    <input bind:value={newTodo} placeholder="What needs to be done?" />
    <button on:click={addTodo}>
      Add
    </button>
  </div>
  <div class="list">
    {#each todos as todo}
      <TodoItem task={todo.text} bind:done={todo.done}>
      </TodoItem>
    {/each}
  </div>
</div>

<style>
  .container {
    max-width: 400px;
    margin: 0 auto;
    padding: 20px;
    font-family: sans-serif;
  }
  .input-group {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }
  input {
    flex: 1;
    padding: 8px;
  }
</style>
