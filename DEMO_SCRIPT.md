# Carbonceipt — Demo Video Script

**Target length:** 2:00–2:30
**Format:** Screen recording with voiceover (or text overlays if no mic)

---

## Scene 1: Hook (0:00–0:15)

**[SCREEN:黑色背景， white text animate in]**

Text overlay: *"What's the carbon footprint of your daily spending?"*

Text overlay: *"Most people have no idea."*

→ Cut to Carbonceipt landing page

---

## Scene 2: Product Intro (0:15–0:30)

**[SCREEN: Carbonceipt empty state — the full dashboard with gradient mesh background, glass card, empty state message]**

Text overlay (or voiceover):
"Carbonceipt is an open-source tool that converts every purchase into its real-time CO₂ footprint. Enter any transaction — groceries, gas, a flight — and see exactly how much carbon your dollar costs the planet."

**[HOVER over the form inputs]**

"Enter what you bought and how much you spent. That's it."

---

## Scene 3: Live Demo — Add Transaction (0:30–0:50)

**[SCREEN: Type into the form]**

**Action:** Type "Whole Foods grocery run" in description, "87.43" in amount
**Action:** Click "Track It"

**[Wait for result card to appear]**

Text overlay: *"$87.43 in groceries = 30.60 kg CO₂e"*

"The app auto-categorized this as Groceries and calculated the CO₂ impact using EPA emission factors. That's roughly the equivalent of driving your car 75 miles."

**Action:** Type "Shell Gas Station", "52.00", click Track It
**Action:** Type "Netflix Subscription", "15.99", click Track It

---

## Scene 4: Dashboard Overview (0:50–1:20)

**[SCREEN: Scroll down to show the full dashboard populated]**

**[PAN across the 4 stat cards]**

Text overlay: *"93.16 kg CO₂ across 3 transactions · $155.42 spent"*

"Your dashboard shows total CO₂, total spending, your top-emitting category, and average per-transaction impact."

**[HOVER over the category breakdown]**

"The category breakdown uses color-coded bars to show where your emissions come from. Gas and groceries dominate — no surprise."

**[HOVER over the 7-Day Trend chart]**

"The trend chart tracks your daily emissions over time. As you add more transactions, you see patterns emerge."

---

## Scene 5: Demo Data — Full Dashboard (1:20–1:45)

**[SCREEN: Click "Load Demo Data" button in the transaction list]**

**Action:** Click "Load Demo Data"

**[Wait for 12 seed transactions to load]**

Text overlay: *"403.5 kg CO₂e across 12 transactions"*

"With demo data loaded, you can see the full power of the dashboard."

**[Scroll through transaction list]**

"Each transaction shows its emoji category icon, description, dollar amount, and CO₂ impact. Hover to reveal the delete button."

**[HOVER over a transaction to show delete button]**

"Every action updates the dashboard in real-time. Add, delete, categorize — it's instant."

---

## Scene 6: Share Card + Impact (1:45–2:00)

**[SCREEN: Scroll to the bottom "Your Carbon Receipt" card]**

Text overlay: *"Your Carbon Receipt: 403.52 kg CO₂e"*

"The Carbon Receipt summary gives you a shareable snapshot of your total environmental impact. This is the number most people have never seen before."

---

## Scene 7: Technical + Outro (2:00–2:20)

**[SCREEN: Split view — left: code editor showing backend main.py, right: running app]**

Text overlay:
"Carbonceipt is built with Next.js, FastAPI, and Tailwind. It uses the Climatiq carbon intelligence API with EPA fallback data. The entire stack is open-source and Docker-deployed."

**[SCREEN: GitHub repo page — github.com/scastile/carbonceipt]**

"Star it, fork it, contribute. Link in the description."

**[SCREEN: Final frame]**

"Carbonceipt — Know your impact. Change your habits."

---

## Recording Notes

- **Resolution:** 1920x1080 browser window
- **Cursor:** Use large cursor or highlight clicks
- **Pacing:** Don't rush — let each action complete before moving on
- **Audio:** Record voiceover separately if possible, or use text overlays
- **Zoom:** Zoom in on key UI elements when showing details (result card, chart bars)
- **Before recording:** Clear browser cache, close DevTools overlay (the red "1 Issue" badge)
- **DevTools fix:** Press Escape or click the X on the red badge before recording

## Required Edits

- [ ] Close/dismiss the "1 Issue" Next.js overlay before recording
- [ ] Consider hiding the "Issue" badge permanently during recording
- [ ] Pre-type transactions quickly — form submissions should feel snappy
- [ ] Add zoom effects on the result card and share card
- [ ] Add upbeat background music (royalty-free, low volume)
- [ ] End card: GitHub repo URL + "Built for Beyond Tomorrow Summit 2026"
