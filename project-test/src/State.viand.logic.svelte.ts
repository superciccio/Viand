export class StateLogic {
  executiveName = $state("Andrea");
}

// Memory Pillar: Export a singleton instance
export const State = new StateLogic();
