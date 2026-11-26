export type MemberStatus = "pending" | "approved" | "rejected";
export type ResidenceType = "Naatil" | "Abroad";
export type SubscriptionType = "Maasavari" | "Varshavari";

export interface ChildDetail {
  relation: "Son" | "Daughter";
  name: string;
  dob: string;
}

export interface Member {
  id: string;
  membership_id: string | null;
  full_name: string;
  fathers_name: string;
  photo_url: string | null;
  dob: string;
  blood_group: string | null;
  marital_status: string | null;
  wife_name: string | null;
  children_count: number | null;
  children_details: ChildDetail[] | null;
  phone: string;
  whatsapp: string;
  email: string | null;
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
  house_status: string | null;
  shaikhuna_connection: string | null;
  shaikhuna_lineage: string | null;
  subscription_type: SubscriptionType;
  subscription_amount: string;
  status: MemberStatus;
  validity_date: string;
  created_at: string;
}
