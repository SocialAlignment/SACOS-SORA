# Brand Onboarding Guide
## Loading Client Brands into QDRANT

This guide explains how to onboard new client brands into the QDRANT vector database for AI-powered video generation.

---

## Quick Start

**1. Copy the template for each brand:**
```bash
cp brand-intake-template.yaml brand-intake-{brand-name}.yaml
```

**2. Fill out the brand information** (see template fields below)

**3. Load into QDRANT:**
```bash
npx tsx src/lib/load-brand-intake.ts brand-intake-{brand-name}.yaml
```

**4. Verify it loaded:**
```bash
curl http://192.168.0.78:6333/collections/brand__canon_v1 | grep points_count
```

---

## Template Fields Explained

### Required Fields

#### `brand_id` (string)
- **Format:** lowercase-with-dashes
- **Examples:** `earth-breeze`, `rocket-benefits`, `puur-water-flosser`
- **Must be unique** across all brands

#### `brand_name` (string)
- Official brand name as it should appear in the system
- **Examples:** `"Earth Breeze Laundry Detergent Sheets"`, `"Rocket Benefits"`

#### `voice` (multiline string)
How the brand communicates. Consider:
- Personality traits (professional, playful, authoritative, caring)
- Tone (formal, casual, inspirational, educational)
- Communication style (direct, storytelling, data-driven)

**Example:**
```yaml
voice: |
  Eco-conscious, friendly, educational, empowering.
  Speaks to environmentally aware consumers who want sustainable choices.
  Optimistic about environmental impact while being practical.
```

#### `visual_style` (multiline string)
How the brand looks in video content:
- Color palette (specific hex codes if available)
- Aesthetic style (modern, vintage, minimalist, maximalist)
- Preferred video styles (cinematic, documentary, lifestyle)
- Lighting preferences (natural, dramatic, studio)
- Camera movement (static, smooth dolly, dynamic)

**Example:**
```yaml
visual_style: |
  Clean modern aesthetic with earth tones (greens, blues, whites).
  Product-focused with simplicity emphasis.
  Natural lighting, uncluttered minimalist scenes.
  Blue and green palette with white product packaging.
```

#### `icp_profile` (multiline string)
Ideal Customer Profile - who the brand serves:
- Demographics (age, gender, location, income)
- Psychographics (values, interests, lifestyle)
- Pain points (what problems do they face?)
- Goals (what are they trying to achieve?)

**Example:**
```yaml
icp_profile: |
  Environmentally conscious consumers, primarily women ages 28-45.
  Suburban families who prioritize sustainability.
  Pain points: plastic waste, heavy detergent bottles, storage space.
  Goals: reduce environmental footprint, simplify laundry routine.
```

#### `successful_prompts` (array of strings)
Past Sora prompts that worked well, OR ideal video concepts:
- Structure: [Style] [Scene] [Action] [Camera] [Brand elements]
- Can be detailed Sora prompts or high-level concepts
- Include 2-5 examples

**Example:**
```yaml
successful_prompts:
  - |
    [Style: Clean modern, natural lighting]
    [Scene: Eco-friendly product packaging reveal]
    [Action: 0-3s product emerge, 3-6s feature showcase, 9-12s brand reveal]

  - |
    Lifestyle scene showing product in use, emphasizing convenience
    and sustainability in natural home setting.
```

#### `prohibited_content` (array of strings)
What should NEVER appear in videos:
- OpenAI restrictions (always include)
- Brand-specific restrictions
- Competitor mentions
- Sensitive topics
- Visual constraints

**Default restrictions to include:**
```yaml
prohibited_content:
  - "No copyrighted content or competitor brand logos"
  - "No real people or recognizable individuals"
  - "No explicit text or on-screen graphics"
  - "No captions or subtitles in video"
  - "Max 45 spoken words if voiceover included"
  - "Max 65 syllables total"
  # Add brand-specific below:
```

---

## Optional Fields (Highly Recommended)

### `brand_values` (string)
Core mission, values, differentiators

### `key_features` (string)
Main product/service features or benefits

### `signature_phrases` (array)
Taglines, catchphrases, signature messaging

### `platform_notes` (object)
Platform-specific guidance for TikTok, Instagram, LinkedIn

### `content_themes` (array)
Main content topics/pillars

---

## Workflow for Your 7 Brands

For each brand, you'll want to gather:

### 1. **Earth Breeze Laundry Detergent Sheets**
- Eco-friendly messaging
- Product vs traditional detergent comparison
- Sustainability focus

### 2. **Rocket Benefits**
- B2B/HR tech positioning
- Professional/corporate tone
- Benefits administration focus

### 3. **Puur (Water Flosser)**
- Health/wellness positioning
- Product demonstration style
- Clean, clinical aesthetic

### 4. **Fun Earth Co (Mushroom Coffee)**
- Natural/organic positioning
- Energy/focus benefits
- Lifestyle/wellness aesthetic

### 5. **WeMentality**
- Mental health/wellness
- Supportive, caring tone
- Community-focused

### 6. **The Lemonade Stand Business Plan**
- Entrepreneurship/business education
- Practical, educational tone
- Small business focus

### 7. **Gym Academy**
- Fitness/training focus
- Motivational, energetic tone
- Athletic aesthetic

---

## Suggested Approach

**Option 1: Interview Format**
Record a 10-15 minute conversation for each brand covering:
1. How would you describe the brand's personality?
2. What does the brand look like visually?
3. Who is the target customer?
4. What videos have worked well in the past?
5. What should never appear in brand videos?

Then transcribe and fill out the YAML template.

**Option 2: Existing Documents**
If you have:
- Brand guidelines
- Marketing decks
- Past creative briefs
- Campaign examples

Share those, and I can help extract the necessary information.

**Option 3: Structured Questionnaire**
I can create a Google Form or Notion template that asks all the right questions in a user-friendly format, then we process the responses into YAML.

---

## Loading Brands

### Single Brand
```bash
npx tsx src/lib/load-brand-intake.ts brand-intake-earth-breeze.yaml
```

### Multiple Brands
Place all YAML files in a folder:
```bash
npx tsx src/lib/load-brand-intake.ts ./brand-intakes/
```

### Overwrite Existing
```bash
npx tsx src/lib/load-brand-intake.ts brand-intake-earth-breeze.yaml --overwrite
```

---

## Verification

After loading, verify brands are in QDRANT:

**Check count:**
```bash
curl http://192.168.0.78:6333/collections/brand__canon_v1 | grep points_count
```

**Test retrieval:**
```bash
npx tsx -e "
import { getAllBrands } from './src/lib/qdrant-client';
getAllBrands().then(brands => console.log(brands.map(b => b.brand_name)));
"
```

---

## Next Steps

Once brands are loaded:
1. **Story 1.3** will use `getAllBrands()` to populate brand dropdown
2. **Story 2.2** will use `queryBrandCanon(brand_id)` for prompt generation
3. Brand-specific prompts will follow voice, visual style, and restrictions automatically

---

## Need Help?

- Template issues: Check `brand-intake-earth-breeze.yaml` for example
- Loading errors: Ensure all required fields are filled out
- QDRANT issues: Verify connection to 192.168.0.78:6333
