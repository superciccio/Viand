import { describe, it, expect } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/svelte';
import { AppLogic } from './App.viand.logic.svelte';
import App from './App.viand';

describe('App logic', () => {
  it('should pass logic verification', async () => {
    const _ = new AppLogic();
    expect(_.todos.length == 0).toBeTruthy();
    _.newTodo = "Research Tauri";
    _.addTodo();
    expect(_.todos.length == 1).toBeTruthy();
    expect(_.todos[0].text == "Research Tauri").toBeTruthy();
  });
});
describe('App ui', () => {
  it('should pass ui verification', async () => {
    render(App);
    expect(screen.getByText(/Andrea/i)).toBeInTheDocument();
    expect(screen.getByText(/Add/i)).toBeInTheDocument();
  });
});
