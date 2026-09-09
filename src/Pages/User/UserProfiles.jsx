import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  AlertCircle,
  Camera,
  Calendar,
  Check,
  CheckCircle,
  ChevronDown,
  Edit2,
  Heart,
  Loader2,
  Mail,
  Phone,
  Save,
  Search,
  Shield,
  Stethoscope,
  Trash2,
  Upload,
  User,
  UserCircle,
  Eye,
  Users,
  X,
} from "lucide-react";

import api from "../../api/axiosInstance";

import "./UserProfiles.css";

const RELATIONS = [
  "FATHER",
  "MOTHER",
  "BROTHER",
  "SISTER",
  "SPOUSE",
  "SON",
  "DAUGHTER",
  "FRIEND",
  "OTHER",
];

const NO_DISEASE_OPTION = {
  label: "No Medical Condition / None",
  value: "NO_MEDICAL_CONDITION_NONE",
};

const DISEASE_OPTIONS = [
  { label: "Diabetes", value: "DIABETES" },
  { label: "Hypertension", value: "HYPERTENSION" },
  { label: "Heart Disease", value: "HEART_DISEASE" },
  { label: "Asthma", value: "ASTHMA" },
  { label: "Arthritis", value: "ARTHRITIS" },
  { label: "Kidney Disease", value: "KIDNEY_DISEASE" },
  { label: "Thyroid", value: "THYROID" },
  { label: "Cancer", value: "CANCER" },
  { label: "Alzheimer's", value: "ALZHEIMERS" },
  { label: "Other", value: "OTHER" },
];

const MEDICAL_CONDITION_OPTIONS = [NO_DISEASE_OPTION, ...DISEASE_OPTIONS];
const PROFILE_PHOTO_MAX_SIZE = 5 * 1024 * 1024;
const PROFILE_PHOTO_TYPES = ["image/jpeg", "image/png"];
const PROFILE_PHOTO_URL_KEY = "profilePhotoUrl";

const toProfilePhotoUrl = (value) => {
  if (!value) return "";

  const photoUrl = String(value).trim();
  if (!photoUrl) return "";

  if (/^(https?:|data:|blob:)/i.test(photoUrl)) {
    return photoUrl;
  }

  const apiBaseUrl = api.defaults.baseURL || window.location.origin;
  return new URL(photoUrl, apiBaseUrl).href;
};

const PROFILE_PHOTO_FIELDS = [
  "profilePhotoUrl",
  "profilePhotoURL",
  "photoUrl",
  "photoURL",
  "imageUrl",
  "avatarUrl",
];


const getProfilePhotoUrl = (profile) =>
  toProfilePhotoUrl(PROFILE_PHOTO_FIELDS.map((field) => profile?.[field]).find(Boolean));

const addPhotoCacheBust = (url) => {
  if (!url || /^(data:|blob:)/i.test(url)) return url;

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${Date.now()}`;
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
const isSupportedImageBlob = async (blob) => {
  const bytes = new Uint8Array(await blob.slice(0, 8).arrayBuffer());
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;

  return isJpeg || isPng;
};
const REQUIRED_PROFILE_LABELS = new Set([
  "Full Name",
  "Email Address",
  "Mobile Number",
  "Age",
  "Gender",
  "Relation",
  "Phone Number",
]);

const readLocalJSON = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

const formatLabel = (value) => {
  if (!value) return "Not specified";

  return String(value)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getDiseaseValues = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const getDiseaseLabel = (value) =>
  MEDICAL_CONDITION_OPTIONS.find((option) => option.value === value)?.label ||
  formatLabel(value);

const getEditableDisease = (value) => {
  const values = getDiseaseValues(value);

  if (!values.length) {
    return { disease: "", diseaseOther: "" };
  }

  const knownValues = new Set(MEDICAL_CONDITION_OPTIONS.map((option) => option.value));
  const allKnown = values.every((item) => knownValues.has(item));

  if (allKnown) {
    return { disease: values.join(","), diseaseOther: "" };
  }

  return { disease: "OTHER", diseaseOther: String(value || "") };
};

const formatDiseaseDisplay = (value) => {
  const editableDisease = getEditableDisease(value);

  if (editableDisease.disease === "OTHER" && editableDisease.diseaseOther) {
    return editableDisease.diseaseOther;
  }

  const labels = getDiseaseValues(editableDisease.disease).map(getDiseaseLabel);
  return labels.length ? labels.join(", ") : "Not specified";
};

const getProfileValue = (profileData, registeredUser, keys) => {
  for (const key of keys) {
    const value = profileData?.[key] || registeredUser?.[key];
    if (value) return value;
  }

  return "";
};

const normalizeGender = (value) => {
  if (!value) return "";
  return String(value).trim().toUpperCase();
};

const getRequiredProfileFields = (profile) => [
  profile?.fullName,
  profile?.email,
  profile?.mobile,
  profile?.age,
  profile?.gender,
  profile?.diseaseCondition,
  getProfilePhotoUrl(profile),
  profile?.contact1Relation,
  profile?.contact1Phone,
  profile?.contact2Relation,
  profile?.contact2Phone,
];

const getProfileCompletionPercent = (profile) => {
  const requiredFields = getRequiredProfileFields(profile);
  const completedFields = requiredFields.filter(Boolean).length;
  return Math.round((completedFields / requiredFields.length) * 100);
};

const isProfileComplete = (profile) =>
  getProfileCompletionPercent(profile) >= 100;

const isDashboardProfileReady = (profile) =>
  Boolean(
    profile?.fullName &&
      profile?.email &&
      profile?.mobile &&
      profile?.age &&
      profile?.gender &&
      profile?.contact1Relation &&
      profile?.contact1Phone &&
      profile?.contact2Relation &&
      profile?.contact2Phone
  );

const normalizeProfile = (data = {}) => {
  const normalized = {
    ...data,
    gender: normalizeGender(data.gender),
    diseaseCondition:
      data.diseaseCondition || data.disease || data.diseases?.[0] || "",
    contact1Relation:
      data.contact1Relation || data.familyContacts?.[0]?.relation || "",
    contact1Phone:
      data.contact1Phone || data.familyContacts?.[0]?.phoneNumber || "",
    contact2Relation:
      data.contact2Relation || data.familyContacts?.[1]?.relation || "",
    contact2Phone:
      data.contact2Phone || data.familyContacts?.[1]?.phoneNumber || "",
  };

  normalized.completionPercentage = getProfileCompletionPercent(normalized);
  normalized.completed = isProfileComplete(normalized);

  return normalized;
};

const UserProfiles = () => {
  const [profileData, setProfileData] = useState(() =>
    normalizeProfile(readLocalJSON("profileData", {}))
  );
  const [registeredUser, setRegisteredUser] = useState(() =>
    readLocalJSON("registeredUser", {})
  );
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [errors, setErrors] = useState({});
  const [profilePhoto, setProfilePhoto] = useState(() =>
    getProfilePhotoUrl(readLocalJSON("profileData", {})) ||
    toProfilePhotoUrl(localStorage.getItem(PROFILE_PHOTO_URL_KEY))
  );
  const [uploadedPhotoPreview, setUploadedPhotoPreview] = useState("");
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [isPhotoSaving, setIsPhotoSaving] = useState(false);
  const [openProfileSelect, setOpenProfileSelect] = useState(null);
  const [diseaseSearch, setDiseaseSearch] = useState("");
  const photoInputRef = useRef(null);
  const profilePhotoObjectUrlRef = useRef("");
  const [editFormData, setEditFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    age: "",
    gender: "",
    disease: "",
    diseaseOther: "",
    relation1: "",
    contact1: "",
    relation2: "",
    contact2: "",
  });

  const displayName =
    profileData?.fullName || registeredUser?.fullName || "User";
  const displayEmail =
    profileData?.email || registeredUser?.email || "Not specified";
  const displayMobile =
    getProfileValue(profileData, registeredUser, [
      "mobile",
      "phoneNumber",
      "contactNumber",
    ]) || "Not specified";
  const displayAge = profileData?.age || "Not specified";
  const displayGender = formatLabel(profileData?.gender);
  const displayDisease = formatDiseaseDisplay(profileData?.diseaseCondition);

  const selectedDiseaseValues = useMemo(
    () => getDiseaseValues(editFormData.disease),
    [editFormData.disease]
  );
  const isOtherDiseaseSelected = selectedDiseaseValues.includes("OTHER");
  const selectedDiseaseLabels = selectedDiseaseValues.map((value) =>
    value === "OTHER" && editFormData.diseaseOther.trim()
      ? editFormData.diseaseOther.trim()
      : getDiseaseLabel(value)
  );
  const filteredDiseaseOptions = MEDICAL_CONDITION_OPTIONS.filter((option) =>
    option.label.toLowerCase().includes(diseaseSearch.trim().toLowerCase())
  );

  const completionPercent = useMemo(
    () =>
      getProfileCompletionPercent({
        ...profileData,
        fullName: displayName !== "User" ? displayName : "",
        email: displayEmail !== "Not specified" ? displayEmail : "",
        mobile: displayMobile !== "Not specified" ? displayMobile : "",
        profilePhotoUrl: getProfilePhotoUrl(profileData) || profilePhoto || "",
      }),
    [displayEmail, displayMobile, displayName, profileData, profilePhoto]
  );

  const clearProfilePhotoObjectUrl = useCallback(() => {
    if (profilePhotoObjectUrlRef.current) {
      URL.revokeObjectURL(profilePhotoObjectUrlRef.current);
      profilePhotoObjectUrlRef.current = "";
    }
  }, []);

  const setResolvedProfilePhoto = useCallback(async (profile, fallbackPhoto = "") => {
    const photoUrl = getProfilePhotoUrl(profile) || toProfilePhotoUrl(fallbackPhoto);

    if (!photoUrl) {
      clearProfilePhotoObjectUrl();
      setProfilePhoto("");
      return;
    }

    localStorage.setItem(PROFILE_PHOTO_URL_KEY, photoUrl);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(photoUrl, {
        headers: {
          Accept: "image/*,*/*;q=0.8",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`Photo request failed: ${response.status}`);
      }

      const blob = await response.blob();
      if (!blob.size) {
        throw new Error("Photo response is empty.");
      }

      if (!(await isSupportedImageBlob(blob))) {
        console.error("Profile photo URL returned non-image data", {
          url: photoUrl,
          status: response.status,
          contentType: response.headers.get("content-type"),
          size: blob.size,
        });
        throw new Error("Photo URL did not return a JPG or PNG image.");
      }

      clearProfilePhotoObjectUrl();
      const objectUrl = URL.createObjectURL(blob);
      profilePhotoObjectUrlRef.current = objectUrl;
      setProfilePhoto(objectUrl);
    } catch (error) {
      console.error("Profile photo load error:", error);
      setProfilePhoto(toProfilePhotoUrl(fallbackPhoto));
    }
  }, [clearProfilePhotoObjectUrl]);
  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const response = await api.get("/api/profile");

        if (!active) return;

        const apiProfile = response?.data || {};
        const cachedProfile = readLocalJSON("profileData", {});
        const apiPhotoUrl = getProfilePhotoUrl(apiProfile);
        const cachedPhotoUrl =
          getProfilePhotoUrl(cachedProfile) ||
          toProfilePhotoUrl(localStorage.getItem(PROFILE_PHOTO_URL_KEY));
        const mergedProfile = {
          ...cachedProfile,
          ...apiProfile,
          profilePhotoUrl: apiPhotoUrl || cachedPhotoUrl || "",
        };
        const data = normalizeProfile(mergedProfile);
        setProfileData(data);
        await setResolvedProfilePhoto(data);
        if (getProfilePhotoUrl(data)) {
          localStorage.setItem(PROFILE_PHOTO_URL_KEY, getProfilePhotoUrl(data));
        }
        localStorage.setItem("profileData", JSON.stringify(data));
        localStorage.setItem("profileCompleted", isDashboardProfileReady(data) ? "true" : "false");

        setRegisteredUser((previousUser) => {
          const basicUserData = {
            fullName: data.fullName || previousUser.fullName || "",
            email: data.email || previousUser.email || "",
            mobile: data.mobile || previousUser.mobile || "",
          };

          localStorage.setItem(
            "registeredUser",
            JSON.stringify(basicUserData)
          );

          return basicUserData;
        });
      } catch (error) {
        console.error("Profile load error:", error);
        setSaveError("Unable to load profile.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      active = false;
      clearProfilePhotoObjectUrl();
    };
  }, [clearProfilePhotoObjectUrl, setResolvedProfilePhoto]);

  const getInitials = () =>
    displayName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  const handlePhotoButtonClick = () => {
    setSaveError("");
    setSaveSuccess("");
    photoInputRef.current?.click();
  };

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!PROFILE_PHOTO_TYPES.includes(file.type)) {
      setSaveError("Only JPG and PNG images are allowed.");
      setSaveSuccess("");
      return;
    }

    if (file.size > PROFILE_PHOTO_MAX_SIZE) {
      setSaveError("Profile photo must be 5 MB or smaller.");
      setSaveSuccess("");
      return;
    }
    const uploadedPreview = await readFileAsDataUrl(file);
    const formData = new FormData();
    formData.append("file", file);

    setIsPhotoSaving(true);

    setUploadedPhotoPreview(uploadedPreview);
    setSaveError("");
    setSaveSuccess("");

    try {
      const response = await api.post("/api/profile/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const updatedProfile = normalizeProfile(response?.data || {});
      const nextPhoto = addPhotoCacheBust(getProfilePhotoUrl(updatedProfile));

      setProfileData((currentProfile) =>
        normalizeProfile({ ...(currentProfile || {}), ...updatedProfile })
      );
      await setResolvedProfilePhoto({ ...updatedProfile, profilePhotoUrl: nextPhoto }, uploadedPreview);
      if (nextPhoto) {
        localStorage.setItem(PROFILE_PHOTO_URL_KEY, nextPhoto);
      }
      localStorage.setItem("profileData", JSON.stringify({ ...updatedProfile, profilePhotoUrl: nextPhoto || getProfilePhotoUrl(updatedProfile) }));
      if (!nextPhoto) {
        setSaveError("Photo uploaded, but backend did not return profilePhotoUrl.");
        setSaveSuccess("");
        return;
      }
      setSaveSuccess("Profile photo updated successfully!");

      setTimeout(() => {
        setSaveSuccess("");
      }, 3000);
    } catch (error) {
      console.error("Profile photo upload error:", error?.response?.data || error.message);
      await setResolvedProfilePhoto(profileData);
      setUploadedPhotoPreview("");
      setSaveError(error.response?.data?.message || "Unable to upload profile photo.");
      setSaveSuccess("");
    } finally {
      setIsPhotoSaving(false);
    }
  };

  const handleDeletePhoto = async () => {
    setIsPhotoSaving(true);
    setSaveError("");
    setSaveSuccess("");

    try {
      const response = await api.delete("/api/profile/photo");
      const updatedProfile = normalizeProfile(response?.data || {});

      setProfileData((currentProfile) =>
        normalizeProfile({ ...(currentProfile || {}), ...updatedProfile, profilePhotoUrl: "" })
      );
      clearProfilePhotoObjectUrl();
      setProfilePhoto("");
      setUploadedPhotoPreview("");
      setPhotoViewerOpen(false);
      localStorage.removeItem(PROFILE_PHOTO_URL_KEY);
      localStorage.setItem("profileData", JSON.stringify({ ...updatedProfile, profilePhotoUrl: "" }));
      setSaveSuccess("Profile photo removed.");

      setTimeout(() => {
        setSaveSuccess("");
      }, 3000);
    } catch (error) {
      console.error("Profile photo delete error:", error?.response?.data || error.message);
      setSaveError(error.response?.data?.message || "Unable to delete profile photo.");
      setSaveSuccess("");
    } finally {
      setIsPhotoSaving(false);
    }
  };

  const getEditableValue = (field) => editFormData[field] || "";

  const resetEditForm = () => {
    const editableDisease = getEditableDisease(profileData?.diseaseCondition);

    setEditFormData({
      fullName: displayName !== "User" ? displayName : "",
      email: displayEmail !== "Not specified" ? displayEmail : "",
      mobile: displayMobile !== "Not specified" ? displayMobile : "",
      age: profileData?.age ?? "",
      gender: profileData?.gender ?? "",
      disease: editableDisease.disease,
      diseaseOther: editableDisease.diseaseOther,
      relation1: profileData?.contact1Relation ?? "",
      contact1: profileData?.contact1Phone ?? "",
      relation2: profileData?.contact2Relation ?? "",
      contact2: profileData?.contact2Phone ?? "",
    });
  };

  const handleEditClick = () => {
    setSaveError("");
    setSaveSuccess("");
    setErrors({});
    resetEditForm();
    setOpenProfileSelect(null);
    setIsEditing(true);
  };

  const handleInputChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const updateDiseaseSelection = (nextValues, diseaseOther = editFormData.diseaseOther) => {
    setEditFormData((prev) => ({
      ...prev,
      disease: nextValues.join(","),
      diseaseOther,
    }));

    setErrors((prev) => ({
      ...prev,
      disease: "",
      diseaseOther: "",
    }));
  };

  const handleDiseaseOptionClick = (value) => {
    if (value === NO_DISEASE_OPTION.value) {
      updateDiseaseSelection([value], "");
      setOpenProfileSelect(null);
      return;
    }

    if (value === "OTHER") {
      updateDiseaseSelection(["OTHER"], "");
      setOpenProfileSelect(null);
      return;
    }

    const currentValues = selectedDiseaseValues.filter(
      (item) => item !== NO_DISEASE_OPTION.value && item !== "OTHER"
    );
    const nextValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];

    updateDiseaseSelection(nextValues, "");
  };

  const handleDiseaseChipRemove = (value) => {
    updateDiseaseSelection(
      selectedDiseaseValues.filter((item) => item !== value),
      value === "OTHER" ? "" : editFormData.diseaseOther
    );
  };

  const handleOtherDiseaseChange = (value) => {
    setEditFormData((prev) => ({
      ...prev,
      diseaseOther: value,
    }));

    if (errors.diseaseOther) {
      setErrors((prev) => ({
        ...prev,
        diseaseOther: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const phoneRegex = /^[6-9]\d{9}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const age = Number(editFormData.age);

    if (!editFormData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!editFormData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(editFormData.email.trim())) {
      newErrors.email = "Enter a valid email address";
    }

    if (!editFormData.mobile) {
      newErrors.mobile = "Mobile number is required";
    } else if (!phoneRegex.test(editFormData.mobile)) {
      newErrors.mobile = "Enter a valid 10-digit mobile number";
    }

    if (!editFormData.age) {
      newErrors.age = "Age is required";
    } else if (Number.isNaN(age) || age <= 0 || age > 120) {
      newErrors.age = "Enter a valid age";
    }

    if (!editFormData.gender) {
      newErrors.gender = "Please select gender";
    }

    if (!editFormData.relation1) {
      newErrors.relation1 = "Please select relation";
    }

    if (!editFormData.contact1) {
      newErrors.contact1 = "Contact number is required";
    } else if (!phoneRegex.test(editFormData.contact1)) {
      newErrors.contact1 = "Enter a valid 10-digit mobile number";
    }

    if (!editFormData.relation2) {
      newErrors.relation2 = "Please select relation";
    }

    if (!editFormData.contact2) {
      newErrors.contact2 = "Contact number is required";
    } else if (!phoneRegex.test(editFormData.contact2)) {
      newErrors.contact2 = "Enter a valid 10-digit mobile number";
    }

    if (
      editFormData.contact1 &&
      editFormData.contact2 &&
      editFormData.contact1 === editFormData.contact2
    ) {
      newErrors.contact2 = "Contact numbers cannot be the same";
    }

    if (
      editFormData.relation1 &&
      editFormData.relation2 &&
      editFormData.relation1 === editFormData.relation2
    ) {
      newErrors.relation2 = "Relations cannot be the same";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveClick = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    setSaveError("");
    setSaveSuccess("");

    const payload = {
      fullName: editFormData.fullName.trim(),
      mobile: editFormData.mobile,
      age: Number(editFormData.age),
      gender: normalizeGender(editFormData.gender),
      diseaseCondition: isOtherDiseaseSelected
        ? editFormData.diseaseOther.trim()
        : editFormData.disease,
      contact1Relation: editFormData.relation1,
      contact1Phone: editFormData.contact1,
      contact2Relation: editFormData.relation2,
      contact2Phone: editFormData.contact2,
    };

    try {
      const response = await api.put("/api/profile", payload);
      const responseData = normalizeProfile(response?.data || {});
      const nextPhotoUrl = getProfilePhotoUrl(responseData) || getProfilePhotoUrl(profileData);

      const nextProfile = normalizeProfile({
        ...profileData,
        ...payload,
        ...responseData,
        profilePhotoUrl: nextPhotoUrl || profileData?.profilePhotoUrl || "",
        fullName:
          responseData.fullName || editFormData.fullName.trim() || profileData?.fullName || registeredUser?.fullName || "",
        email:
          responseData.email || editFormData.email.trim() || profileData?.email || registeredUser?.email || "",
        mobile:
          responseData.mobile || payload.mobile || profileData?.mobile || registeredUser?.mobile || "",
      });

      setProfileData(nextProfile);
      await setResolvedProfilePhoto(nextProfile, profilePhoto);
      if (getProfilePhotoUrl(nextProfile)) {
        localStorage.setItem(PROFILE_PHOTO_URL_KEY, getProfilePhotoUrl(nextProfile));
      }
      localStorage.setItem("profileData", JSON.stringify(nextProfile));

      const nextRegisteredUser = {
        fullName: nextProfile.fullName || "",
        email: nextProfile.email || "",
        mobile: nextProfile.mobile || "",
      };
      setRegisteredUser(nextRegisteredUser);
      localStorage.setItem("registeredUser", JSON.stringify(nextRegisteredUser));
      localStorage.setItem("profileCompleted", isDashboardProfileReady(nextProfile) ? "true" : "false");
      setOpenProfileSelect(null);
      setIsEditing(false);
      setSaveSuccess("Profile updated successfully!");

      setTimeout(() => {
        setSaveSuccess("");
      }, 3000);
    } catch (error) {
      console.error("Profile save error:", error);
      setSaveError(error.response?.data?.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelClick = () => {
    resetEditForm();
    setErrors({});
    setSaveError("");
    setSaveSuccess("");
    setOpenProfileSelect(null);
    setIsEditing(false);
  };

  const renderDiseaseField = () => (
    <div className="up-info-item up-disease-edit-item">
      <div className="up-icon">
        <Stethoscope size={20} />
      </div>
      <div className="up-info-content">
        <label>Disease / Condition</label>

        {isEditing ? (
          <>
            <div
              className={`up-medical-select ${
                openProfileSelect === "disease" ? "is-open" : ""
              } ${errors.disease ? "up-input-error" : ""}`}
            >
              <button
                type="button"
                className="up-medical-trigger"
                onClick={() =>
                  setOpenProfileSelect((current) =>
                    current === "disease" ? null : "disease"
                  )
                }
              >
                <span className="up-medical-trigger-content">
                  {selectedDiseaseLabels.length ? (
                    selectedDiseaseLabels.map((label, index) => (
                      <span
                        key={`${selectedDiseaseValues[index]}-${label}`}
                        className="up-medical-chip"
                      >
                        {label}
                        <span
                          role="button"
                          tabIndex={0}
                          className="up-chip-remove"
                          aria-label={`Remove ${label}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDiseaseChipRemove(selectedDiseaseValues[index]);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              event.stopPropagation();
                              handleDiseaseChipRemove(selectedDiseaseValues[index]);
                            }
                          }}
                        >
                          <X size={12} />
                        </span>
                      </span>
                    ))
                  ) : (
                    <span className="up-medical-placeholder">
                      Select disease / condition
                    </span>
                  )}
                </span>
                <ChevronDown size={16} />
              </button>

              {openProfileSelect === "disease" && (
                <div className="up-medical-menu">
                  <div className="up-medical-search">
                    <Search size={14} />
                    <input
                      type="text"
                      value={diseaseSearch}
                      placeholder="Search disease / condition..."
                      onChange={(event) => setDiseaseSearch(event.target.value)}
                    />
                  </div>

                  <div className="up-medical-options">
                    {filteredDiseaseOptions.map((option) => {
                      const selected = selectedDiseaseValues.includes(option.value);

                      return (
                        <button
                          type="button"
                          key={option.value}
                          className={`up-medical-option ${
                            selected ? "selected" : ""
                          }`}
                          onClick={() => handleDiseaseOptionClick(option.value)}
                        >
                          <span className="up-medical-check">
                            {selected && <Check size={13} />}
                          </span>
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {isOtherDiseaseSelected && (
              <div className="up-other-condition">
                <label>
                  Specify Medical Condition
                </label>
                <input
                  type="text"
                  value={editFormData.diseaseOther}
                  placeholder="PCOS"
                  onChange={(event) => handleOtherDiseaseChange(event.target.value)}
                />
              </div>
            )}
          </>
        ) : (
          <p className="up-value">{displayDisease}</p>
        )}

        {errors.disease && <span className="up-error">{errors.disease}</span>}
      </div>
    </div>
  );

  const renderEditableField = (
    label,
    value,
    icon,
    editField,
    editType = "text",
    options = [],
    className = ""
  ) => (
    <div className={`up-info-item ${className}`.trim()}>
      <div className="up-icon">{icon}</div>
      <div className="up-info-content">
        <label>
          {label}
          {REQUIRED_PROFILE_LABELS.has(label) && (
            <span className="up-required-star">*</span>
          )}
        </label>

        {isEditing ? (
          editType === "select" ? (
            <div
              className={`up-custom-select ${
                openProfileSelect === editField ? "is-open" : ""
              } ${errors[editField] ? "up-input-error" : ""}`}
            >
              <button
                type="button"
                className="up-custom-select-trigger"
                onClick={() =>
                  setOpenProfileSelect((current) =>
                    current === editField ? null : editField
                  )
                }
              >
                <span>
                  {getEditableValue(editField)
                    ? formatLabel(getEditableValue(editField))
                    : `Select ${label}`}
                </span>
                <ChevronDown size={16} />
              </button>

              {openProfileSelect === editField && (
                <div className="up-custom-select-menu">
                  {options.map((option) => {
                    const selected = getEditableValue(editField) === option;

                    return (
                      <button
                        type="button"
                        key={option}
                        className={`up-custom-select-option ${
                          selected ? "selected" : ""
                        }`}
                        onClick={() => {
                          handleInputChange(editField, option);
                          setOpenProfileSelect(null);
                        }}
                      >
                        {formatLabel(option)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <input
              type={editType}
              value={getEditableValue(editField)}
              onChange={(event) => {
                const nextValue =
                  editField.includes("contact") || editField === "mobile"
                    ? event.target.value.replace(/\D/g, "")
                    : event.target.value;
                handleInputChange(editField, nextValue);
              }}
              className={`up-input-field ${
                errors[editField] ? "up-input-error" : ""
              }`}
              placeholder={`Enter ${label.toLowerCase()}`}
              maxLength={
                editField.includes("contact") || editField === "mobile"
                  ? 10
                  : undefined
              }
              min={editField === "age" ? 1 : undefined}
              max={editField === "age" ? 120 : undefined}
            />
          )
        ) : (
          <p className="up-value">{value || "Not specified"}</p>
        )}

        {errors[editField] && (
          <span className="up-error">{errors[editField]}</span>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="up-container">
        <div className="up-loading">
          <Loader2 size={32} className="spin" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="up-container">
      <div className="up-profile-shell">
        <div className="up-topbar">
          <h1 className="up-page-title">My Profile</h1>

          {!isEditing ? (
            <button className="up-edit-btn" onClick={handleEditClick}>
              <Edit2 size={16} />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="up-edit-actions">
              <button
                className="up-save-btn"
                onClick={handleSaveClick}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 size={16} className="spin" />
                ) : (
                  <Save size={16} />
                )}
                <span>{isSaving ? "Saving..." : "Save"}</span>
              </button>

              <button
                className="up-cancel-btn"
                onClick={handleCancelClick}
                disabled={isSaving}
              >
                <X size={16} />
                <span>Cancel</span>
              </button>
            </div>
          )}
        </div>

        <section className="up-profile-header">
          <div className="up-avatar-section">
            <div className="up-photo-wrap">
              <button
                type="button"
                className="up-avatar"
                onClick={() => profilePhoto && !isPhotoSaving && setPhotoViewerOpen(true)}
                aria-label={profilePhoto ? "View profile photo" : "Profile initials"}
              >
                {isPhotoSaving ? (
                  <Loader2 size={28} className="spin" />
                ) : profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt={displayName}
                    className="up-avatar-img"
                    onError={(event) => {
                      if (uploadedPhotoPreview) {
                        event.currentTarget.src = uploadedPhotoPreview;
                        return;
                      }
                      setPhotoViewerOpen(false);
                    }}
                  />
                ) : (
                  <span className="up-avatar-text">{getInitials()}</span>
                )}
              </button>

              <button
                type="button"
                className="up-photo-camera"
                onClick={handlePhotoButtonClick}
                aria-label={profilePhoto ? "Edit profile photo" : "Upload profile photo"}
                title={profilePhoto ? "Edit photo" : "Upload photo"}
              >
                <Camera size={16} />
              </button>
            </div>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="up-photo-input"
              onChange={handlePhotoChange}
            />

            <div className="up-photo-actions" aria-label="Profile photo actions">
              <button type="button" onClick={handlePhotoButtonClick} disabled={isPhotoSaving}>
                <Upload size={14} />
                <span>{isPhotoSaving ? "Uploading..." : profilePhoto ? "Edit" : "Upload"}</span>
              </button>

              {profilePhoto && (
                <>
                  <button type="button" onClick={() => setPhotoViewerOpen(true)} disabled={isPhotoSaving}>
                    <Eye size={14} />
                    <span>View</span>
                  </button>

                  <button type="button" className="up-photo-delete" onClick={handleDeletePhoto} disabled={isPhotoSaving}>
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="up-profile-header-info">
            <p className="up-profile-name">{displayName}</p>
            <div className="up-profile-meta">
              <span>
                <Mail size={14} />
                {displayEmail}
              </span>
              <span>
                <Phone size={14} />
                {displayMobile}
              </span>
            </div>
          </div>

          <div className="up-profile-status">
            <div className="up-profile-badge">
              <Shield size={14} />
              <span>{completionPercent >= 100 ? "Completed" : "Incomplete"}</span>
            </div>
            <div className="up-progress-track">
              <span style={{ width: `${completionPercent}%` }} />
            </div>
            <p>{completionPercent}% complete</p>
          </div>
        </section>

        {saveError && (
          <div className="up-message up-message-error">
            <AlertCircle size={18} />
            <span>{saveError}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="up-message up-message-success">
            <CheckCircle size={18} />
            <span>{saveSuccess}</span>
          </div>
        )}

        <div className="up-content-grid">
          <section className="up-section up-section-personal">
            <div className="up-section-header">
              <div className="up-section-header-left">
                <UserCircle size={20} />
                <h2>Personal Information</h2>
              </div>
            </div>

            <div className="up-info-grid up-info-grid-personal">
              {renderEditableField(
                "Full Name",
                displayName,
                <User size={20} />,
                "fullName"
              )}
              {renderEditableField(
                "Email Address",
                displayEmail,
                <Mail size={20} />,
                "email",
                "email"
              )}
              {renderEditableField(
                "Mobile Number",
                displayMobile,
                <Phone size={20} />,
                "mobile",
                "tel"
              )}
              {renderEditableField(
                "Age",
                displayAge,
                <Calendar size={20} />,
                "age",
                "number"
              )}
              {renderEditableField(
                "Gender",
                displayGender,
                <Users size={20} />,
                "gender",
                "select",
                ["MALE", "FEMALE", "OTHER"]
              )}
            </div>
          </section>

          <section className="up-section up-section-medical">
            <div className="up-section-header">
              <div className="up-section-header-left">
                <Heart size={20} />
                <h2>Medical Condition</h2>
              </div>
            </div>

            <div className="up-info-grid up-info-grid--full">
              {renderDiseaseField()}
            </div>
          </section>

          <section className="up-section up-section-contacts">
            <div className="up-section-header">
              <div className="up-section-header-left">
                <Phone size={20} />
                <h2>Emergency Contacts</h2>
              </div>
            </div>

            <div className="up-contacts-grid">
              <div className="up-contact-card">
                <div className="up-contact-card-header">
                  <span className="up-contact-badge">Contact 1</span>
                </div>
                <div className="up-contact-card-body">
                  {renderEditableField(
                    "Relation",
                    formatLabel(profileData?.contact1Relation),
                    <Users size={18} />,
                    "relation1",
                    "select",
                    RELATIONS
                  )}
                  {renderEditableField(
                    "Phone Number",
                    profileData?.contact1Phone,
                    <Phone size={18} />,
                    "contact1",
                    "tel"
                  )}
                </div>
              </div>

              <div className="up-contact-card">
                <div className="up-contact-card-header">
                  <span className="up-contact-badge">Contact 2</span>
                </div>
                <div className="up-contact-card-body">
                  {renderEditableField(
                    "Relation",
                    formatLabel(profileData?.contact2Relation),
                    <Users size={18} />,
                    "relation2",
                    "select",
                    RELATIONS
                  )}
                  {renderEditableField(
                    "Phone Number",
                    profileData?.contact2Phone,
                    <Phone size={18} />,
                    "contact2",
                    "tel"
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        {photoViewerOpen && profilePhoto && (
          <div className="up-photo-viewer" role="dialog" aria-modal="true" aria-label="Profile photo preview">
            <div className="up-photo-viewer-card">
              <button
                type="button"
                className="up-photo-viewer-close"
                onClick={() => setPhotoViewerOpen(false)}
                aria-label="Close profile photo preview"
              >
                <X size={18} />
              </button>
              <img
                src={profilePhoto}
                alt={`${displayName} profile`}
                onError={(event) => {
                  if (uploadedPhotoPreview) {
                    event.currentTarget.src = uploadedPhotoPreview;
                    return;
                  }
                  setPhotoViewerOpen(false);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfiles;
