export class StateLogic {
  theme = $state("dark");

  toggle() {
    this.theme = this.theme == "dark" ? "light" : "dark";
  }
}

export const State = new StateLogic();
