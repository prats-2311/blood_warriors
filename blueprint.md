# **Project Blueprint: Blood Warriors AI Platform**

Version: 1.0 (Final)  
Date: July 28, 2025  
Context: AI for Good Hackathon 2025

## **1\. Vision & Mission**

To build a foundational piece of public health technology that eliminates blood shortages for Thalassemia patients in India. We will achieve this through a smart, compassionate network that combines real-time logistics with AI-driven user engagement and support.

## **2\. Core Architectural Principles**

* **API-First:** The platform is built around a robust REST API, enabling seamless integration with our own mobile app and external partners.  
* **PWA-Centric:** The primary user experience is designed for patients and donors on their mobile devices , laptops, and tablets, leveraging native capabilities like location services and push notifications.  
* **AI-Driven:** We utilize two distinct forms of AI: a custom-trained LLM for medical support and a "Cultural AI" (Qloo) for personalized user engagement.  
* **Secure & Private:** All user data is handled with the utmost care, using encryption, explicit consent for data collection, and role-based access control.

## **3\. Feature List & Technical Specifications**

### **Feature 1: Dynamic SOS Network**

* **User Story (Patient):** "As a patient's parent in an emergency, I want to press one button to instantly alert all nearby, eligible donors who can help save my child's life."  
* **User Story (Donor):** "As a donor, I want to be notified of emergencies near me, even when I'm traveling, so I can help wherever I am."  
* **Design & UI/UX:**  
  * **Patient App:** A large, prominent "Request Blood (SOS)" button on the home screen. A simple form follows, pre-filled with the patient's blood type.  
  * **Donor App:** A clear, actionable push notification is received. The app displays a map showing the hospital location and estimated travel time. Buttons for "Accept" or "Decline" are presented.  
* **Technical Specifications:**  
  * **Technology:** Native mobile location services (GPS), background location updates (significant change API), Push Notifications (FCM/APNS).  
  * **Database:** Donors table (with frequently updated latitude, longitude), DonationRequests, Notifications.  
  * **API Endpoints:**  
    * PUT /donors/me/location: App updates donor's current location.  
    * POST /requests: Patient initiates the SOS request.  
    * POST /requests/{id}/respond: Donor accepts or declines the alert.

### **Feature 2: Thalassemia CareBot**

* **User Story (Patient):** "As a patient's caregiver, I want to get quick, reliable answers to non-urgent medical questions at any time of day, without having to call the doctor."  
* **Design & UI/UX:**  
  * A familiar chat interface within the app, accessible via a "CareBot" tab.  
  * The interface will include a disclaimer: "I am an AI assistant, not a doctor. For urgent medical issues, please contact your healthcare provider."  
* **Technical Specifications:**  
  * **Technology:** A fine-tuned Large Language Model (e.g., Llama 3, Mistral 7B) using the QLoRA technique. The model will be trained on a custom dataset of Thalassemia-specific medical information, dietary advice for the Indian context, and empathetic communication patterns. It will be hosted on a service like Hugging Face Spaces or a cloud GPU instance.  
  * **Database:** A new ChatHistory table could be used to store conversations for quality improvement (with user consent).  
  * **API Endpoints:** A new internal endpoint, e.g., POST /ai/carebot/query, will securely route the user's question to the hosted LLM and return the response.

### **Feature 3: Donor Perks & Engagement Program**

* **User Story (Donor):** "As a donor, I want to feel appreciated for my contribution, and receiving personalized rewards that match my interests would make me feel truly valued and encourage me to donate more often."  
* **Design & UI/UX:**  
  * **Onboarding:** An optional, friendly screen asking for user interests (e.g., "Movies," "Cafes," "Sports").  
  * **Profile:** A "My Impact" section showing donation stats, badges earned (e.g., "5-Time Hero," "Platelet Champion"), and a "Perks" wallet to view and redeem unlocked coupons.  
  * **Notifications:** Engaging push notifications announcing new perks.  
* **Technical Specifications:**  
  * **Technology:** Qloo API for taste prediction.  
  * **Database:** Donors table (with a qloo\_taste\_keywords JSON field), and new Coupons and DonorCoupons tables to manage partner offers and track issuance.  
  * **API Endpoints:** Internal logic will call the Qloo API after a successful donation logged via the Donations table. No new public API endpoint is needed, but the backend logic will be significantly enhanced.

### **Feature 4: Partner Integration Gateway**

* **User Story (Hospital Admin):** "As a hospital blood bank manager, I want to connect our internal system to the Blood Warriors AI platform, so when we have a critical shortage, we can trigger an SOS alert to their volunteer network with a single click."  
* **Design & UI/UX:** This is a backend feature with no direct user interface. The "UI" is the API documentation provided to trusted partners.  
* **Technical Specifications:**  
  * **Technology:** A secure, API-key-based authentication system for server-to-server communication.  
  * **Database:** The API will interact with the DonationRequests and Donors tables.  
  * **API Endpoints:**  
    * POST /partner/requests/sos: The key endpoint for partners to trigger alerts.  
    * POST /partner/donors/register: For NGOs to add their volunteers to our network.

### **Feature 5: Public Data Hub**

* **User Story (Developer/Analyst):** "As a health-tech developer, I want a reliable, clean API to get the latest blood stock information from e-RaktKosh without having to build my own data scraping and cleaning pipeline."  
* **Design & UI/UX:** A simple "Developers" page on the project's website with API documentation.  
* **Technical Specifications:**  
  * **Technology:** A background service (e.g., a Cron job) on our server that periodically scrapes public data from the e-RaktKosh website and populates our database.  
  * **Database:** The BloodBanks and BloodStock tables are the primary sources for this feature.  
  * **API Endpoints:**  
    * GET /public-data/banks  
    * GET /public-data/stock

## **4\. Final Database Schema Summary**

* **User Tables:** Users, Patients, Donors  
* **Blood Data Tables:** BloodGroups, BloodComponents, BloodBanks, BloodStock  
* **Activity Tables:** DonationRequests, Donations, Notifications  
* **Perks Program Tables:** Coupons, DonorCoupons

This comprehensive structure supports every feature outlined above, providing a solid foundation for the entire platform.