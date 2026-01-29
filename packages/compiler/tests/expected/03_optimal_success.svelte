<script lang="ts">
  let count: number = $state(0);
  let user: string = $state("Andrea");

  function increment() {
    count += 1;
  }
</script>

<div class="container">
  <h1>
    Welcome {user}
  </h1>
  <p>
    The count is {count}
  </p>
  <button onclick={increment}>
    Add 1
  </button>
</div>
