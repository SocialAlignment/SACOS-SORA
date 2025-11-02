# SACOS-SORA Development Roadmap

**Goal:** Test Sora 2 prompts from coffee shop before automating

## Phase 1: Coffee Shop Access ✅ Priority

**What:** Make login work from anywhere
**Why:** So you can test from coffee shop, not just local network
**Time:** 30 minutes

### Tasks:
- [ ] Deploy to Vercel (gives public URL like sacos-sora.vercel.app)
- [ ] Update Clerk with Vercel URL
- [ ] Test login from phone

**Success:** You can login and see dashboard from coffee shop

---

## Phase 2: Brand Data Setup 📊 Critical Foundation

**What:** Put real brand information into Qdrant
**Why:** AI needs brand context to make good prompts
**Time:** 2-3 hours per brand

### What Brands Need to Provide:

**1. Brand Identity (Text)**
```
- Brand name: "Nike"
- Tagline: "Just Do It"
- Mission: "Bring inspiration and innovation to every athlete"
- Tone: "Motivational, empowering, athletic"
- Colors: ["#FF6B00", "#000000", "#FFFFFF"]
- Fonts: ["Futura Bold", "Helvetica Neue"]
```

**2. Target Audiences (Text)**
```
- Primary: "Athletes ages 18-35"
- Secondary: "Fitness enthusiasts"
- Psychographics: "Achievement-oriented, health-conscious, competitive"
```

**3. Funnel Stages (Text)**
```
Awareness:
  - Hook: "Show athletic achievement"
  - Example: "Runner crossing finish line"

Consideration:
  - Hook: "Show product benefits"
  - Example: "Close-up of shoe technology"

Conversion:
  - Hook: "Show social proof"
  - Example: "Athletes using Nike in competition"
```

**4. Visual References (URLs or Descriptions)**
```
- Past successful ads: ["url1", "url2", "url3"]
- Brand aesthetics: "High-energy, motion-focused, urban settings"
- What to avoid: "Static shots, corporate language, staged poses"
```

**5. Product Categories**
```
- Running shoes
- Athletic apparel
- Training equipment
```

### How Qdrant Uses This Data:

**Step 1: Vectorization**
- All text gets converted to numbers (vectors)
- Similar concepts cluster together
- Example: "motivational" and "empowering" are close in vector space

**Step 2: When You Pick Nike**
Dashboard sends query: "Create ad for Nike running shoes, Gen Z audience, awareness stage"

**Step 3: Qdrant Returns**
```
Top 5 most relevant brand facts:
1. "Nike targets athletes 18-35 with empowering tone" (95% match)
2. "Awareness stage: show athletic achievement" (92% match)
3. "Visual style: high-energy, motion-focused" (88% match)
4. "Colors: Orange (#FF6B00) and Black" (85% match)
5. "Avoid: static shots, staged poses" (82% match)
```

**Step 4: AI Pipeline Uses This**
- Perplexity: "Find trending running shoe content for Gen Z"
- Claude: "Humanize with Nike's empowering tone, avoid staged poses"
- Gemini: "Optimize for Sora 2 with high-energy motion, orange/black colors"

---

## Phase 3: AI Pipeline Explained 🤖

**What Happens When You Submit Dashboard:**

### Input (From Dashboard):
```
Brand: Nike
Product: Running Shoes
Audience: Gen Z
Funnel: Awareness
Platform: TikTok
```

### AI Pipeline Flow:

**1. Qdrant Lookup** (0.5 seconds)
```
Query: "Nike + Running Shoes + Gen Z + Awareness + TikTok"
Returns: Brand context (colors, tone, dos/don'ts)
```

**2. Perplexity Research** (3-5 seconds)
```
Input: "What's trending for running shoe ads on TikTok for Gen Z?"
Output: "Parkour athletes, urban settings, slow-mo shots trending"
API: llama-3.1-sonar-large-128k-online
```

**3. Claude Humanization** (2-3 seconds)
```
Input:
  - Brand context from Qdrant
  - Trending topics from Perplexity
  - Dashboard selections

Process: "Align trends with Nike brand voice and Gen Z preferences"

Output: "Urban parkour athlete in slow-motion, empowering achievement moment,
         avoiding staged corporate feel, incorporating Nike's orange brand color"

API: claude-sonnet-4-5
```

**4. Gemini Sora Optimization** (2-3 seconds)
```
Input: Claude's humanized concept

Process: Format for Sora 2's requirements:
  - 10-second timing (Sora 2 accepts 5, 10, or 20 seconds)
  - Scene breakdowns (0-2.5s, 2.5-5s, 5-7.5s, 7.5-10s)
  - Camera movements
  - Lighting/color grading

Output: Final Sora 2 prompt (formatted perfectly)

API: gemini-2.5-flash
```

**Final Prompt Example:**
```
[Style Definition]
Cinematic, high-energy athletic achievement, Nike brand aesthetic

[Scene Description]
Urban rooftop at sunset, golden hour lighting with orange Nike brand accent

[Subject/Action - 10 seconds]
0-2.5s: Parkour athlete approaches ledge, slow-motion wind-up
2.5-5s: Explosive jump, Nike shoes prominent, orange laces catch light
5-7.5s: Mid-air rotation, city skyline background, athlete's focused expression
7.5-10s: Perfect landing, exhale of achievement, Nike logo subtle on shirt

[Camera Work]
Low angle emphasizing power, slow push-in during jump, stabilized for TikTok

[Lighting/Color]
Golden hour natural light, orange brand color in sunset glow, high contrast

[Brand Elements]
Nike orange accent (#FF6B00), empowering athletic moment, Gen Z authentic feel
```

### Total Time: ~10 seconds for one prompt

---

## Phase 4: Matrix Logic Explained 📈

**What:** Shows all possible combinations
**Why:** You pick the best ones to test

### How Matrix is Calculated:

**Your Dashboard Inputs:**
```
Brand: Nike
Products: [Running Shoes, Training Shoes] (2)
Audiences: [Gen Z, Millennials] (2)
Funnels: [Awareness, Consideration] (2)
Platforms: [TikTok, Instagram] (2)
Themes: [Achievement, Innovation] (2)
```

**Math:**
```
Total Combinations = 2 × 2 × 2 × 2 × 2 = 32 videos
```

**Matrix Table Shows:**
```
Row 1: Nike + Running Shoes + Gen Z + Awareness + TikTok + Achievement
Row 2: Nike + Running Shoes + Gen Z + Awareness + TikTok + Innovation
Row 3: Nike + Running Shoes + Gen Z + Awareness + Instagram + Achievement
...
Row 32: Nike + Training Shoes + Millennials + Consideration + Instagram + Innovation
```

### AI Recommendations (Not Built Yet):

**Future Enhancement:**
Each row gets scored by AI:
```
Row 1:
  Combination: "Nike Running Shoes, Gen Z, Awareness, TikTok, Achievement"
  Score: 92/100
  Reason: "High alignment - Gen Z loves achievement content on TikTok"
  Trending: YES (Perplexity found similar ads trending)

Row 15:
  Combination: "Nike Training Shoes, Millennials, Awareness, Instagram, Innovation"
  Score: 67/100
  Reason: "Moderate alignment - innovation less common in awareness stage"
  Trending: NO
```

**For Now:**
- Matrix shows all combinations
- You manually pick which ones to test
- No AI scoring yet (we can add this later)

---

## Phase 5: Notion Integration 📝

**What:** Save prompts to Notion for testing

### Notion Database Structure:

**Database Name:** "SACOS-SORA Prompt Sandbox"

**Properties:**
```
1. Name (Title): Auto-generated from combination
   Example: "Nike-RunningShoes-GenZ-Awareness-TikTok-Achievement"

2. Brand (Select): "Nike"

3. Product (Select): "Running Shoes"

4. Audience (Select): "Gen Z"

5. Funnel Stage (Select): "Awareness"

6. Platform (Select): "TikTok"

7. Theme (Select): "Achievement"

8. Prompt (Text): The full Sora 2 prompt

9. Status (Select): "Draft" | "Testing" | "Approved" | "Rejected"

10. Video URL (URL): Where you paste the Sora 2 output

11. Created Date (Date): Auto

12. Workflow Log (Text): What AI pipeline did
```

**Page Body:**
```markdown
# Sora 2 Prompt

[Full formatted prompt here]

---

# Matrix Selections
- Brand: Nike
- Product: Running Shoes
- Audience: Gen Z
- Funnel: Awareness
- Platform: TikTok
- Theme: Achievement

---

# AI Pipeline Log

1. Qdrant Context Retrieved (0.5s)
   - Brand tone: "Empowering, motivational"
   - Colors: Orange, Black
   - Avoid: Static shots

2. Perplexity Research (3.2s)
   - Trending: Parkour athletes, urban settings
   - Platform: TikTok Gen Z engagement high

3. Claude Humanization (2.8s)
   - Applied Nike brand voice
   - Aligned with Gen Z authenticity preference

4. Gemini Optimization (2.1s)
   - Formatted for 10-second Sora 2 video
   - Optimized camera movements for TikTok

Total Processing: 8.6 seconds

---

# Test Results
[Paste Sora 2 video URL here after testing]

Notes:
[Your feedback on the output]
```

### Workflow:

1. Fill out dashboard
2. Click "Preview Matrix"
3. Select combinations you want
4. Click "Send to Notion Sandbox"
5. Notion pages created instantly (one per selected combination)
6. Go to Notion, review prompts
7. Copy prompt from Notion page
8. Paste into Sora 2
9. Save video URL back to Notion page
10. Add notes about whether it worked

---

## Implementation Order

**Week 1: Foundation**
- [x] Phase 1: Vercel deployment (coffee shop access)
- [ ] Phase 2: Add Nike data to Qdrant
- [ ] Phase 3: Test AI pipeline with one example

**Week 2: Testing**
- [ ] Phase 4: Build matrix with "Copy Prompt" button
- [ ] Test 5-10 prompts manually
- [ ] Refine AI pipeline based on results

**Week 3: Notion**
- [ ] Phase 5: Connect Notion database
- [ ] Add "Send to Notion" button
- [ ] Test full workflow end-to-end

---

## Success Metrics

**Phase 1:** Can login from coffee shop ✅
**Phase 2:** Qdrant returns relevant brand context ✅
**Phase 3:** AI pipeline produces usable Sora 2 prompt ✅
**Phase 4:** Matrix shows 10+ combinations, can copy prompts ✅
**Phase 5:** Prompts save to Notion for review ✅

**Final Goal:** Create 10 test videos, 7+ are "on brand" and effective
