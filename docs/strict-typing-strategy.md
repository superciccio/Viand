# 🛡️ Gradual Typing: Strict vs. Non-Strict Viand

To scale from simple prototypes to enterprise-grade applications, Viand needs a way to enforce type safety. We propose a **Gradual Typing System** where developers can choose the level of enforcement.

## 1. 🎚️ The Enforcement Levels

### a. Non-Strict (Standard Mode)
The default experience. Types are inferred where possible, but the compiler doesn't "scream" if types are missing. Everything is treated like flexible JavaScript.

### b. Strict Mode (The "Iron" Guard)
Triggered by a flag in the component or project config:
```viand
# MyComponent.viand
strict: true

component MyComponent:
  @prop name: string  # Error if type is missing
  @state count: number = 0
```
In Strict Mode, the compiler enforces:
1. **Prop Types:** All `@prop` and `@state` declarations must have a type.
2. **Function Signatures:** Function parameters and return values must be typed.
3. **Template Safety:** The compiler checks that `$count` isn't being passed to a prop that expects a `string`.

## 2. 🧩 The Syntax: "Viand-Typed"
Viand types stay close to TypeScript but with a cleaner, indentation-friendly feel.

```viand
component UserDashboard:
  @prop user: { id: string, email: string }
  @prop isAdmin: boolean = false
  
  on mount:
    $items = api.getItems() : Array<Item> # Type Assertion

  save(data: Object): boolean
    return api.post(data)
```

## 3. 🧠 How the Compiler Handles It
To implement this without rewriting the engine:

1. **JSDoc Generation:** The compiler translates Viand types into JSDoc comments in the "Ghost Code" (JS output).
2. **TypeScript Validation (Behind the scenes):** During `viand bake` or `viand dev`, we run a background instance of `tsc` on the generated Ghost Code. If there are type errors, the Viand CLI reports them as **Language Errors**.
3. **LSP Integration:** The LSP uses the same type-checking logic to provide red squiggles in the `.viand` file when a type mismatch occurs.

## 4. 🔗 Sibling Typing (The Multi-File Brain)
The true power of Viand's strict mode is **Cross-Sibling Validation**:
- **SQL -> View:** If `Home.sql` returns `{ id: number }`, but `Home.viand` expects `user.id` to be a `string`, the compiler flags a **Sibling Mismatch Error**.
- **API -> State:** Validating that the JSON response from an `.api` file matches the `@state` signal it's being assigned to.

## 🏁 Summary
Viand isn't trying to be TypeScript, but it should **leverage** TypeScript's power. By allowing a `strict: true` toggle, we give developers the choice: **Fast Prototyping** or **Industrial-Strength Safety**.

Isomorphic typing across Web, Server (Nitro), and Native (Tauri) becomes our ultimate competitive advantage.
