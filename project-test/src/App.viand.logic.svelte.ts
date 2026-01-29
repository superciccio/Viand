export class AppLogic {
  title = $state("Viand Task Manager (Live)");
  todos = $state([]);
  newTodo = $state("");

  addTodo() {
    if (this.newTodo.trim()) {
      this.sql.save(this.newTodo);
      this.todos = [...this.todos, { text: this.newTodo, done: false }];
      this.newTodo = "";
    }
  }

  loadData() {
    this.todos = this.sql.loadAll();
  }

  sql = {
    loadAll: (...args: any[]) => {
      console.log("SQL EXEC [loadAll]: SELECT * FROM todos ORDER BY id DESC;", args);
      return [];
    },
    save: (...args: any[]) => {
      console.log("SQL EXEC [save]: INSERT INTO todos (text, done) VALUES (?, false);", args);
      return [];
    },
  }
}
