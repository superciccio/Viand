import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/dom';
import { mount } from '@viand/runtime';
import { App } from './App.viand';

describe('App Component', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    const target = document.getElementById('app')!;
    mount(target, () => App());
  });

  it('renders the initial state', () => {
    expect(screen.getByText(/Andrea's Tasks/i)).toBeTruthy();
    expect(screen.getByPlaceholderText(/What needs to be done\?/i)).toBeTruthy();
  });

  it('adds a new todo', async () => {
    const input = screen.getByPlaceholderText(/What needs to be done\?/i) as HTMLInputElement;
    const button = screen.getByText(/Add/i);

    await fireEvent.input(input, { target: { value: 'New Task' } });
    await fireEvent.click(button);

    expect(screen.getByText(/New Task/i)).toBeTruthy();
  });
});