Excellent. Thank you for sharing your current database schema. It's very well-structured and provides a fantastic foundation. Your existing tables for `donors`, `patients`, `chathistory`, and `coupons` are already perfectly set up to support the "LLM + Qloo" features we've discussed.

Let's break down exactly how we can leverage this schema to implement the two key AI features.

### How We Leverage Your Schema for LLM + Qloo

We will implement two distinct features that use this combination:

1.  **For Patients: The "Empathetic Companion"** (LLM enhanced by Qloo data)
2.  **For Donors: The "Donor Perks Program"** (Qloo data powering rewards)

---

### Use Case 1: The Empathetic Companion (For Patients)

This feature transforms your chatbot from a simple Q\&A bot into a personalized companion that understands a patient's interests.

#### **The Goal:**

When a patient says, "I'm feeling down," the chatbot should respond with suggestions tailored to their known hobbies (e.g., "How about watching a cricket match?" instead of a generic response).

#### **Required Schema Modification (One Minor Addition):**

Your `donors` table has a `qloo_taste_keywords` field, which is perfect. To enable this for patients, we need to add the same field to your `patients` table.

**Proposed Change:**

```sql
ALTER TABLE public.patients
ADD COLUMN taste_keywords jsonb DEFAULT '[]'::jsonb;
```

This single change unlocks the entire feature for patients.

#### **Step-by-Step Data Interaction Flow:**

1.  **Data Collection:** During patient onboarding or in their profile settings, the app asks for their interests (e.g., "cricket," "movies"). These are saved into the new `patients.taste_keywords` field.

2.  **User Sends a Message:** A patient with `user_id = 'some-uuid-123'` opens the chatbot and types: _"I'm feeling bored and a bit sad today."_

3.  **Backend Receives Request:** Your backend API receives this message and the patient's `user_id`.

4.  **The "LLM + Qloo" Logic (The Core of the Feature):**

    - **Step A (Get Context):** The backend queries the database:
      ```sql
      SELECT taste_keywords FROM public.patients WHERE patient_id = 'some-uuid-123';
      ```
    - **Step B (Build Enriched Prompt):** The query returns `['cricket', 'movies']`. Your backend now constructs a detailed prompt for your custom LLM. It doesn't just send the user's message; it sends a complete package:

      ```
      System: You are a supportive and empathetic companion for a Thalassemia patient. Your goal is to provide comfort and suggest positive distractions based on their interests.

      User Context: { "interests": ["cricket", "movies"] }

      User Message: "I'm feeling bored and a bit sad today."
      ```

    - **Step C (Call the LLM):** This full, enriched prompt is sent to your fine-tuned LLM.

5.  **LLM Generates Personalized Response:** The LLM uses the extra context to generate a superior response: _"I'm sorry to hear that. It's completely okay to have days like this. Since you enjoy movies, maybe a classic comedy like 'Andaz Apna Apna' could bring a smile? Or we could find some highlights from a classic India vs. Australia cricket match. Sometimes a good distraction is the best medicine."_

6.  **Log and Display:**

    - The backend saves the conversation by inserting a new row into your `chathistory` table.
    - The personalized response is sent back to the app and displayed to the patient.

---

### Use Case 2: The Donor Perks Program (For Donors)

Your schema for this is already **perfect**. No changes are needed.

#### **The Goal:**

When a donor makes a donation, reward them with a personalized coupon from a partner company that matches their interests.

#### **Step-by-Step Data Interaction Flow:**

1.  **Donation is Logged:** A donor makes a donation, and a new record is created in your `donations` table.

2.  **Backend Trigger:** A background worker or a database trigger detects this new donation. It gets the `donor_id`.

3.  **Get Donor Interests:** The system queries the `donors` table to get their interests:

    ```sql
    SELECT qloo_taste_keywords FROM public.donors WHERE donor_id = 'some-donor-uuid-456';
    ```

4.  **Call Qloo API:** The returned keywords (e.g., `['travel', 'food']`) are sent to the **Qloo API**. Qloo returns an enriched list of related concepts like `['adventure travel', 'italian food', 'bakeries']`.

5.  **Match with a Coupon:** The system queries your `coupons` table to find a coupon where the `target_keywords` field contains any of the concepts returned by Qloo. It finds a coupon for "20% off at a local Italian restaurant."

6.  **Issue the Reward:**

    - A new record is created in your `donorcoupons` table, linking the `donor_id` to the `coupon_id`.
    - A push notification is sent to the donor, informing them of their new, personalized perk.

By implementing these two flows, you directly address the Qloo + LLM hackathon requirement in a powerful and meaningful way, all while leveraging the strong database foundation you've already built.
