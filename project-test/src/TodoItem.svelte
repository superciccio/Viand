<script lang="ts">
</script>

<div class:completed={done} class="todo-item">
  <input type="checkbox" bind:checked={done} />
  <span>
    {task}
  </span>
</div>

<style>
  .todo-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    border-bottom: 1px solid #eee;
  }
  .completed {
    text-decoration: line-through;
    color: #888;
  }
</style>
