# **Technical Documentation: Blood Warriors AI Platform**

Version: 1.0  
Date: July 28, 2025  
Status: Final

## **1\. Introduction**

This document provides a complete technical specification for the Blood Warriors AI Platform. It is intended for the development team and outlines the system architecture, database schema, REST API, and detailed data flows required to build the platform.

## **2\. System Architecture Overview**

The platform follows a microservices-inspired, API-first architecture composed of four primary components:

* **PWA App Client:** PWA app serving as the primary interface for Patients and Donors.  
* **Backend Server:** A cloud-hosted application server that contains all business logic, manages database interactions, and runs the core AI algorithms.  
* **Relational Database:** A secure and scalable SQL database (e.g., PostgreSQL) that serves as the single source of truth for all platform data.  
* **External Services:** Third-party APIs that provide specialized functionality, including Qloo for cultural AI and Push Notification services (FCM/APNS).

## **3\. Database Specification**

### **3.1. Entity-Relationship Diagram (ERD)**

* A User can be one Patient OR one Donor. This is a one-to-one relationship.  
* A Patient can have many DonationRequests. (One-to-Many)  
* A Donor can receive many Notifications and can make many Donations. (One-to-Many)  
* A DonationRequest can trigger many Notifications. (One-to-Many)  
* A Donation is linked to one Donor and optionally one DonationRequest.  
* BloodStock links one BloodBank, one BloodGroup, and one BloodComponent.

### **3.2. Detailed Database Schema (SQL DDL)**

\-- \========= USER & PROFILE TABLES \=========

CREATE TABLE Users (  
    user\_id INT PRIMARY KEY AUTO\_INCREMENT,  
    email VARCHAR(255) NOT NULL UNIQUE,  
    phone\_number VARCHAR(15) NOT NULL UNIQUE,  
    password\_hash VARCHAR(255) NOT NULL,  
    full\_name VARCHAR(100) NOT NULL,  
    city VARCHAR(100),  
    state VARCHAR(100),  
    user\_type ENUM('Patient', 'Donor', 'Admin') NOT NULL,  
    created\_at DATETIME DEFAULT CURRENT\_TIMESTAMP  
);

CREATE TABLE Patients (  
    patient\_id INT PRIMARY KEY,                 \-- FK to Users.user\_id  
    blood\_group\_id INT NOT NULL,                \-- FK to BloodGroups.blood\_group\_id  
    date\_of\_birth DATE NOT NULL,  
    FOREIGN KEY (patient\_id) REFERENCES Users(user\_id),  
    FOREIGN KEY (blood\_group\_id) REFERENCES BloodGroups(blood\_group\_id)  
);

CREATE TABLE Donors (  
    donor\_id INT PRIMARY KEY,                   \-- FK to Users.user\_id  
    blood\_group\_id INT NOT NULL,                \-- FK to BloodGroups.blood\_group\_id  
    last\_donation\_date DATE,                    \-- Updated after every donation  
    is\_available\_for\_sos BOOLEAN DEFAULT true,  \-- Donor can toggle this  
    latitude DECIMAL(9,6),                      \-- Live location (updated frequently)  
    longitude DECIMAL(10,6),                     \-- Live location (updated frequently)  
    qloo\_taste\_keywords JSON,                   \-- Stores user interests, e.g., '\["movies", "cafes"\]'  
    FOREIGN KEY (donor\_id) REFERENCES Users(user\_id),  
    FOREIGN KEY (blood\_group\_id) REFERENCES BloodGroups(blood\_group\_id)  
);

\-- \========= BLOOD DATA & INVENTORY TABLES \=========

CREATE TABLE BloodGroups (  
    blood\_group\_id INT PRIMARY KEY AUTO\_INCREMENT,  
    group\_name VARCHAR(3) NOT NULL UNIQUE \-- e.g., 'A+', 'O-', 'AB+'  
);

CREATE TABLE BloodComponents (  
    component\_id INT PRIMARY KEY AUTO\_INCREMENT,  
    component\_name VARCHAR(100) NOT NULL UNIQUE \-- e.g., 'Whole Blood', 'Packed Red Blood Cells'  
);

CREATE TABLE BloodBanks (  
    bank\_id INT PRIMARY KEY AUTO\_INCREMENT,  
    name VARCHAR(255) NOT NULL,  
    address TEXT,  
    city VARCHAR(100),  
    state VARCHAR(100),  
    category ENUM('Govt', 'Private', 'Charitable/Vol') NOT NULL,  
    phone VARCHAR(100),  
    email VARCHAR(255),  
    latitude DECIMAL(9,6),  
    longitude DECIMAL(10,6)  
);

CREATE TABLE BloodStock (  
    stock\_id INT PRIMARY KEY AUTO\_INCREMENT,  
    bank\_id INT NOT NULL,  
    blood\_group\_id INT NOT NULL,  
    component\_id INT NOT NULL,  
    units\_available INT NOT NULL DEFAULT 0,  
    last\_updated DATETIME NOT NULL,  
    FOREIGN KEY (bank\_id) REFERENCES BloodBanks(bank\_id),  
    FOREIGN KEY (blood\_group\_id) REFERENCES BloodGroups(blood\_group\_id),  
    FOREIGN KEY (component\_id) REFERENCES BloodComponents(component\_id),  
    UNIQUE (bank\_id, blood\_group\_id, component\_id)  
);

\-- \========= ACTIVITY & TRANSACTION TABLES \=========

CREATE TABLE DonationRequests (  
    request\_id INT PRIMARY KEY AUTO\_INCREMENT,  
    patient\_id INT NOT NULL,  
    blood\_group\_id INT NOT NULL,  
    component\_id INT NOT NULL,  
    units\_required INT NOT NULL,  
    urgency ENUM('SOS', 'Urgent', 'Scheduled') NOT NULL,  
    status ENUM('Open', 'In Progress', 'Fulfilled', 'Cancelled') NOT NULL DEFAULT 'Open',  
    request\_datetime DATETIME DEFAULT CURRENT\_TIMESTAMP,  
    FOREIGN KEY (patient\_id) REFERENCES Patients(patient\_id),  
    FOREIGN KEY (blood\_group\_id) REFERENCES BloodGroups(blood\_group\_id),  
    FOREIGN KEY (component\_id) REFERENCES BloodComponents(component\_id)  
);

CREATE TABLE Donations (  
    donation\_id INT PRIMARY KEY AUTO\_INCREMENT,  
    donor\_id INT NOT NULL,  
    bank\_id INT,                                \-- Where the donation was made  
    request\_id INT,                             \-- Can be NULL for general donations  
    donation\_date DATE NOT NULL,  
    units\_donated INT NOT NULL DEFAULT 1,  
    FOREIGN KEY (donor\_id) REFERENCES Donors(donor\_id),  
    FOREIGN KEY (bank\_id) REFERENCES BloodBanks(bank\_id),  
    FOREIGN KEY (request\_id) REFERENCES DonationRequests(request\_id)  
);

CREATE TABLE Notifications (  
    notification\_id INT PRIMARY KEY AUTO\_INCREMENT,  
    donor\_id INT NOT NULL,  
    request\_id INT NOT NULL,  
    message TEXT NOT NULL,  
    status ENUM('Sent', 'Read', 'Accepted', 'Declined') NOT NULL DEFAULT 'Sent',  
    sent\_at DATETIME DEFAULT CURRENT\_TIMESTAMP,  
    FOREIGN KEY (donor\_id) REFERENCES Donors(donor\_id),  
    FOREIGN KEY (request\_id) REFERENCES DonationRequests(request\_id)  
);

\-- \========= PERKS PROGRAM TABLES \=========

CREATE TABLE Coupons (  
    coupon\_id INT PRIMARY KEY AUTO\_INCREMENT,  
    partner\_name VARCHAR(255) NOT NULL,  
    coupon\_title VARCHAR(255) NOT NULL,  
    target\_keywords JSON NOT NULL,              \-- For AI matching, e.g., '\["cafe", "coffee"\]'  
    quantity\_total INT,  
    quantity\_redeemed INT DEFAULT 0,  
    expiry\_date DATE  
);

CREATE TABLE DonorCoupons (  
    id INT PRIMARY KEY AUTO\_INCREMENT,  
    donor\_id INT NOT NULL,  
    coupon\_id INT NOT NULL,  
    status ENUM('Issued', 'Redeemed', 'Expired') NOT NULL DEFAULT 'Issued',  
    issued\_at DATETIME DEFAULT CURRENT\_TIMESTAMP,  
    unique\_redemption\_code VARCHAR(20) NOT NULL UNIQUE,  
    FOREIGN KEY (donor\_id) REFERENCES Donors(donor\_id),  
    FOREIGN KEY (coupon\_id) REFERENCES Coupons(coupon\_id)  
);

\-- \========= AI & LOGGING TABLES \=========

CREATE TABLE ChatHistory (  
    chat\_id INT PRIMARY KEY AUTO\_INCREMENT,  
    user\_id INT NOT NULL,  
    prompt TEXT NOT NULL,  
    response TEXT NOT NULL,  
    timestamp DATETIME DEFAULT CURRENT\_TIMESTAMP,  
    FOREIGN KEY (user\_id) REFERENCES Users(user\_id)  
);

## **4\. REST API Specification**

* **Base URL:** https://api.bloodwarriors.ai/v1  
* **Authentication:**  
  * **JWT:** Authorization: Bearer \<TOKEN\> (For mobile clients)  
  * **API Key:** X-API-Key: \<KEY\> (For server-to-server partners)  
* **Standard Success Response:** 200 OK, 201 Created  
* **Standard Error Responses:**  
  * 400 Bad Request: Invalid request body.  
  * 401 Unauthorized: Missing or invalid authentication token.  
  * 403 Forbidden: Authenticated user does not have permission.  
  * 404 Not Found: Resource not found.  
  * 422 Unprocessable Entity: Validation error (e.g., email already exists).

*(The full list of API endpoints as previously documented would be listed here, section by section: /auth, /donors, /requests, /public-data, /partner)*

## **5\. Core Features & Data Interaction Flows**

### **5.1. Feature: Dynamic SOS Network**

1. **Trigger (Patient App):** User presses "SOS" button. App sends POST /requests with patient's JWT and request details.  
2. **Backend \- Validation:** Server validates JWT, confirms user is a Patient, and validates request body.  
3. **Backend \- DB Write:** A new record is inserted into DonationRequests with status \= 'Open'.  
4. Backend \- SOS Algorithm:  
   a. The algorithm is triggered by the new request.  
   b. It queries the Donors table:  
   \* WHERE blood\_group\_id matches the request.  
   \* WHERE is\_available\_for\_sos \= true.  
   \* WHERE last\_donation\_date is more than 3 months ago.  
   \* WHERE a geospatial function calculates the distance between the donor's latitude/longitude and the request's location is \< 15km.  
5. Backend \- Notification Dispatch:  
   a. For each donor returned by the query, a new record is inserted into the Notifications table.  
   b. The backend calls the Push Notification Service (FCM/APNS) for each donor ID.  
6. **Response (Donor App):** Donor receives a push notification. On tap, the app makes a GET /requests/{id} call to show details.  
7. **Closure:** Donor taps "Accept". App sends POST /requests/{id}/respond. The backend updates the relevant record in the Notifications table.

### **5.2. Feature: Donor Perks Program**

1. **Trigger (System):** A successful donation is logged. A background worker detects a new entry in the Donations table for a specific donor\_id.  
2. **Backend \- Get Interests:** The system retrieves the qloo\_taste\_keywords JSON array from the Donors table for that donor\_id.  
3. **Backend \- External API Call:** The system calls the **Qloo API** with the taste keywords.  
4. **Backend \- Process Response:** Qloo returns an enriched list of related keywords (e.g., "bakeries," "artisan coffee").  
5. Backend \- Match Coupon:  
   a. The system queries the Coupons table.  
   b. It searches for a coupon WHERE target\_keywords contains any of the enriched keywords from Qloo.  
   c. It also filters WHERE quantity\_redeemed \< quantity\_total.  
   d. The first available match is selected.  
6. **Backend \- DB Write:** A new record is inserted into the DonorCoupons table, linking the donor\_id and the selected coupon\_id and generating a unique\_redemption\_code.  
7. **Backend \- Notification:** A push notification is sent to the donor announcing their new perk.