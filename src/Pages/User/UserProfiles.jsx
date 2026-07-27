import { useState, useMemo } from "react";
import {
  User,
  Calendar,
  Mail,
  Users,
  Edit2,
  Stethoscope,
} from "lucide-react";
import "./UserProfiles.css";

const UserProfiles = () => {
  const [profileData, setProfileData] = useState(() => {
    const savedProfile = localStorage.getItem("profileData");
    return savedProfile ? JSON.parse(savedProfile) : null;
  });

  const registeredUser = useMemo(() => {
    try {
      const saved = localStorage.getItem("registeredUser");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);

  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState(() => {
    const savedProfile = localStorage.getItem("profileData");
    return savedProfile ? JSON.parse(savedProfile) : {};
  });

  if (!profileData) {
    return (
      <div className="up-container">
        <div className="up-loading">Loading profile...</div>
      </div>
    );
  }

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveClick = () => {
    localStorage.setItem("profileData", JSON.stringify(editFormData));
    setProfileData(editFormData);
    setIsEditing(false);
  };

  const handleCancelClick = () => {
    setEditFormData(profileData);
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="up-container">
      <div className="up-header">
        <h1>My Profile</h1>
        <p>View and manage your personal information</p>
      </div>

      <div className="up-content">
        {/* Personal Information Section */}
        <div className="up-section">
          <div className="up-section-header">
            <h2>Personal Information</h2>
            {!isEditing ? (
              <button className="up-edit-btn" onClick={handleEditClick}>
                <Edit2 size={18} />
                Edit Profile
              </button>
            ) : (
              <div className="up-edit-actions">
                <button className="up-save-btn" onClick={handleSaveClick}>
                  Save
                </button>
                <button className="up-cancel-btn" onClick={handleCancelClick}>
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="up-info-card">
            <div className="up-info-item">
              <div className="up-icon">
                <User size={20} />
              </div>
              <div className="up-info-content">
                <label>Full Name</label>
                <p>{registeredUser?.fullName || "Not specified"}</p>
              </div>
            </div>

            <div className="up-info-item">
              <div className="up-icon">
                <Mail size={20} />
              </div>
              <div className="up-info-content">
                <label>Email</label>
                <p>{registeredUser?.email || "Not specified"}</p>
              </div>
            </div>

            <div className="up-info-item">
              <div className="up-icon">
                <Calendar size={20} />
              </div>
              <div className="up-info-content">
                <label>Age</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={editFormData.age || ""}
                    onChange={(e) => handleInputChange("age", e.target.value)}
                    className="up-input-field"
                  />
                ) : (
                  <p>{profileData.age || "Not specified"}</p>
                )}
              </div>
            </div>

            <div className="up-info-item">
              <div className="up-icon">
                <Users size={20} />
              </div>
              <div className="up-info-content">
                <label>Gender</label>
                {isEditing ? (
                  <select
                    value={editFormData.gender || ""}
                    onChange={(e) => handleInputChange("gender", e.target.value)}
                    className="up-input-field"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <p>{profileData.gender || "Not specified"}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Medical Condition Section */}
        <div className="up-section">
          <div className="up-section-header">
            <h2>Medical Condition</h2>
          </div>

          <div className="up-info-card">
            <div className="up-info-item">
              <div className="up-icon">
                <Stethoscope size={20} />
              </div>
              <div className="up-info-content">
                <label>Disease / Condition</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editFormData.disease || ""}
                    onChange={(e) => handleInputChange("disease", e.target.value)}
                    className="up-input-field"
                    placeholder="Enter your medical condition"
                  />
                ) : (
                  <p>{profileData.disease || "Not specified"}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contacts Section */}
        <div className="up-section">
          <div className="up-section-header">
            <h2>Emergency Contacts</h2>
          </div>

          <div className="up-info-card">
            <div className="up-info-item">
              <div className="up-icon">
                <Users size={20} />
              </div>
              <div className="up-info-content">
                <label>Contact 1 - {profileData.relation1 || "Relation"}</label>
                {isEditing ? (
                  <div className="up-contact-edit">
                    <select
                      value={editFormData.relation1 || ""}
                      onChange={(e) => handleInputChange("relation1", e.target.value)}
                      className="up-input-field"
                    >
                      <option value="">Select Relation</option>
                      <option>Father</option>
                      <option>Mother</option>
                      <option>Brother</option>
                      <option>Sister</option>
                      <option>Spouse</option>
                      <option>Friend</option>
                      <option>Guardian</option>
                    </select>
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={editFormData.contact1 || ""}
                      onChange={(e) => handleInputChange("contact1", e.target.value)}
                      className="up-input-field"
                      maxLength={10}
                    />
                  </div>
                ) : (
                  <p>{profileData.contact1 || "Not specified"}</p>
                )}
              </div>
            </div>

            <div className="up-info-item">
              <div className="up-icon">
                <Users size={20} />
              </div>
              <div className="up-info-content">
                <label>Contact 2 - {profileData.relation2 || "Relation"}</label>
                {isEditing ? (
                  <div className="up-contact-edit">
                    <select
                      value={editFormData.relation2 || ""}
                      onChange={(e) => handleInputChange("relation2", e.target.value)}
                      className="up-input-field"
                    >
                      <option value="">Select Relation</option>
                      <option>Father</option>
                      <option>Mother</option>
                      <option>Brother</option>
                      <option>Sister</option>
                      <option>Spouse</option>
                      <option>Friend</option>
                      <option>Guardian</option>
                    </select>
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={editFormData.contact2 || ""}
                      onChange={(e) => handleInputChange("contact2", e.target.value)}
                      className="up-input-field"
                      maxLength={10}
                    />
                  </div>
                ) : (
                  <p>{profileData.contact2 || "Not specified"}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfiles;