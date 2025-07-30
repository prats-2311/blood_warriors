-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.auth_config_notes (
  id integer NOT NULL DEFAULT nextval('auth_config_notes_id_seq'::regclass),
  note text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT auth_config_notes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.bloodbanks (
  bank_id integer NOT NULL DEFAULT nextval('bloodbanks_bank_id_seq'::regclass),
  name character varying NOT NULL,
  address text,
  city character varying,
  state character varying,
  category USER-DEFINED NOT NULL,
  phone character varying,
  email character varying,
  latitude numeric,
  longitude numeric,
  location USER-DEFINED,
  CONSTRAINT bloodbanks_pkey PRIMARY KEY (bank_id)
);
CREATE TABLE public.bloodcomponents (
  component_id integer NOT NULL DEFAULT nextval('bloodcomponents_component_id_seq'::regclass),
  component_name character varying NOT NULL UNIQUE,
  CONSTRAINT bloodcomponents_pkey PRIMARY KEY (component_id)
);
CREATE TABLE public.bloodgroups (
  blood_group_id integer NOT NULL DEFAULT nextval('bloodgroups_blood_group_id_seq'::regclass),
  group_name character varying NOT NULL UNIQUE,
  CONSTRAINT bloodgroups_pkey PRIMARY KEY (blood_group_id)
);
CREATE TABLE public.bloodstock (
  stock_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  bank_id integer NOT NULL,
  blood_group_id integer NOT NULL,
  component_id integer NOT NULL,
  units_available integer NOT NULL DEFAULT 0,
  last_updated timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT bloodstock_pkey PRIMARY KEY (stock_id),
  CONSTRAINT bloodstock_bank_id_fkey FOREIGN KEY (bank_id) REFERENCES public.bloodbanks(bank_id),
  CONSTRAINT bloodstock_blood_group_id_fkey FOREIGN KEY (blood_group_id) REFERENCES public.bloodgroups(blood_group_id),
  CONSTRAINT bloodstock_component_id_fkey FOREIGN KEY (component_id) REFERENCES public.bloodcomponents(component_id)
);
CREATE TABLE public.chathistory (
  chat_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  prompt text NOT NULL,
  response text NOT NULL,
  timestamp timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chathistory_pkey PRIMARY KEY (chat_id),
  CONSTRAINT chathistory_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.coupons (
  coupon_id integer NOT NULL DEFAULT nextval('coupons_coupon_id_seq'::regclass),
  partner_name character varying NOT NULL,
  coupon_title character varying NOT NULL,
  target_keywords jsonb NOT NULL,
  quantity_total integer,
  quantity_redeemed integer DEFAULT 0,
  expiry_date date,
  CONSTRAINT coupons_pkey PRIMARY KEY (coupon_id)
);
CREATE TABLE public.donationrequests (
  request_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  patient_id uuid NOT NULL,
  blood_group_id integer NOT NULL,
  component_id integer NOT NULL,
  units_required integer NOT NULL,
  urgency USER-DEFINED NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'Open'::request_status,
  request_datetime timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  hospital_name character varying,
  hospital_address text,
  latitude numeric,
  longitude numeric,
  location USER-DEFINED,
  notes text,
  CONSTRAINT donationrequests_pkey PRIMARY KEY (request_id),
  CONSTRAINT donationrequests_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id),
  CONSTRAINT donationrequests_blood_group_id_fkey FOREIGN KEY (blood_group_id) REFERENCES public.bloodgroups(blood_group_id),
  CONSTRAINT donationrequests_component_id_fkey FOREIGN KEY (component_id) REFERENCES public.bloodcomponents(component_id)
);
CREATE TABLE public.donations (
  donation_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  donor_id uuid NOT NULL,
  bank_id integer,
  request_id uuid,
  donation_date date NOT NULL,
  units_donated integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT donations_pkey PRIMARY KEY (donation_id),
  CONSTRAINT donations_donor_id_fkey FOREIGN KEY (donor_id) REFERENCES public.donors(donor_id),
  CONSTRAINT donations_bank_id_fkey FOREIGN KEY (bank_id) REFERENCES public.bloodbanks(bank_id),
  CONSTRAINT donations_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.donationrequests(request_id)
);
CREATE TABLE public.donorcoupons (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  donor_id uuid NOT NULL,
  coupon_id integer NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'Issued'::coupon_status,
  issued_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  redeemed_at timestamp with time zone,
  unique_redemption_code character varying NOT NULL UNIQUE,
  CONSTRAINT donorcoupons_pkey PRIMARY KEY (id),
  CONSTRAINT donorcoupons_donor_id_fkey FOREIGN KEY (donor_id) REFERENCES public.donors(donor_id),
  CONSTRAINT donorcoupons_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(coupon_id)
);
CREATE TABLE public.donors (
  donor_id uuid NOT NULL,
  blood_group_id integer NOT NULL,
  last_donation_date date,
  is_available_for_sos boolean DEFAULT true,
  latitude numeric,
  longitude numeric,
  qloo_taste_keywords jsonb DEFAULT '[]'::jsonb,
  location USER-DEFINED,
  donation_count integer DEFAULT 0,
  CONSTRAINT donors_pkey PRIMARY KEY (donor_id),
  CONSTRAINT donors_donor_id_fkey FOREIGN KEY (donor_id) REFERENCES public.users(user_id),
  CONSTRAINT donors_blood_group_id_fkey FOREIGN KEY (blood_group_id) REFERENCES public.bloodgroups(blood_group_id)
);
CREATE TABLE public.notifications (
  notification_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  donor_id uuid NOT NULL,
  request_id uuid NOT NULL,
  message text NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'Sent'::notification_status,
  sent_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  read_at timestamp with time zone,
  fcm_token character varying,
  CONSTRAINT notifications_pkey PRIMARY KEY (notification_id),
  CONSTRAINT notifications_donor_id_fkey FOREIGN KEY (donor_id) REFERENCES public.donors(donor_id),
  CONSTRAINT notifications_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.donationrequests(request_id)
);
CREATE TABLE public.patients (
  patient_id uuid NOT NULL,
  blood_group_id integer NOT NULL,
  date_of_birth date NOT NULL,
  medical_conditions text,
  emergency_contact character varying,
  CONSTRAINT patients_pkey PRIMARY KEY (patient_id),
  CONSTRAINT patients_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.users(user_id),
  CONSTRAINT patients_blood_group_id_fkey FOREIGN KEY (blood_group_id) REFERENCES public.bloodgroups(blood_group_id)
);
CREATE TABLE public.spatial_ref_sys (
  srid integer NOT NULL CHECK (srid > 0 AND srid <= 998999),
  auth_name character varying,
  auth_srid integer,
  srtext character varying,
  proj4text character varying,
  CONSTRAINT spatial_ref_sys_pkey PRIMARY KEY (srid)
);
CREATE TABLE public.users (
  user_id uuid NOT NULL DEFAULT uuid_generate_v4(),
  auth_id uuid NOT NULL UNIQUE,
  email character varying NOT NULL UNIQUE,
  phone_number character varying NOT NULL UNIQUE,
  full_name character varying NOT NULL,
  city character varying,
  state character varying,
  user_type USER-DEFINED NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_pkey PRIMARY KEY (user_id),
  CONSTRAINT users_auth_id_fkey FOREIGN KEY (auth_id) REFERENCES auth.users(id)
);