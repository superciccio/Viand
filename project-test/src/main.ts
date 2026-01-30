import { mount } from '@viand/runtime'
import { App } from './App.viand'

const target = document.getElementById('app')!;
mount(target, () => App());
