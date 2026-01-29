<script lang="ts">
  let count: number = 0;
  let user: string = "Andrea";
  function increment() {
    count += 1;
  }
</script>

<div class="container">
  <h1>Welcome {user}</h1>
  <p>The count is {count}</p>
  <button on:click={increment}>Add 1</button>
</div>