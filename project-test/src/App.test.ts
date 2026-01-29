import { describe, it, expect } from 'vitest';
import { AppLogic } from './App.viand.logic.svelte';

describe('App logic:', () => {
  it('should pass logic: verification', () => {
    const $ = new AppLogic();
    expect($.todos.length == 0).toBeTruthy();
    $.newTodo = "Research Tauri";
    $.addTodo();
    expect($.todos.length == 1).toBeTruthy();
    expect($.todos[0].text == "Research Tauri").toBeTruthy();
  });
});
