import { useState } from "react";
import {
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
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
                {isEditing ? (
                  <input
                    type="text"
                    value={editFormData.fullName || "Jhon Deo"}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    className="up-input-field"
                  />
                ) : (
                  <p>Jhon Deo</p>
                )}
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
                  <p>{profileData.age || "68"}</p>
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
                  <p>{profileData.gender || "male"}</p>
                )}
              </div>
            </div>

            <div className="up-info-item">
              <div className="up-icon">
                <Phone size={20} />
              </div>
              <div className="up-info-content">
                <label>Mobile</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editFormData.mobile || "9898967770"}
                    onChange={(e) => handleInputChange("mobile", e.target.value)}
                    className="up-input-field"
                  />
                ) : (
                  <p>9898967770</p>
                )}
              </div>
            </div>

            <div className="up-info-item">
              <div className="up-icon">
                <Mail size={20} />
              </div>
              <div className="up-info-content">
                <label>Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editFormData.email || "jhon@gmail.com"}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="up-input-field"
                  />
                ) : (
                  <p>jhon@gmail.com</p>
                )}
              </div>
            </div>

            <div className="up-info-item">
              <div className="up-icon">
                <MapPin size={20} />
              </div>
              <div className="up-info-content">
                <label>Address</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editFormData.address || "Mumbai, maharastra"}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className="up-input-field"
                  />
                ) : (
                  <p>Mumbai, maharastra</p>
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
                <label>Riya (Wife)</label>
                {isEditing ? (
                  <div className="up-contact-edit">
                    <input
                      type="text"
                      placeholder="Name"
                      value={editFormData.contact1Name || "Riya"}
                      onChange={(e) => handleInputChange("contact1Name", e.target.value)}
                      className="up-input-field"
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={editFormData.contact1 || "9988664747"}
                      onChange={(e) => handleInputChange("contact1", e.target.value)}
                      className="up-input-field"
                    />
                  </div>
                ) : (
                  <p>9988664747</p>
                )}
              </div>
            </div>

            <div className="up-info-item">
              <div className="up-icon">
                <Users size={20} />
              </div>
              <div className="up-info-content">
                <label>Rohit (Son)</label>
                {isEditing ? (
                  <div className="up-contact-edit">
                    <input
                      type="text"
                      placeholder="Name"
                      value={editFormData.contact2Name || "Rohit"}
                      onChange={(e) => handleInputChange("contact2Name", e.target.value)}
                      className="up-input-field"
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={editFormData.contact2 || "9988664747"}
                      onChange={(e) => handleInputChange("contact2", e.target.value)}
                      className="up-input-field"
                    />
                  </div>
                ) : (
                  <p>9988664747</p>
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