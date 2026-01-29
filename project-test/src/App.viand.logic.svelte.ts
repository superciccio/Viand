export class AppLogic {
  title = $state("Viand Task Manager (Live)");
  todos = $state([]);
  newTodo = $state("");

  addTodo() {
    if (this.newTodo.trim()) {
      this.todos = [...this.todos, { text: this.newTodo, done: false }];
      this.newTodo = "";
    }
  }
}
