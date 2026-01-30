# 🎨 The UI Pantry: Polished UI Without the Boilerplate

We shouldn't reinvent the wheel. To win against shadcn/ui and Bootstrap, Viand will provide a **"UI Pantry"**—a collection of headless primitives that you can style with Tailwind.

## 1. The Strategy: Headless + Tailwind
Instead of creating a custom component library from scratch, we will bridge existing "Headless" giants:
- **Ark UI / Radix UI / Headless UI:** These handle the high-difficulty logic (accessibility, focus, keyboard navigation, state).
- **Viand "Pantry" Glue:** We wrap these primitives in Viand-friendly syntax.

## 2. Why "Ark UI"?
**Ark UI** (from the Chakra UI team) is the perfect candidate. It is framework-agnostic and built on state machines.
- **Signals Sync:** We can easily bind Ark's state to Viand signals.
- **No Style Opinions:** It provides zero CSS, letting the user use **Tailwind** as they wish.

## 3. The "Pantry" Install
Instead of `npm install`, we use:
```bash
viand add pantry/tabs
```
This downloads a `.viand` component that wraps the headless logic, giving you:
```viand
Tabs
  TabList
    Tab value: "1": Home
    Tab value: "2": About
  TabPanel value: "1": Welcome to Viand!
```

## 4. Pre-Styled Options (The "Preline/Flowbite" Path)
For users who want "instant beautiful," we can provide **Tailwind Snippets** from libraries like **Preline UI** or **Flowbite**.
- **Blueprint Sibling:** A `.ui` file that contains the Tailwind HTML snippets. The compiler converts these into Viand view-nodes automatically.

## 🏁 Summary
Viand shouldn't be a closed ecosystem. By leveraging **Ark UI** for logic and **Tailwind** for design, we provide a DX that feels as powerful as shadcn/ui but with the speed and simplicity of Signals.
