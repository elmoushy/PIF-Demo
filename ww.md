## 1  Color Palette (hard‑coded hex)

> **Important:** **DO NOT** rely on `var(--token‑name)` in production CSS.  
> You may keep the token names in comments for readability, but every declaration must use the **raw hex value** shown below.

| Token name (for docs / comments) | Hex value | Intended use |
|----------------------------------|-----------|--------------|
| **LIGHT** |
| `bg‑light‑primary`   | #F8F9FA | page background |
| `bg‑light‑surface`   | #FFFFFF | cards / panels |
| `brand‑green`        | #007E31 | primary actions |
| `brand‑gold`         | #CBA35C | secondary accents |
| `accent‑neon`        | #00FFC2 | hover / glow |
| `accent‑cyan`        | #2AB8FF | info / badges |
| `text‑light‑high`    | #0B0F10 | headings |
| `text‑light‑muted`   | #4F5560 | body text |
| `border‑light`       | #CED4DA | dividers |
| **NIGHT** |
| `bg‑night‑primary`   | #0B0F10 | page background |
| `bg‑night‑surface`   | #12181D | cards / panels |
| `brand‑green`        | #007E31 | primary actions |
| `brand‑gold`         | #CBA35C | secondary accents |
| `accent‑neon`        | #00FFC2 | hover / glow |
| `accent‑cyan`        | #2AB8FF | info / badges |
| `text‑night‑high`    | #E8EDF2 | headings |
| `text‑night‑muted`   | #8C949E | body text |
| `border‑night`       | #1F262B | dividers |



### Usage pattern

```css
/* ❌  Don’t do this
button { background: var(--brand-green); }
*/

/* ✅  Do this  —— token kept as a comment */
button {
  /* brand‑green */
  background: #007E31;
  color: #E8EDF2; /* text‑night‑high */
}
````