import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/dom';
import { mount } from '@viand/runtime';
import { App } from './App.viand';

describe('App Component', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    const target = document.getElementById('app')!;
    mount(target, () => App());
  });

  it('ui verification', async () => {
    if (window.viand) window.viand.use({
      sql: (label, ...args) => {
        if (label === 'save') return (vi.fn())(...args);
        if (label === 'loadAll') return (vi.fn().mockReturnValue([]))(...args);
        return [];
      },
    });
    const input_newTodo = document.querySelector('input');
    if (input_newTodo) await fireEvent.input(input_newTodo, { target: { value: "Research Signals" } });
    await fireEvent.click(screen.getByText(/Add/i));
  });
});
