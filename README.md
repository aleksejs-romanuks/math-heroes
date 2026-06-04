# 🦸 Math Heroes

A colorful, kid-friendly math game played right in the browser. Kids pick a game,
race a friendly timer, and earn stars!

## 🎮 Game Modes

| Mode | What kids do |
| --- | --- |
| ➕ **Addition** | A question like `3 + 4 = ?` appears. Tap the correct answer out of 3 choices. |
| ➖ **Subtraction** | A question like `8 − 3 = ?` appears. Tap the correct answer out of 3 choices. |
| ⚖️ **Greater or Equal** | Two numbers appear like `7 ? 4`. Tap the right sign: **<**, **=** or **>**. |

Before playing, kids also choose:

- **Difficulty** – biggest number used: *Up to 10*, *Up to 20* or *Up to 100*.
- **Questions** – how many to play: 5, 10, 15 or 20.

A 🏠 home button is always available to jump back to the menu.

## ⭐ Scoring

- The timer counts how long the round takes.
- Each correct answer earns a star; wrong answers add a small time penalty.
- A friendly score screen shows correct answers, time, and your **best time**
  (saved in the browser for each mode and question count).

## ▶️ How to Run

No build step or dependencies. Just open the game:

```bash
cd "src"
# Open index.html in your browser, or serve it locally:
python3 -m http.server 8000
# then visit http://localhost:8000
```

## 📁 Project Structure

```
src/
  index.html   # Game layout and pages
  script.js    # Game logic and the three modes
  shuffle.js   # Array shuffle helper
  style.css    # Kid-friendly styling
  logo.png
```

## 📄 License

MIT — see [LICENSE](LICENSE).
