# 🏗️ Technical Deep-Dive: Ark UI + Viand Signals

Ark UI is built on **Zag.js**, a library of headless state machines. Integrating them into Viand is a matter of syncing the Zag "context" with Viand "Signals."

## 1. The Machine + Connect Pattern
In Viand, using an Ark component would look like this:

```viand
# MyTabs.viand
component MyTabs:
  on mount:
    # 1. Initialize the Zag machine
    $service = ark.tabs.machine({ id: "tabs-1", value: "tab-1" })
    
    # 2. Connect the machine to a reactive object
    $tabs = computed(() => ark.tabs.connect($service.state, $service.send))

  view:
    # 3. Use the 'spread:' keyword (Proposed) to apply multiple attributes
    div spread: $tabs.getRootProps()
      div spread: $tabs.getListProps()
        button spread: $tabs.getTriggerProps({ value: "tab-1" }): Home
        button spread: $tabs.getTriggerProps({ value: "tab-2" }): About
      
      div spread: $tabs.getContentProps({ value: "tab-1" }): Welcome Home!
      div spread: $tabs.getContentProps({ value: "tab-2" }): This is Viand.
```

## 2. Why this is superior to Svelte/React
1. **Zero Lifecycle Overhead:** Zag machines update independent of the component render cycle. Viand signals only re-trigger the specific DOM attributes that change, making it faster than a full "Connect" re-render in React.
2. **True Headless:** You aren't fighting with a `Tabs` component that has its own internal <div> structure. You have 100% control over the HTML structure.

## 3. Required Compiler Upgrade: `spread:`
To make this work, the Viand compiler needs to support a `spread:` keyword that takes a reactive object and applies its keys as attributes.

**Generated JS (Ghost Code):**
```javascript
h("div", { 
  ...computed(() => tabs.value.getRootProps()) 
}, [...])
```

## 4. The "Pantry" Strategy
Instead of the user writing this logic every time, we provide **Pre-Bound Pantry Components**:

```viand
# pantry/Tabs.viand
component Tabs:
  @prop $value
  
  on mount:
    $service = ark.tabs.machine({ value: $value.value })
    $tabs = computed(() => ark.tabs.connect($service.state, $service.send))
  
  view:
    div spread: $tabs.getRootProps():
      slot: # Users put their Triggers and Content here
```

## 🏁 How we get there
1. **Update `h` function:** Ensure it can handle objects passed as spreading attributes.
2. **Update Lexer/Parser:** Add support for the `spread:` keyword.
3. **Pantry Registry:** Create the first 5 "Foundry" components (Tabs, Accordion, Menu, Tooltip, Dialog).

By using Ark UI's state machines, we get **WAI-ARIA compliance** and **Keyboard Navigation** for free, while keeping Viand's performance and design flexibility.
