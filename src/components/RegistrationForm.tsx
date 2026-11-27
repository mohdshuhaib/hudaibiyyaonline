"use client";

import React, { useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  CreditCard,
  Globe,
  Home,
  Loader2,
  MapPin,
  Phone,
  Send,
  User,
  BookOpen,
  AlertCircle,
  RefreshCw,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  ABROAD_REGION_OPTIONS,
  BLOOD_GROUPS,
  formatPermanentAddress,
  GENERAL_EDUCATION_OPTIONS,
  HOUSE_STATUS_OPTIONS,
  ISLAMIC_QUALIFICATION_OPTIONS,
  KERALA_DISTRICTS,
  MAASAVARI_AMOUNTS,
  MARITAL_STATUS_OPTIONS,
  PROFESSION_OPTIONS,
  SHAIKHUNA_CONNECTION_OPTIONS,
} from "@/lib/constants";
import type {
  ChildDetail,
  ResidenceType,
  SubscriptionType,
  VarisDetail,
} from "@/types/member";
import PhotoCropperModal from "./PhotoCropperModal";

interface FormErrors {
  [key: string]: string;
}

export default function RegistrationForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Photo state
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [fathersName, setFathersName] = useState("");
  const [dob, setDob] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [wifeName, setWifeName] = useState("");
  const [childrenCount, setChildrenCount] = useState(0);
  const [childrenDetails, setChildrenDetails] = useState<ChildDetail[]>([]);
  const [nomineeName, setNomineeName] = useState("");
  const [nomineeRelation, setNomineeRelation] = useState("");
  const [nomineePhone, setNomineePhone] = useState("");
  const [varisCount, setVarisCount] = useState(0);
  const [varisDetails, setVarisDetails] = useState<VarisDetail[]>([]);

  const [phone, setPhone] = useState("");
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");

  const [islamicQualifications, setIslamicQualifications] = useState<string[]>([]);
  const [generalEducation, setGeneralEducation] = useState("");
  const [profession, setProfession] = useState("");

  const [residenceType, setResidenceType] = useState<ResidenceType>("Naatil");
  const [currentRegion, setCurrentRegion] = useState("Kerala");
  const [sameAsPermanent, setSameAsPermanent] = useState(false);
  const [currentAddress, setCurrentAddress] = useState("");
  const [houseName, setHouseName] = useState("");
  const [placePo, setPlacePo] = useState("");
  const [postOffice, setPostOffice] = useState("");
  const [district, setDistrict] = useState("");
  const [pincode, setPincode] = useState("");
  const [houseStatus, setHouseStatus] = useState("");

  const [shaikhunaConnection, setShaikhunaConnection] = useState("");
  const [shaikhunaLineage, setShaikhunaLineage] = useState("");
  const [studyFromYear, setStudyFromYear] = useState("");
  const [studyToYear, setStudyToYear] = useState("");

  const subscriptionType: SubscriptionType = "Maasavari";
  const [subscriptionAmount, setSubscriptionAmount] = useState("200");

  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({
        ...prev,
        photo: "ദയവായി ഒരു ചിത്രം തിരഞ്ഞെടുക്കുക (Please select a valid image file)",
      }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setRawImageSrc(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const toggleIslamicQualification = (val: string) => {
    setIslamicQualifications((prev) =>
      prev.includes(val) ? prev.filter((item) => item !== val) : [...prev, val]
    );
  };

  const handleResidenceToggle = (type: ResidenceType) => {
    setResidenceType(type);
    setCurrentRegion(type === "Naatil" ? "Kerala" : "UAE - Dubai");
    if (type === "Abroad") {
      setSameAsPermanent(false);
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next.currentRegion;
      delete next.currentAddress;
      return next;
    });
  };

  const handleChildrenCountChange = (count: number) => {
    setChildrenCount(count);
    setChildrenDetails((prev) => {
      if (count <= 0) return [];
      const next: ChildDetail[] = [];
      for (let i = 0; i < count; i++) {
        next.push(prev[i] ?? { relation: "Son", name: "", dob: "" });
      }
      return next;
    });
  };

  const updateChildDetail = (
    index: number,
    field: keyof ChildDetail,
    value: string
  ) => {
    setChildrenDetails((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleVarisCountChange = (count: number) => {
    setVarisCount(count);
    setVarisDetails((prev) => {
      if (count <= 0) return [];
      const next: VarisDetail[] = [];
      for (let i = 0; i < count; i++) {
        next.push(prev[i] ?? { name: "", relation: "", qualification: "" });
      }
      return next;
    });
  };

  const updateVarisDetail = (
    index: number,
    field: keyof VarisDetail,
    value: string
  ) => {
    setVarisDetails((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      )
    );
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = "മുഴുവൻ പേര് ആവശ്യമാണ് (Full Name is required)";
    }
    if (!fathersName.trim()) {
      newErrors.fathersName = "പിതാവിന്റെ പേര് ആവശ്യമാണ് (Father's Name is required)";
    }
    if (!dob) {
      newErrors.dob = "ജനനത്തീയതി ആവശ്യമാണ് (Date of Birth is required)";
    }

    const cleanPhone = phone.replace(/\s+/g, "");
    if (!cleanPhone || cleanPhone.length < 8) {
      newErrors.phone = "സാധുവായ മൊബൈൽ നമ്പർ നൽകുക (Valid mobile number is required)";
    }
    if (!sameAsPhone) {
      const cleanWa = whatsapp.replace(/\s+/g, "");
      if (!cleanWa || cleanWa.length < 8) {
        newErrors.whatsapp = "സാധുവായ വാട്സ്ആപ്പ് നമ്പർ നൽകുക (Valid WhatsApp number is required)";
      }
    }

    if (!generalEducation) {
      newErrors.generalEducation = "ഭൗതിക വിദ്യാഭ്യാസം തിരഞ്ഞെടുക്കുക (General Education is required)";
    }
    if (!profession) {
      newErrors.profession = "തൊഴിൽ തിരഞ്ഞെടുക്കുക (Profession is required)";
    }
    if (!currentRegion) {
      newErrors.currentRegion = "നിലവിലെ സ്ഥലം/രാജ്യം തിരഞ്ഞെടുക്കുക (Current Region is required)";
    }
    if (!sameAsPermanent && !currentAddress.trim()) {
      newErrors.currentAddress = "നിലവിലെ മേൽവിലാസം നൽകുക (Current Address is required)";
    }
    if (!houseName.trim()) {
      newErrors.houseName = "വീട്ടുപേര് നൽകുക (Home Name is required)";
    }
    if (!placePo.trim()) {
      newErrors.placePo = "സ്ഥലം നൽകുക (Correct Place is required)";
    }
    if (!postOffice.trim()) {
      newErrors.postOffice = "പോസ്റ്റ് ഓഫീസ് നൽകുക (Post Office is required)";
    }
    if (!district) {
      newErrors.district = "ജില്ല തിരഞ്ഞെടുക്കുക (District is required)";
    }
    if (!pincode.trim() || pincode.trim().length < 5) {
      newErrors.pincode = "സാധുവായ പിൻകോഡ് നൽകുക (Valid PIN is required)";
    }

    const amt = Number(subscriptionAmount);
    if (!subscriptionAmount.trim() || Number.isNaN(amt) || amt <= 0) {
      newErrors.subscriptionAmount = "വരിസംഖ്യ തുക നൽകുക (Valid subscription amount is required)";
    } else if (subscriptionType === "Maasavari" && amt < 100) {
      newErrors.subscriptionAmount =
        "മാസവരി തുക കുറഞ്ഞത് ₹100 ആയിരിക്കണം (Minimum Maasavari amount is ₹100)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      setSubmitError(
        "ദയവായി ചുവപ്പ് നിറത്തിൽ കാണിച്ചിരിക്കുന്ന വിവരങ്ങൾ കൃത്യമായി പൂരിപ്പിക്കുക. (Please fix the highlighted fields above.)"
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      let uploadedPhotoUrl: string | null = null;

      if (croppedBlob) {
        const fileName = `member-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("member-photos")
          .upload(fileName, croppedBlob, {
            contentType: "image/jpeg",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(
            `ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യാൻ സാധിച്ചില്ല (Photo upload failed): ${uploadError.message}`
          );
        }

        const { data: publicUrlData } = supabase.storage
          .from("member-photos")
          .getPublicUrl(fileName);
        uploadedPhotoUrl = publicUrlData.publicUrl;
      }

      const cleanPhone = phone.trim();
      const finalWhatsapp = sameAsPhone ? cleanPhone : whatsapp.trim();
      const finalCurrentAddress = sameAsPermanent
        ? formatPermanentAddress({
            house_name: houseName,
            place_po: placePo,
            post_office: postOffice,
            district,
            pincode,
          })
        : currentAddress.trim();

      const { error: insertError } = await supabase.from("members").insert({
        membership_id: null,
        status: "pending",
        full_name: fullName.trim(),
        fathers_name: fathersName.trim(),
        photo_url: uploadedPhotoUrl,
        dob,
        blood_group: bloodGroup || null,
        marital_status: maritalStatus || null,
        wife_name: maritalStatus === "Married" ? wifeName.trim() || null : null,
        children_count: maritalStatus === "Married" ? childrenCount : 0,
        children_details:
          maritalStatus === "Married" && childrenCount > 0 ? childrenDetails : [],
        nominee_name: nomineeName.trim() || null,
        nominee_relation: nomineeRelation.trim() || null,
        nominee_phone: nomineePhone.trim() || null,
        varis_count: varisCount,
        varis_details: varisCount > 0 ? varisDetails : [],
        phone: cleanPhone,
        whatsapp: finalWhatsapp,
        email: email.trim() || null,
        islamic_qualification:
          islamicQualifications.length > 0 ? islamicQualifications : null,
        general_education: generalEducation,
        profession,
        residence_type: residenceType,
        current_region: currentRegion,
        current_address: finalCurrentAddress,
        house_name: houseName.trim(),
        place_po: placePo.trim(),
        post_office: postOffice.trim(),
        district,
        pincode: pincode.trim(),
        house_status: houseStatus || null,
        shaikhuna_connection: shaikhunaConnection || null,
        shaikhuna_lineage:
          shaikhunaConnection === "Shaikhunayude Shishya Parambara"
            ? shaikhunaLineage.trim() || null
            : null,
        study_from_year:
          shaikhunaConnection && studyFromYear ? Number(studyFromYear) : null,
        study_to_year:
          shaikhunaConnection && studyToYear ? Number(studyToYear) : null,
        subscription_type: subscriptionType,
        subscription_amount: subscriptionAmount.trim(),
      });

      if (insertError) {
        if (insertError.code === "23505") {
          throw new Error(
            "ഈ മൊബൈൽ നമ്പർ ഉപയോഗിച്ച് ഇതിനകം രജിസ്റ്റർ ചെയ്തിട്ടുണ്ട്. (A member with this mobile number is already registered.)"
          );
        }
        throw new Error(insertError.message);
      }

      setSubmittedName(fullName.trim());
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "രജിസ്ട്രേഷൻ പൂർത്തിയാക്കാൻ സാധിച്ചില്ല. (Registration failed. Please try again.)";
      setSubmitError(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setRawImageSrc(null);
    setCroppedBlob(null);
    setPhotoPreviewUrl(null);
    setFullName("");
    setFathersName("");
    setDob("");
    setBloodGroup("");
    setMaritalStatus("");
    setWifeName("");
    setChildrenCount(0);
    setChildrenDetails([]);
    setNomineeName("");
    setNomineeRelation("");
    setNomineePhone("");
    setVarisCount(0);
    setVarisDetails([]);
    setPhone("");
    setSameAsPhone(true);
    setWhatsapp("");
    setEmail("");
    setIslamicQualifications([]);
    setGeneralEducation("");
    setProfession("");
    setResidenceType("Naatil");
    setCurrentRegion("Kerala");
    setSameAsPermanent(false);
    setCurrentAddress("");
    setHouseName("");
    setPlacePo("");
    setPostOffice("");
    setDistrict("");
    setPincode("");
    setHouseStatus("");
    setShaikhunaConnection("");
    setShaikhunaLineage("");
    setStudyFromYear("");
    setStudyToYear("");
    setSubscriptionAmount("200");
    setErrors({});
    setSubmitError(null);
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 sm:p-10 shadow-lg border border-blue-100 text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-11 w-11" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">
            രജിസ്ട്രേഷൻ വിജയകരമായി സമർപ്പിച്ചു!
          </h2>
          <p className="text-lg font-semibold text-blue-900">
            Registration Submitted Successfully!
          </p>
        </div>

        <div className="rounded-xl bg-blue-50/80 border border-blue-200 p-5 text-left space-y-3">
          <p className="text-sm sm:text-base text-slate-800 leading-relaxed">
            പ്രിയ <span className="font-bold text-blue-950">{submittedName}</span>,
            ഹുദൈബിയ്യ ഇസ്ലാമിക് ചാരിറ്റബിൾ ട്രസ്റ്റിലേക്കുള്ള നിങ്ങളുടെ അംഗത്വ അപേക്ഷ ലഭിച്ചിരിക്കുന്നു.
            കമ്മിറ്റിയുടെ പരിശോധനയ്ക്കും അംഗീകാരത്തിനും ശേഷം ജനറൽ ബോഡി സംഗമത്തിൽ വെച്ച്
            നിങ്ങളുടെ ഔദ്യോഗിക PVC ഐഡി കാർഡ് വിതരണം ചെയ്യുന്നതാണ്.
          </p>
          <hr className="border-blue-200/70" />
          <p className="text-sm text-slate-700 leading-relaxed">
            Dear <span className="font-semibold text-slate-900">{submittedName}</span>,
            your membership registration for <strong>Hudaibiyya Islamic Charitable Trust</strong>{" "}
            has been received. Your physical PVC ID card will be issued after committee
            approval at the upcoming General Body gathering.
          </p>
        </div>

        <button
          type="button"
          onClick={resetForm}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-300 bg-white px-6 py-3 text-sm font-semibold text-blue-800 hover:bg-blue-50 transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>മറ്റൊരു അംഗത്തെ ചേർക്കുക (Register Another Member)</span>
        </button>
      </div>
    );
  }

  const quickAmounts = MAASAVARI_AMOUNTS;

  return (
    <>
      {rawImageSrc && (
        <PhotoCropperModal
          imageSrc={rawImageSrc}
          onCancel={() => setRawImageSrc(null)}
          onCropComplete={(blob, preview) => {
            setCroppedBlob(blob);
            setPhotoPreviewUrl(preview);
            setRawImageSrc(null);
          }}
        />
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {submitError && (
          <div className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-red-900 shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm font-medium leading-relaxed">{submitError}</p>
          </div>
        )}

        {/* Section 1: Personal Info & Photo */}
        <section className="rounded-2xl bg-white p-5 sm:p-7 shadow-sm border border-slate-200 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
              <User className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                1. വ്യക്തിഗത വിവരങ്ങൾ (Personal Information)
              </h2>
              <p className="text-xs text-slate-500">
                അംഗത്തിന്റെ അടിസ്ഥാന വിവരങ്ങളും ഫോട്ടോയും നൽകുക
              </p>
            </div>
          </div>

          {/* Photo Upload with Circular Preview */}
          <div className="flex flex-col sm:flex-row items-center gap-5 rounded-xl bg-blue-50/60 border border-dashed border-blue-300 p-4">
            <div className="relative h-28 w-28 shrink-0 rounded-full border-4 border-white bg-slate-200 shadow-md overflow-hidden flex items-center justify-center">
              {photoPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoPreviewUrl}
                  alt="Member Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-slate-400" />
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <p className="text-sm font-semibold text-slate-800">
                പാസ്‌പോർട്ട് സൈസ് ഫോട്ടോ (Passport Size Photo)
              </p>
              <p className="text-xs text-slate-600">
                ഐഡി കാർഡിനായി വ്യക്തമായ മുഖം കാണുന്ന ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക (Optional, auto-compressed)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 active:scale-[0.99] transition"
              >
                <Camera className="w-4 h-4" />
                <span>
                  {photoPreviewUrl
                    ? "ഫോട്ടോ മാറ്റുക (Change Photo)"
                    : "ഫോട്ടോ തിരഞ്ഞെടുക്കുക (Upload Photo)"}
                </span>
              </button>
              {errors.photo && (
                <p className="text-xs font-medium text-red-600">{errors.photo}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                മുഴുവൻ പേര് (Full Name) <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="ഉദാ: മുഹമ്മദ് അലി / Muhammed Ali"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
              {errors.fullName && (
                <p className="mt-1 text-xs font-medium text-red-600">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                പിതാവിന്റെ പേര് (Father&apos;s Name) <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={fathersName}
                onChange={(e) => setFathersName(e.target.value)}
                placeholder="ഉദാ: അബ്ദുറഹ്മാൻ / Abdurahman"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
              {errors.fathersName && (
                <p className="mt-1 text-xs font-medium text-red-600">{errors.fathersName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                ജനനത്തീയതി (Date of Birth) <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
              {errors.dob && (
                <p className="mt-1 text-xs font-medium text-red-600">{errors.dob}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                രക്തഗ്രൂപ്പ് (Blood Group)
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="">തിരഞ്ഞെടുക്കുക (Select Blood Group)</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                വൈവാഹിക നില (Marital Status)
              </label>
              <select
                value={maritalStatus}
                onChange={(e) => {
                  const val = e.target.value;
                  setMaritalStatus(val);
                  if (val !== "Married") {
                    setWifeName("");
                    setChildrenCount(0);
                    setChildrenDetails([]);
                  }
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="">തിരഞ്ഞെടുക്കുക (Select Marital Status)</option>
                {MARITAL_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {maritalStatus === "Married" && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    ഭാര്യയുടെ പേര് (Wife&apos;s Name)
                  </label>
                  <input
                    type="text"
                    value={wifeName}
                    onChange={(e) => setWifeName(e.target.value)}
                    placeholder="ഭാര്യയുടെ പേര് നൽകുക"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                    കുട്ടികളുടെ എണ്ണം (Number of Children)
                  </label>
                  <select
                    value={childrenCount}
                    onChange={(e) => handleChildrenCountChange(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  >
                    {Array.from({ length: 11 }, (_, i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </div>

                {childrenCount > 0 && (
                  <div className="sm:col-span-2 space-y-3 rounded-xl bg-slate-50 border border-slate-200 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-blue-800">
                      കുട്ടികളുടെ വിവരങ്ങൾ (Children Details)
                    </p>
                    {childrenDetails.map((child, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white p-3 rounded-xl border border-slate-200"
                      >
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            മകൻ / മകൾ (Son / Daughter)
                          </label>
                          <select
                            value={child.relation}
                            onChange={(e) =>
                              updateChildDetail(
                                idx,
                                "relation",
                                e.target.value as "Son" | "Daughter"
                              )
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                          >
                            <option value="Son">മകൻ (Son)</option>
                            <option value="Daughter">മകൾ (Daughter)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            പേര് (Name)
                          </label>
                          <input
                            type="text"
                            value={child.name}
                            onChange={(e) =>
                              updateChildDetail(idx, "name", e.target.value)
                            }
                            placeholder={`കുട്ടി ${idx + 1} പേര്`}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            ജനനത്തീയതി (DOB)
                          </label>
                          <input
                            type="date"
                            value={child.dob}
                            onChange={(e) =>
                              updateChildDetail(idx, "dob", e.target.value)
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Nominee Details */}
            <div className="sm:col-span-2 pt-3 border-t border-slate-100 space-y-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-blue-800">
                  നോമിനി വിവരങ്ങൾ (Nominee Details)
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  ട്രസ്റ്റിൽ നിന്ന് സഹായം ലഭിക്കാനും അംഗത്വം തുടരാനും അർഹതയുള്ള നോമിനിയുടെ വിവരങ്ങൾ
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    നോമിനിയുടെ പേര് (Nominee Name)
                  </label>
                  <input
                    type="text"
                    value={nomineeName}
                    onChange={(e) => setNomineeName(e.target.value)}
                    placeholder="പേര് നൽകുക"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ബന്ധം (Relation)
                  </label>
                  <input
                    type="text"
                    value={nomineeRelation}
                    onChange={(e) => setNomineeRelation(e.target.value)}
                    placeholder="ഉദാ: ഭാര്യ / മകൻ (Wife / Son)"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ഫോൺ നമ്പർ (Phone Number)
                  </label>
                  <input
                    type="tel"
                    value={nomineePhone}
                    onChange={(e) => setNomineePhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Number of Varis (Legal Heirs) */}
            <div className="sm:col-span-2 pt-3 border-t border-slate-100 space-y-3">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  അനന്തരാവകാശികളുടെ എണ്ണം (Number of Varis / Legal Heirs)
                </label>
                <select
                  value={varisCount}
                  onChange={(e) => handleVarisCountChange(Number(e.target.value))}
                  className="w-full sm:w-1/2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                >
                  {Array.from({ length: 11 }, (_, i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>

              {varisCount > 0 && (
                <div className="space-y-3 rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-800">
                    അനന്തരാവകാശികളുടെ വിവരങ്ങൾ (Varis Details)
                  </p>
                  {varisDetails.map((v, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white p-3 rounded-xl border border-slate-200"
                    >
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          പേര് (Name)
                        </label>
                        <input
                          type="text"
                          value={v.name}
                          onChange={(e) =>
                            updateVarisDetail(idx, "name", e.target.value)
                          }
                          placeholder={`അനന്തരാവകാശി ${idx + 1} പേര്`}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          ബന്ധം (Relation)
                        </label>
                        <input
                          type="text"
                          value={v.relation}
                          onChange={(e) =>
                            updateVarisDetail(idx, "relation", e.target.value)
                          }
                          placeholder="ഉദാ: മകൻ / മകൾ / ഭാര്യ"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          യോഗ്യത (Qualification)
                        </label>
                        <textarea
                          rows={2}
                          value={v.qualification}
                          onChange={(e) =>
                            updateVarisDetail(
                              idx,
                              "qualification",
                              e.target.value
                            )
                          }
                          placeholder="വിദ്യാഭ്യാസ യോഗ്യത നൽകുക"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 2: Contact Details */}
        <section className="rounded-2xl bg-white p-5 sm:p-7 shadow-sm border border-slate-200 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
              <Phone className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                2. ബന്ധപ്പെടാനുള്ള വിവരങ്ങൾ (Contact Details)
              </h2>
              <p className="text-xs text-slate-500">
                മൊബൈൽ നമ്പറും വാട്സ്ആപ്പ് നമ്പറും നൽകുക
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                മൊബൈൽ നമ്പർ (Mobile Number) <span className="text-red-600">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210 / +971 50 123 4567"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
              <p className="mt-1 text-xs text-slate-500">
                വിദേശത്തുള്ളവർ കൺട്രി കോഡ് ഉൾപ്പെടെ നൽകുക (Include country code if abroad)
              </p>
              {errors.phone && (
                <p className="mt-1 text-xs font-medium text-red-600">{errors.phone}</p>
              )}
            </div>

            <label className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 p-3.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sameAsPhone}
                onChange={(e) => setSameAsPhone(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
              />
              <span className="text-sm font-medium text-slate-800">
                മുകളിലെ നമ്പർ തന്നെയാണ് വാട്സ്ആപ്പ് നമ്പർ (Same as mobile number)
              </span>
            </label>

            {!sameAsPhone && (
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  വാട്സ്ആപ്പ് നമ്പർ (WhatsApp Number) <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
                {errors.whatsapp && (
                  <p className="mt-1 text-xs font-medium text-red-600">{errors.whatsapp}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                ഇമെയിൽ (Email Address)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>
        </section>

        {/* Section 3: Education & Profession */}
        <section className="rounded-2xl bg-white p-5 sm:p-7 shadow-sm border border-slate-200 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                3. വിദ്യാഭ്യാസവും തൊഴിലും (Education &amp; Profession)
              </h2>
              <p className="text-xs text-slate-500">
                മത-ഭൗതിക വിദ്യാഭ്യാസ യോഗ്യതകളും തൊഴിലും
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                മത വിദ്യാഭ്യാസം (Islamic Qualification — ഒന്നിലധികം തിരഞ്ഞെടുക്കാം)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ISLAMIC_QUALIFICATION_OPTIONS.map((opt) => {
                  const checked = islamicQualifications.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition ${
                        checked
                          ? "border-blue-600 bg-blue-50 text-blue-950"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleIslamicQualification(opt.value)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                      />
                      <span className="text-sm font-medium">{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  ഭൗതിക വിദ്യാഭ്യാസം (General Education) <span className="text-red-600">*</span>
                </label>
                <select
                  value={generalEducation}
                  onChange={(e) => setGeneralEducation(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                >
                  <option value="">തിരഞ്ഞെടുക്കുക (Select Education)</option>
                  {GENERAL_EDUCATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.generalEducation && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {errors.generalEducation}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  തൊഴിൽ (Profession) <span className="text-red-600">*</span>
                </label>
                <select
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                >
                  <option value="">തിരഞ്ഞെടുക്കുക (Select Profession)</option>
                  {PROFESSION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.profession && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {errors.profession}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Residence & Address */}
        <section className="rounded-2xl bg-white p-5 sm:p-7 shadow-sm border border-slate-200 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
              <MapPin className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                4. താമസസ്ഥല വിവരങ്ങൾ (Address &amp; Residence)
              </h2>
              <p className="text-xs text-slate-500">
                നാട്ടിലെ സ്ഥിരമേൽവിലാസവും നിലവിലെ താമസസ്ഥലവും നൽകുക
              </p>
            </div>
          </div>

          {/* Step 4A: Permanent Address First */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">
                നാട്ടിലെ സ്ഥിരമേൽവിലാസം (Permanent Address — Kerala)
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                വീട്ടുപേര് (Home Name) <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={houseName}
                onChange={(e) => setHouseName(e.target.value)}
                placeholder="Madeena Manzil"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
              {errors.houseName && (
                <p className="mt-1 text-xs font-medium text-red-600">{errors.houseName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                സ്ഥലം (Correct Place) <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={placePo}
                onChange={(e) => setPlacePo(e.target.value)}
                placeholder="Perunguzhi"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
              {errors.placePo && (
                <p className="mt-1 text-xs font-medium text-red-600">{errors.placePo}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                പോസ്റ്റ് ഓഫീസ് (Post Office) <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={postOffice}
                onChange={(e) => setPostOffice(e.target.value)}
                placeholder="Perunguzhi PO"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
              {errors.postOffice && (
                <p className="mt-1 text-xs font-medium text-red-600">{errors.postOffice}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                ജില്ല (District) <span className="text-red-600">*</span>
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="">ജില്ല തിരഞ്ഞെടുക്കുക (Select District)</option>
                {KERALA_DISTRICTS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              {errors.district && (
                <p className="mt-1 text-xs font-medium text-red-600">{errors.district}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                പിൻകോഡ് (PIN) <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="695305"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
              {errors.pincode && (
                <p className="mt-1 text-xs font-medium text-red-600">{errors.pincode}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                വീടിന്റെ അവസ്ഥ (House Status)
              </label>
              <select
                value={houseStatus}
                onChange={(e) => setHouseStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="">തിരഞ്ഞെടുക്കുക (Select House Status)</option>
                {HOUSE_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Step 4B: Current Residence & Address */}
          <div className="pt-3 border-t border-slate-100 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                നിലവിൽ താമസിക്കുന്നത് (Currently Residing In) <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleResidenceToggle("Naatil")}
                  className={`flex items-center justify-center gap-2.5 rounded-xl border-2 py-3.5 px-4 text-base font-bold transition ${
                    residenceType === "Naatil"
                      ? "border-blue-700 bg-blue-700 text-white shadow-md"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Home className="w-5 h-5" />
                  <span>നാട്ടിൽ (In India)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleResidenceToggle("Abroad")}
                  className={`flex items-center justify-center gap-2.5 rounded-xl border-2 py-3.5 px-4 text-base font-bold transition ${
                    residenceType === "Abroad"
                      ? "border-blue-700 bg-blue-700 text-white shadow-md"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Globe className="w-5 h-5" />
                  <span>വിദേശത്ത് (Abroad)</span>
                </button>
              </div>
            </div>

            {residenceType === "Abroad" && (
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  രാജ്യം / എമിറേറ്റ് (Country / Emirate){" "}
                  <span className="text-red-600">*</span>
                </label>
                <select
                  value={currentRegion}
                  onChange={(e) => setCurrentRegion(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                >
                  {ABROAD_REGION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.currentRegion && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {errors.currentRegion}
                  </p>
                )}
              </div>
            )}

            {residenceType === "Naatil" && (
              <label className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 p-3.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sameAsPermanent}
                  onChange={(e) => setSameAsPermanent(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                />
                <span className="text-sm font-medium text-slate-800">
                  സ്ഥിരമേൽവിലാസം തന്നെയാണ് നിലവിലെ മേൽവിലാസം (Same as Permanent Address)
                </span>
              </label>
            )}

            {sameAsPermanent ? (
              <div className="rounded-xl bg-blue-50/70 border border-blue-200 p-3.5 text-sm text-blue-950">
                <span className="block text-xs font-semibold text-blue-700 mb-1">
                  നിലവിലെ മേൽവിലാസം (Current Address):
                </span>
                {formatPermanentAddress({
                  house_name: houseName || "Madeena Manzil",
                  place_po: placePo || "Perunguzhi",
                  post_office: postOffice || "Perunguzhi PO",
                  district: district || "Malappuram",
                  pincode: pincode || "695305",
                })}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  നിലവിലെ മേൽവിലാസം (Current Address) <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={2}
                  value={currentAddress}
                  onChange={(e) => setCurrentAddress(e.target.value)}
                  placeholder="നിലവിൽ താമസിക്കുന്ന സ്ഥലത്തിന്റെ വിലാസം (Current city / area / flat)"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
                {errors.currentAddress && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {errors.currentAddress}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Section 5: Connection with Shaikhuna */}
        <section className="rounded-2xl bg-white p-5 sm:p-7 shadow-sm border border-slate-200 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                5. ശൈഖുനായുമായുള്ള ബന്ധം (Connection with Shaikhuna)
              </h2>
              <p className="text-xs text-slate-500">
                ശൈഖുനായുമായുള്ള പഠന/ശിഷ്യത്വ ബന്ധം തിരഞ്ഞെടുക്കുക
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                ബന്ധം തിരഞ്ഞെടുക്കുക (Select Connection)
              </label>
              <select
                value={shaikhunaConnection}
                onChange={(e) => {
                  setShaikhunaConnection(e.target.value);
                  if (e.target.value !== "Shaikhunayude Shishya Parambara") {
                    setShaikhunaLineage("");
                  }
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="">തിരഞ്ഞെടുക്കുക (Select Connection)</option>
                {SHAIKHUNA_CONNECTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {shaikhunaConnection === "Shaikhunayude Shishya Parambara" && (
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                  ശിഷ്യ പരമ്പരയുടെ വിവരങ്ങൾ (Shishya Parambara Details)
                </label>
                <textarea
                  rows={3}
                  value={shaikhunaLineage}
                  onChange={(e) => setShaikhunaLineage(e.target.value)}
                  placeholder="ഉദാ: ഞാൻ [ഉസ്താദിന്റെ പേര്] ഉസ്താദിൽ നിന്നാണ് പഠിച്ചത്, അദ്ദേഹം [ശൈഖുനായുടെ ശിഷ്യന്റെ പേര്] ഉസ്താദിൽ നിന്നും, അദ്ദേഹം ശൈഖുനായിൽ നിന്നും പഠിച്ചതാണ്. (e.g., I studied under Usthad ..., who studied under Usthad ..., who is a direct disciple of Shaikhuna)"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>
            )}

            {shaikhunaConnection && (
              <div className="space-y-2 pt-1">
                <label className="block text-sm font-semibold text-slate-800">
                  പഠന കാലഘട്ടം (Study Period)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      മുതൽ (From Year)
                    </label>
                    <select
                      value={studyFromYear}
                      onChange={(e) => setStudyFromYear(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm sm:text-base text-slate-900 focus:border-blue-600 focus:outline-none"
                    >
                      <option value="">വർഷം (From)</option>
                      {Array.from(
                        { length: new Date().getFullYear() - 1900 + 1 },
                        (_, idx) => new Date().getFullYear() - idx
                      ).map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      വരെ (To Year)
                    </label>
                    <select
                      value={studyToYear}
                      onChange={(e) => setStudyToYear(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm sm:text-base text-slate-900 focus:border-blue-600 focus:outline-none"
                    >
                      <option value="">വർഷം (To)</option>
                      {Array.from(
                        { length: new Date().getFullYear() - 1900 + 1 },
                        (_, idx) => new Date().getFullYear() - idx
                      ).map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Section 6: Subscription Details */}
        <section className="rounded-2xl bg-white p-5 sm:p-7 shadow-sm border border-slate-200 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
              <CreditCard className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                6. മാസവരി വിവരങ്ങൾ (Maasavari Subscription)
              </h2>
              <p className="text-xs text-slate-500">
                നിങ്ങളുടെ മാസവരി തുക രേഖപ്പെടുത്തുക
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-800">
              വരിസംഖ്യ തുക ₹ (Subscription Amount in INR) <span className="text-red-600">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setSubscriptionAmount(amt)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold border transition ${
                    subscriptionAmount === amt
                      ? "border-blue-700 bg-blue-100 text-blue-900"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={subscriptionType === "Maasavari" ? 100 : 1}
              value={subscriptionAmount}
              onChange={(e) => setSubscriptionAmount(e.target.value)}
              placeholder="തുക നൽകുക (Enter custom amount)"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
            {subscriptionType === "Maasavari" && (
              <p className="text-xs text-slate-500">
                മാസവരി കുറഞ്ഞത് ₹100 മുതൽ നൽകാവുന്നതാണ് (Minimum ₹100 for Maasavari)
              </p>
            )}
            {errors.subscriptionAmount && (
              <p className="text-xs font-medium text-red-600">
                {errors.subscriptionAmount}
              </p>
            )}
          </div>
        </section>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-800 to-blue-600 px-6 py-4 text-base sm:text-lg font-bold text-white shadow-lg hover:from-blue-900 hover:to-blue-700 active:scale-[0.99] disabled:opacity-60 transition"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>സമർപ്പിക്കുന്നു... (Submitting...)</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>രജിസ്ട്രേഷൻ സമർപ്പിക്കുക (Submit Registration)</span>
              </>
            )}
          </button>
          <p className="mt-3 text-center text-xs text-slate-500">
            സമർപ്പിക്കുന്നതിന് മുൻപ് നൽകിയ വിവരങ്ങൾ ശരിയാണെന്ന് ഉറപ്പുവരുത്തുക. • Please verify your details before submitting.
          </p>
        </div>
      </form>
    </>
  );
}
