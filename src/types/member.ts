export type MemberStatus = "pending" | "approved" | "rejected";
export type ResidenceType = "Naatil" | "Abroad";
export type SubscriptionType = "Maasavari" | "Varshavari";

export interface Member {
  id: string;
  membership_id: string | null;
  full_name: string;
  fathers_name: string;
  photo_url: string | null;
  dob: string;
  blood_group: string | null;
  marital_status: string | null;
  phone: string;
  whatsapp: string;
  islamic_qualification: string[] | null;
  general_education: string;
  profession: string;
  residence_type: ResidenceType;
  current_region: string;
  current_address: string;
  house_name: string;
  place_po: string;
  post_office: string;
  district: string;
  pincode: string;
  subscription_type: SubscriptionType;
  subscription_amount: string;
  status: MemberStatus;
  validity_date: string;
  created_at: string;
}

export interface PublicVerificationMember {
  membership_id: string;
  full_name: string;
  photo_url: string | null;
  house_name: string;
  place_po: string;
  post_office: string;
  district: string;
  pincode: string;
  current_region: string;
  status: MemberStatus;
  validity_date: string;
}

export interface RegistrationPayload {
  full_name: string;
  fathers_name: string;
  photo_url: string | null;
  dob: string;
  blood_group: string | null;
  marital_status: string | null;
  phone: string;
  whatsapp: string;
  islamic_qualification: string[] | null;
  general_education: string;
  profession: string;
  residence_type: ResidenceType;
  current_region: string;
  current_address: string;
  house_name: string;
  place_po: string;
  post_office: string;
  district: string;
  pincode: string;
  subscription_type: SubscriptionType;
  subscription_amount: string;
}
