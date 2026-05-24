const express = require("express");
const multer = require("multer");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk");

require("dotenv").config();

const app = express();
app.use(express.json());
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const PORT = process.env.PORT || 3000;
const OCR_SPACE_API_KEY = process.env.OCR_SPACE_API_KEY || "helloworld";
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

app.use(express.static(__dirname));

app.get("/api/config", (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/api/scan-receipt", upload.single("receipt"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Please upload a receipt image." });
    }

    const form = new FormData();
    form.append("file", new Blob([req.file.buffer], { type: req.file.mimetype }), req.file.originalname);
    form.append("language", "eng");
    form.append("isOverlayRequired", "false");
    form.append("detectOrientation", "true");
    form.append("scale", "true");
    form.append("OCREngine", "2");

    const ocrResponse = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: { apikey: OCR_SPACE_API_KEY },
      body: form
    });

    const ocrData = await ocrResponse.json();
    if (!ocrResponse.ok || ocrData.IsErroredOnProcessing) {
      const message = ocrData.ErrorMessage || ocrData.ErrorDetails || "OCR.space could not read this receipt.";
      return res.status(502).json({ error: Array.isArray(message) ? message.join(" ") : message });
    }

    const text = (ocrData.ParsedResults || [])
      .map(result => result.ParsedText || "")
      .join("\n")
      .trim();

    const extracted = extractReceiptDetails(text);
    res.json({
      ...extracted,
      text,
      usedDemoKey: OCR_SPACE_API_KEY === "helloworld"
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Receipt scan failed." });
  }
});

function extractReceiptDetails(text) {
  const cleanText = text.replace(/\r/g, "\n");
  const lines = cleanText.split("\n").map(line => line.trim()).filter(Boolean);
  const merchant = lines.find(line => /[a-z]/i.test(line) && !/\d{4,}/.test(line)) || "Unknown merchant";
  const amount = findTotalAmount(lines);
  const category = categorizeReceipt(cleanText);

  return {
    merchant,
    amount,
    category,
    confidence: amount > 0 ? "medium" : "low"
  };
}

function findTotalAmount(lines) {
  const totalLines = lines.filter(line => /(grand\s*)?total|amount|balance|cash|paid/i.test(line));
  const candidates = [...totalLines, ...lines]
    .flatMap(line => line.match(/\b(?:RM|MYR)?\s*([0-9]{1,5}(?:[.,][0-9]{2})?)\b/gi) || [])
    .map(value => Number(value.replace(/RM|MYR|\s/gi, "").replace(",", ".")))
    .filter(value => Number.isFinite(value) && value > 0 && value < 100000);

  if (!candidates.length) return 0;
  return Number(Math.max(...candidates).toFixed(2));
}

function categorizeReceipt(text) {
  const lower = text.toLowerCase();
  const checks = [
    ["Cafe", ["coffee", "cafe", "kopi", "tealive", "zus", "starbucks", "bubble", "tea", "latte"]],
    ["Food", ["restaurant", "nasi", "ayam", "mamak", "food", "meal", "burger", "pizza", "kfc", "mcd", "grabfood"]],
    ["Transport", ["grab", "petrol", "shell", "petronas", "caltex", "parking", "tng", "touch n go", "rapidkl"]],
    ["Shopping", ["shopee", "lazada", "uniqlo", "watsons", "guardian", "mall", "fashion", "store"]],
    ["Bills", ["bill", "utility", "electric", "water", "unifi", "maxis", "celcom", "digi"]],
    ["Entertainment", ["cinema", "movie", "gsc", "tgv", "game", "karaoke"]],
    ["Personal Care", ["salon", "skincare", "haircut", "pharmacy"]],
    ["Fitness", ["gym", "fitness", "sport"]],
    ["Education", ["book", "course", "tuition", "class"]],
    ["Travel", ["hotel", "airasia", "flight", "booking"]]
  ];

  const match = checks.find(([, words]) => words.some(word => lower.includes(word)));
  return match ? match[0] : "Shopping";
}

app.post("/api/rescue-tips", async (req, res) => {
  const { income, earned, wallet, savingGoal, budgetLeft, daysLeft, totalDays,
          paceOverspend, spent, totalSpendable, categories, logs } = req.body;

  if (!anthropic) {
    return res.status(503).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  const catLines = (categories || [])
    .map(c => `  - ${c.name}: budgeted RM${c.amount}, spent RM${c.used} (${c.used > c.amount ? 'OVER by RM' + (c.used - c.amount) : 'RM' + (c.amount - c.used) + ' remaining'})`)
    .join("\n");

  // Build a readable log list — include note context so Claude understands each entry
  const logLines = (logs || [])
    .filter(l => l.expense > 0 || l.earn > 0)
    .map(l => {
      const parts = [`[${l.date}] ${l.category}`];
      if (l.expense > 0) parts.push(`−RM${l.expense}`);
      if (l.earn > 0)    parts.push(`+RM${l.earn} earned`);
      if (l.note)        parts.push(`note: "${l.note}"`);
      return "  " + parts.join(" | ");
    })
    .join("\n") || "  (no entries yet)";

  const situation = budgetLeft < 0
    ? `IN DEFICIT — wallet is RM${Math.abs(budgetLeft)} below saving goal`
    : paceOverspend > 0
      ? `AHEAD OF PACE — spent RM${paceOverspend} more than expected for this point in the period`
      : `ON TRACK — RM${budgetLeft} remaining with ${daysLeft} days left`;

  const prompt = `You are an expert personal finance coach for Malaysian students. Your job is to deeply understand a user's actual spending behaviour — not just add up numbers, but figure out WHO they are as a spender and what they really need to hear.

---
FINANCIAL CONTEXT
- Base income: RM${income} | Extra earned this period: RM${earned}
- Total spendable (after saving goal): RM${totalSpendable}
- Total spent: RM${spent} | Wallet: RM${wallet} | Saving goal: RM${savingGoal}
- Budget left: RM${budgetLeft} (${budgetLeft < 0 ? 'DEFICIT' : 'remaining'})
- Period: ${totalDays} days total, ${daysLeft} days left
- Situation: ${situation}

CATEGORY BUDGETS
${catLines}

DAILY LOG (read every entry carefully)
${logLines}

---
STEP 1 — READ EACH LOG ENTRY WITH CONTEXT
Before writing anything, mentally go through every log entry and ask yourself:
- Is this amount normal for this category in Malaysia? (RM5-12 coffee = normal, RM8 nasi campur = normal, RM80 for "lunch" = suspicious, RM800 "rent" = fixed and expected)
- Is this a one-off or part of a recurring pattern?
- Does the note reveal a habit, a lifestyle choice, or a necessary expense?
- Across all entries: is there a category this user keeps coming back to? Do they have invisible daily habits adding up?

STEP 2 — IDENTIFY BEHAVIOURAL PATTERNS
Based on your reading, identify 2–4 patterns that describe how this person actually spends. Examples of pattern labels: "Daily coffee habit", "Grab-dependent commuter", "Stable fixed costs", "Impulse food buyer", "Weekend lifestyle spender", "Side income earner", "Controlled bills payer". Be specific to their actual data.

STEP 3 — WRITE A BEHAVIOUR SUMMARY
2–3 sentences describing this user's spending personality. Be honest but encouraging. Reference actual amounts and categories. E.g. "You're a food-first spender — RM420 across 14 food entries shows eating out is your main lifestyle cost. Your rent (RM700) and bills are well under control, which gives you flexibility. The real opportunity is in your daily Grab habit, which is quietly adding up."

STEP 4 — GENERATE EXACTLY 3 TIPS
Each tip must be rooted in a specific observed behaviour or log entry — not generic advice. Pick the 3 highest-impact changes based on what you actually saw in the logs. Prioritise recurring habits over one-offs.

---
RULES (apply to all outputs):
1. "rent", "house rent", "monthly rent" → fixed cost. Never suggest cutting. Acknowledge it as healthy if noted.
2. One-off events (wedding, hospital, birthday, emergency, repair) → non-recurring. Don't project as monthly habit.
3. Recurring notes ("daily coffee", "grab to work", "lunch every day") → valid targets for reduction tips.
4. No note on an entry → infer from category + amount (RM9 bills = probably parking/toll, RM400 food = heavy food month).
5. Every tip must end with a full-month analogy using real RM numbers from the data.
6. Status detail must acknowledge something specific from their notes — make them feel understood.
7. save amounts must never exceed what they actually spent in that category.

---
Reply with ONLY valid JSON — no markdown, no code fences, no extra text:
{
  "status": {
    "headline": "3–5 word verdict on their situation",
    "detail": "2 sentences. First: call out something specific you noticed in their notes (e.g. 'Your rent at RM800 is a necessary fixed cost — nothing to cut there.'). Second: overall picture with the key number.",
    "sentiment": "positive" or "warning" or "danger"
  },
  "behaviour": {
    "summary": "2–3 sentences describing their spending personality, rooted in actual log data and amounts.",
    "patterns": [
      { "label": "2–4 word pattern label", "description": "One sentence — what this pattern means for their wallet" }
    ]
  },
  "tips": [
    {
      "title": "Action title (max 6 words)",
      "subtitle": "Specific stat or log note that led to this tip",
      "detail": "2–3 sentences. Cite the actual entry or note. Explain the real impact. End with a full-month analogy: 'Over 30 days, this saves RM___ — enough to ___.'",
      "action": "One concrete step they can take today",
      "save": <realistic integer RM saved this month, or null>
    }
  ]
}

Sentiment rules: "positive" if wallet > savingGoal × 5 and on pace, "warning" if pace is ahead but wallet is still healthy, "danger" if in deficit or wallet < savingGoal.
All 3 tips must target different behaviours observed in the logs. Rank by highest realistic monthly savings first.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1800,
      messages: [
        { role: "user", content: prompt },
        { role: "assistant", content: "{" },
      ],
    });

    // Prefill forces the response to start with "{" — prepend it back
    const raw = ("{" + message.content[0].text).trim();
    // Also strip any trailing markdown fences just in case
    const jsonStr = raw.replace(/\s*```$/, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("[rescue-tips] JSON parse failed. Raw response:\n", jsonStr.slice(0, 500));
      throw parseErr;
    }
    res.json(parsed);
  } catch (err) {
    console.error("[rescue-tips]", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/rescue-tip-single", async (req, res) => {
  const { index, existingTips, income, earned, wallet, savingGoal, budgetLeft, daysLeft,
          totalDays, paceOverspend, spent, totalSpendable, categories, logs } = req.body;

  if (!anthropic) return res.status(503).json({ error: "ANTHROPIC_API_KEY not configured" });

  const catLines = (categories || [])
    .map(c => `  - ${c.name}: budgeted RM${c.amount}, spent RM${c.used} (${c.used > c.amount ? 'OVER by RM' + (c.used - c.amount) : 'RM' + (c.amount - c.used) + ' remaining'})`)
    .join("\n");

  const logLines = (logs || [])
    .filter(l => l.expense > 0 || l.earn > 0)
    .map(l => {
      const parts = [`[${l.date}] ${l.category}`];
      if (l.expense > 0) parts.push(`−RM${l.expense}`);
      if (l.earn > 0)    parts.push(`+RM${l.earn} earned`);
      if (l.note)        parts.push(`note: "${l.note}"`);
      return "  " + parts.join(" | ");
    })
    .join("\n") || "  (no entries yet)";

  const situation = budgetLeft < 0
    ? `IN DEFICIT — wallet is RM${Math.abs(budgetLeft)} below saving goal`
    : paceOverspend > 0
      ? `AHEAD OF PACE — spent RM${paceOverspend} more than expected for this point in the period`
      : `ON TRACK — RM${budgetLeft} remaining with ${daysLeft} days left`;

  const existingTitles = (existingTips || [])
    .filter((_, i) => i !== index)
    .map(t => `"${t.title}"`)
    .join(", ") || "none";

  const prompt = `You are a sharp, empathetic personal finance coach for a Malaysian student budgeting app.

User's financial picture:
- Base income: RM${income} | Extra earned: RM${earned}
- Total available to spend (after goal): RM${totalSpendable}
- Total spent: RM${spent} | Wallet: RM${wallet} | Saving goal: RM${savingGoal}
- Budget left: RM${budgetLeft} | Period: ${totalDays} days, ${daysLeft} remaining
- Situation: ${situation}

Category breakdown:
${catLines}

Daily log entries:
${logLines}

RULES:
1. Notes saying "rent", "house rent" — fixed cost, do NOT suggest reducing.
2. One-off events ("wedding", "hospital", "birthday", "emergency") — non-recurring.
3. Daily habits ("coffee every day", "grab to work") — valid reduction targets.
4. Always end with a full-month analogy using real RM numbers.
5. Do NOT repeat or closely resemble these existing tips: ${existingTitles}. Generate something genuinely different.

Generate ONE new tip for position ${index + 1} of 3. It must be meaningfully different from the existing tips.

Reply with ONLY valid JSON — no markdown, no extra text:
{
  "title": "Action title (max 6 words)",
  "subtitle": "One specific supporting stat or note from their log",
  "detail": "2-3 sentences referencing actual notes/categories. End with a full-month analogy using real RM numbers.",
  "action": "One concrete step they can take today",
  "save": <realistic integer RM saved this month, or null>
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });
    const raw = message.content[0].text.trim();
    const parsed = JSON.parse(raw);
    res.json({ tip: parsed });
  } catch (err) {
    console.error("[rescue-tip-single]", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`MoneyWise running at http://localhost:${PORT}`);
  if (OCR_SPACE_API_KEY === "helloworld") {
    console.log("Using OCR.space demo key. Set OCR_SPACE_API_KEY for your own key.");
  }
});
