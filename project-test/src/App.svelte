<script lang="ts">
  import TodoItem from "./TodoItem.svelte";
  let title: string = "Viand Task Manager (Live)";
  let todos: any[] = [];
  let newTodo: string = "";
  function addTodo() {
  if (newTodo.trim()) {
    todos = [...todos, { text: newTodo, done: false }];
    newTodo = "";
}
}
</script>

<div class="container">
<h1>{title}</h1>
<div class="input-group">
  <input bind:value={newTodo} placeholder="What needs to be done?" />
 <button on:click={addTodo}>Add</button>
<div class="list">
  {#each todos as todo}
  <TodoItem task={todo.text} bind:done={todo.done} />
  {/each}
</div>
</div>
</div>
