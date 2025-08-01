Excellent question. You are right to ask this, as we have two different AIs doing two different jobs.

Think of it this way:
* The **LLM (CareBot)** is for the **Patient**.
* **Qloo** is for the **Donor**.

Qloo comes into the picture specifically for the **Donor Perks & Engagement Program**. Its job is to make the "thank you" you give to a donor feel personal and meaningful.

Here is the exact flow of where Qloo fits in:

### The Donor Perks Program Flow

This entire process happens automatically on the **backend** after a donor successfully makes a donation.

**Step 1: The Trigger**
* A donor, Anjali, donates blood.
* Your application creates a new record in the `donations` table in your database.

**Step 2: Get Donor's Interests**
* Your backend server detects this new donation. It gets Anjali's `donor_id`.
* It then queries your `donors` table to get her interests from the `qloo_taste_keywords` column. Let's say it finds `['movies', 'food']`.

**Step 3: Call the Qloo API (This is the key step)**
* Your backend server now takes those simple keywords and sends them to the **Qloo API**.
* Qloo's "Taste AI" analyzes these keywords and returns a much richer, more detailed profile. It might predict that people who like "movies" and "food" also have an interest in "Italian restaurants," "bakeries," and "independent cinema."

**Step 4: Find the Perfect Reward**
* Your backend takes these new, enriched keywords from Qloo (e.g., "Italian restaurants").
* It then queries your `coupons` table to find a partner offer where the `target_keywords` match. It finds a coupon for "20% off at a local Italian restaurant."

**Step 5: Issue the Reward**
* Your backend creates a new record in the `donorcoupons` table, linking Anjali to this specific coupon.
* Finally, it sends a push notification to Anjali's phone: *"Thank you, Anjali! To show our appreciation, here's a 20% off coupon for [Restaurant Name] we think you'll love."*

### Summary

So, to put it simply:

* **You use the LLM** when a patient is actively chatting in the app to give them an empathetic, personalized conversation.
* **You use Qloo** passively in the background after a donor has completed the act of donation, to find the perfect, personalized way to say thank you.