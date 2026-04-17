# 🌳 CFG Explorer: Grammar Visualizer & Ambiguity Analyzer

> An interactive web application that visualizes Context-Free Grammars (CFG), generates derivations, builds parse trees, and detects ambiguity in grammars.

---

## 🎯 About

A **Context-Free Grammar (CFG)** is used to describe languages with recursive structure (like programming languages and expressions).

This project allows users to:

* Define grammars
* Generate strings
* Visualize derivations
* Build parse trees
* Detect ambiguity (multiple parse trees)

It transforms abstract Theory of Computation concepts into an **interactive visual experience**.

---

## ✨ Features

* **Grammar Input Panel** — Define productions like `S → aSb | ε`
* **String Testing** — Check if a string belongs to the grammar
* **Leftmost Derivation** — Step-by-step expansion from left
* **Rightmost Derivation** — Step-by-step expansion from right
* **Parse Tree Visualization 🌳** — Animated tree generation
* **Ambiguity Detection ⚠️** — Shows multiple parse trees if grammar is ambiguous
* **Side-by-Side Trees** — Compare different derivations visually
* **Educational Panel 📚** — Explains CFG concepts dynamically
* **Preloaded Examples** — Balanced parentheses, arithmetic expressions

---

## 🚀 How to Run

```bash
git clone https://github.com/YOUR_USERNAME/cfg-explorer.git
cd cfg-explorer
open index.html
```

No installation required. Just open `index.html` in your browser.

---

## 📁 Files

```
index.html   → Structure and UI layout
style.css    → Glassmorphism + neon UI styling
script.js    → Grammar parser, derivation engine, tree generator
```

---

## ⌨️ User Workflow

1. Enter a grammar:

```
S → aSb | ε
```

2. Enter a string:

```
aabb
```

3. Click:
   👉 **Generate Derivation**

4. View:

* Leftmost derivation
* Rightmost derivation
* Parse tree(s)
* Ambiguity result

---

## 🧠 Key Concepts Demonstrated

### 🔹 Leftmost Derivation

Always expand the **leftmost non-terminal**:

```
S ⇒ aSb ⇒ aaSbb ⇒ aabb
```

---

### 🔹 Rightmost Derivation

Always expand the **rightmost non-terminal**

---

### 🌳 Parse Tree

A hierarchical representation of how a string is derived from the grammar.

---

### ⚠️ Ambiguity

A grammar is **ambiguous** if:
👉 One string has **multiple parse trees**

Example:

```
E → E + E | E * E | id
```

String:

```
id + id * id
```

👉 Two different parse trees possible → Ambiguous

---

## 🎨 UI Highlights

* Dark futuristic theme 🌌
* Neon glow effects ✨
* Glassmorphism panels 🪟
* Animated parse trees 🌳
* Smooth transitions and interactions

---

## 🎓 Academic Relevance

This project covers:

* Context-Free Grammar (CFG)
* Derivation (Leftmost & Rightmost)
* Parse Trees
* Ambiguity in Grammar
* Language generation

👉 Directly aligned with **Unit 3 of Theory of Computation**

---

## 🏁 Conclusion

This project bridges the gap between theory and practice by making CFG concepts:

* Visual 👀
* Interactive 🎮
* Easy to understand 🧠

A powerful learning tool for students studying formal languages and automata.

---
