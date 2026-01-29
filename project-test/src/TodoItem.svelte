<script lang="ts">
  export let task: string = "";
  export let done: boolean = false;
</script>

<div class="todo-item" class:completed={done}>
<input type="checkbox" bind:checked={done} />
<span>{task}</span>
</div>
