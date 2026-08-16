import {
  useEffect,
  useRef,
  useState,
} from "react";

import gsap from "gsap";

import {
  FiMail,
  FiPhone,
  FiShield,
  FiEdit2,
  FiSave,
  FiX,
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
} from "react-icons/fi";

import {
  getAdminProfile,
  updateAdminProfile,
  getAdminRecentActivities,
  changeAdminPassword,
} from "../../api/AdminMockApi";

import "./AdminProfile.css";

export default function AdminProfile() {
  // =========================================================
  // REF
  // =========================================================

  const pageRef =
    useRef(null);

  // =========================================================
  // PROFILE STATE
  // =========================================================

  const [
    profile,
    setProfile,
  ] =
    useState({
      name:
        "Healthcare Admin",

      email:
        "admin@gmail.com",

      phone:
        "",

      role:
        "System Administrator",
    });

  const [
    editForm,
    setEditForm,
  ] =
    useState({
      name: "",
      phone: "",
    });

  const [
    recentActivities,
    setRecentActivities,
  ] =
    useState([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    isEditing,
    setIsEditing,
  ] =
    useState(false);

  const [
    savedMsg,
    setSavedMsg,
  ] =
    useState("");

  // =========================================================
  // PASSWORD MODAL
  // =========================================================

  const [
    showPasswordModal,
    setShowPasswordModal,
  ] =
    useState(false);

  const [
    passwordForm,
    setPasswordForm,
  ] =
    useState({
      current: "",
      new: "",
      confirm: "",
    });

  const [
    showCurrent,
    setShowCurrent,
  ] =
    useState(false);

  const [
    showNew,
    setShowNew,
  ] =
    useState(false);

  const [
    showConfirm,
    setShowConfirm,
  ] =
    useState(false);

  const [
    passwordError,
    setPasswordError,
  ] =
    useState("");

  const [
    passwordLoading,
    setPasswordLoading,
  ] =
    useState(false);

  // =========================================================
  // LOAD ADMIN PROFILE + ACTIVITY
  // =========================================================

  useEffect(() => {
    let mounted =
      true;

    const loadData =
      async () => {
        setLoading(true);

        try {
          const [
            profileResponse,
            activityResponse,
          ] =
            await Promise.all([
              getAdminProfile(),
              getAdminRecentActivities(),
            ]);

          if (!mounted) {
            return;
          }

          const profileData =
            profileResponse
              ?.data
              ?.profile || {
              name:
                "Healthcare Admin",

              email:
                "admin@gmail.com",

              phone:
                "",

              role:
                "System Administrator",
            };

          setProfile(
            profileData
          );

          setEditForm({
            name:
              profileData.name ||
              "",

            phone:
              profileData.phone ||
              "",
          });

          setRecentActivities(
            activityResponse
              ?.data
              ?.activities ||
              []
          );
        } catch (error) {
          console.error(
            "Admin profile load error:",
            error
          );
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  // =========================================================
  // GSAP
  // =========================================================

  useEffect(() => {
    if (loading) {
      return;
    }

    try {
      const ctx =
        gsap.context(
          () => {
            gsap.from(
              ".ap-header",
              {
                opacity: 0,
                y: -20,
                duration:
                  0.5,

                ease:
                  "power2.out",

                clearProps:
                  "all",
              }
            );

            gsap.from(
              ".ap-profile-card",
              {
                opacity: 0,
                y: 30,
                duration:
                  0.5,

                ease:
                  "power2.out",

                delay:
                  0.2,

                clearProps:
                  "all",
              }
            );

            gsap.from(
              ".ap-activity-card",
              {
                opacity: 0,
                y: 30,
                duration:
                  0.5,

                ease:
                  "power2.out",

                delay:
                  0.4,

                clearProps:
                  "all",
              }
            );
          },

          pageRef
        );

      return () =>
        ctx.revert();
    } catch {
      return undefined;
    }
  }, [loading]);

  // =========================================================
  // AUTO HIDE MESSAGE
  // =========================================================

  const showMessage =
    (message) => {
      setSavedMsg(
        message
      );

      window.setTimeout(
        () => {
          setSavedMsg(
            ""
          );
        },
        2500
      );
    };

  // =========================================================
  // EDIT PROFILE
  // =========================================================

  const handleEditToggle =
    () => {
      setEditForm({
        name:
          profile.name ||
          "",

        phone:
          profile.phone ||
          "",
      });

      setIsEditing(
        true
      );
    };

  const handleCancel =
    () => {
      setEditForm({
        name:
          profile.name ||
          "",

        phone:
          profile.phone ||
          "",
      });

      setIsEditing(
        false
      );
    };

  const handleChange =
    (
      field,
      value
    ) => {
      setEditForm(
        (prev) => ({
          ...prev,

          [field]:
            value,
        })
      );
    };

  // =========================================================
  // SAVE PROFILE
  // =========================================================

  const handleSave =
    async () => {
      const name =
        editForm.name.trim();

      const phone =
        editForm.phone.trim();

      if (!name) {
        showMessage(
          "Admin name is required."
        );

        return;
      }

      try {
        const response =
          await updateAdminProfile({
            name,
            phone,
          });

        const updated =
          response
            ?.data
            ?.profile;

        if (updated) {
          setProfile(
            updated
          );

          setEditForm({
            name:
              updated.name ||
              "",

            phone:
              updated.phone ||
              "",
          });
        }

        setIsEditing(
          false
        );

        showMessage(
          response
            ?.data
            ?.message ||
            "Profile updated successfully."
        );
      } catch (error) {
        console.error(
          "Admin profile update error:",
          error
        );

        showMessage(
          error
            ?.response
            ?.data
            ?.message ||
            "Unable to update profile."
        );
      }
    };

  // =========================================================
  // PASSWORD MODAL
  // =========================================================

  const openPasswordModal =
    () => {
      setPasswordForm({
        current: "",
        new: "",
        confirm: "",
      });

      setPasswordError(
        ""
      );

      setShowCurrent(
        false
      );

      setShowNew(
        false
      );

      setShowConfirm(
        false
      );

      setShowPasswordModal(
        true
      );
    };

  const closePasswordModal =
    () => {
      if (
        passwordLoading
      ) {
        return;
      }

      setShowPasswordModal(
        false
      );

      setPasswordError(
        ""
      );
    };

  const handlePasswordField =
    (
      field,
      value
    ) => {
      setPasswordForm(
        (prev) => ({
          ...prev,

          [field]:
            value,
        })
      );

      if (
        passwordError
      ) {
        setPasswordError(
          ""
        );
      }
    };

  // =========================================================
  // CHANGE PASSWORD
  // =========================================================

  const handleSavePassword =
    async () => {
      const current =
        passwordForm.current;

      const newPassword =
        passwordForm.new;

      const confirmPassword =
        passwordForm.confirm;

      if (
        !current ||
        !newPassword ||
        !confirmPassword
      ) {
        setPasswordError(
          "Please fill in all fields."
        );

        return;
      }

      if (
        newPassword.length <
        6
      ) {
        setPasswordError(
          "New password must be at least 6 characters long."
        );

        return;
      }

      if (
        newPassword ===
        current
      ) {
        setPasswordError(
          "New password must be different from current password."
        );

        return;
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        setPasswordError(
          "New password and confirm password do not match."
        );

        return;
      }

      setPasswordLoading(
        true
      );

      try {
        const response =
          await changeAdminPassword({
            currentPassword:
              current,

            newPassword,
          });

        setShowPasswordModal(
          false
        );

        setPasswordForm({
          current: "",
          new: "",
          confirm: "",
        });

        showMessage(
          response
            ?.data
            ?.message ||
            "Password changed successfully."
        );
      } catch (error) {
        setPasswordError(
          error
            ?.response
            ?.data
            ?.message ||
            error
              ?.message ||
            "Unable to change password."
        );
      } finally {
        setPasswordLoading(
          false
        );
      }
    };

  // =========================================================
  // INITIALS
  // =========================================================

  const initials =
    (
      profile.name ||
      "Healthcare Admin"
    )
      .split(" ")
      .filter(Boolean)
      .map(
        (word) =>
          word[0]
      )
      .join("")
      .slice(
        0,
        2
      )
      .toUpperCase();

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div
        className="ap-page"
        ref={pageRef}
      >
        <div className="ap-profile-card">
          Loading admin profile...
        </div>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div
      className="ap-page"
      ref={pageRef}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="ap-header">
        <div className="ap-header-left">
          <h1>
            ADMIN PROFILE
          </h1>

          <p>
            View and manage your
            administrator account
            information.
          </p>
        </div>

        <div className="ap-header-right">
          {isEditing ? (
            <>
              <button
                type="button"
                className="ap-btn-save"
                onClick={
                  handleSave
                }
              >
                <FiSave
                  size={16}
                />

                Save Changes
              </button>

              <button
                type="button"
                className="ap-btn-cancel"
                onClick={
                  handleCancel
                }
              >
                <FiX
                  size={16}
                />

                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              className="ap-btn-edit"
              onClick={
                handleEditToggle
              }
            >
              <FiEdit2
                size={16}
              />

              Edit Profile
            </button>
          )}

          <button
            type="button"
            className="ap-btn-password"
            onClick={
              openPasswordModal
            }
          >
            <FiLock
              size={16}
            />

            Change Password
          </button>
        </div>
      </div>

      {/* =====================================================
          MESSAGE
      ===================================================== */}

      {savedMsg && (
        <div className="ap-toast">
          <FiCheckCircle
            size={16}
          />

          {savedMsg}
        </div>
      )}

      {/* =====================================================
          PROFILE CARD
      ===================================================== */}

      <div className="ap-profile-card">
        <div className="ap-profile-inner">

          {/* LEFT */}

          <div className="ap-avatar-column">

            <div className="ap-avatar">
              <span>
                {initials}
              </span>
            </div>

            {isEditing ? (
              <input
                type="text"
                className="ap-input ap-name-input"
                value={
                  editForm.name
                }
                onChange={(e) =>
                  handleChange(
                    "name",
                    e.target.value
                  )
                }
              />
            ) : (
              <h2 className="ap-name">
                {
                  profile.name
                }
              </h2>
            )}

            <span className="ap-role-badge">
              {
                profile.role
              }
            </span>

          </div>

          {/* RIGHT */}

          <div className="ap-details">

            {/* EMAIL - FIXED */}

            <div className="ap-detail-item">
              <FiMail className="ap-detail-icon" />

              <div className="ap-detail-content">
                <span className="ap-detail-label">
                  Email Address
                </span>

                <span className="ap-detail-value">
                  {
                    profile.email
                  }
                </span>
              </div>
            </div>

            {/* PHONE */}

            <div className="ap-detail-item">
              <FiPhone className="ap-detail-icon" />

              <div className="ap-detail-content">
                <span className="ap-detail-label">
                  Mobile Number
                </span>

                {isEditing ? (
                  <input
                    type="text"
                    className="ap-input"
                    value={
                      editForm.phone
                    }
                    placeholder="Enter mobile number"
                    onChange={(e) =>
                      handleChange(
                        "phone",
                        e.target.value
                      )
                    }
                  />
                ) : (
                  <span className="ap-detail-value">
                    {
                      profile.phone ||
                      "Not added"
                    }
                  </span>
                )}
              </div>
            </div>

            {/* ROLE - FIXED */}

            <div className="ap-detail-item">
              <FiShield className="ap-detail-icon" />

              <div className="ap-detail-content">
                <span className="ap-detail-label">
                  Role
                </span>

                <span className="ap-detail-value">
                  {
                    profile.role
                  }
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* =====================================================
          RECENT ACTIVITY
      ===================================================== */}

      <div className="ap-activity-card">
        <h3 className="ap-section-title">
          Recent Activity
        </h3>

        <div className="ap-activity-list">

          {recentActivities.length ===
          0 ? (
            <div
              style={{
                padding:
                  "20px 0",

                color:
                  "#94A3B8",

                fontSize:
                  "14px",
              }}
            >
              No recent activity.
            </div>
          ) : (
            recentActivities.map(
              (
                activity
              ) => (
                <div
                  className="ap-activity-item"
                  key={
                    activity.id
                  }
                >
                  <div
                    className={`ap-activity-dot ap-activity-${activity.type}`}
                  />

                  <div className="ap-activity-content">
                    <span className="ap-activity-action">
                      {
                        activity.action
                      }
                    </span>

                    <span className="ap-activity-time">
                      {
                        activity.time
                      }
                    </span>
                  </div>
                </div>
              )
            )
          )}

        </div>
      </div>

      {/* =====================================================
          CHANGE PASSWORD MODAL
      ===================================================== */}

      {showPasswordModal && (
        <div
          className="ap-modal-overlay"
          onClick={
            closePasswordModal
          }
        >
          <div
            className="ap-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            {/* HEADER */}

            <div className="ap-modal-header">
              <h2>
                Change Password
              </h2>

              <button
                type="button"
                className="ap-modal-close"
                onClick={
                  closePasswordModal
                }
              >
                <FiX
                  size={20}
                />
              </button>
            </div>

            {/* BODY */}

            <div className="ap-modal-body">

              {/* CURRENT */}

              <div className="ap-modal-field">
                <label>
                  Current Password
                </label>

                <div className="ap-password-wrap">
                  <input
                    type={
                      showCurrent
                        ? "text"
                        : "password"
                    }
                    value={
                      passwordForm.current
                    }
                    onChange={(e) =>
                      handlePasswordField(
                        "current",
                        e.target.value
                      )
                    }
                    placeholder="Enter current password"
                  />

                  <button
                    type="button"
                    className="ap-password-toggle"
                    onClick={() =>
                      setShowCurrent(
                        (prev) =>
                          !prev
                      )
                    }
                  >
                    {showCurrent ? (
                      <FiEyeOff
                        size={16}
                      />
                    ) : (
                      <FiEye
                        size={16}
                      />
                    )}
                  </button>
                </div>
              </div>

              {/* NEW */}

              <div className="ap-modal-field">
                <label>
                  New Password
                </label>

                <div className="ap-password-wrap">
                  <input
                    type={
                      showNew
                        ? "text"
                        : "password"
                    }
                    value={
                      passwordForm.new
                    }
                    onChange={(e) =>
                      handlePasswordField(
                        "new",
                        e.target.value
                      )
                    }
                    placeholder="Enter new password"
                  />

                  <button
                    type="button"
                    className="ap-password-toggle"
                    onClick={() =>
                      setShowNew(
                        (prev) =>
                          !prev
                      )
                    }
                  >
                    {showNew ? (
                      <FiEyeOff
                        size={16}
                      />
                    ) : (
                      <FiEye
                        size={16}
                      />
                    )}
                  </button>
                </div>
              </div>

              {/* CONFIRM */}

              <div className="ap-modal-field">
                <label>
                  Confirm New Password
                </label>

                <div className="ap-password-wrap">
                  <input
                    type={
                      showConfirm
                        ? "text"
                        : "password"
                    }
                    value={
                      passwordForm.confirm
                    }
                    onChange={(e) =>
                      handlePasswordField(
                        "confirm",
                        e.target.value
                      )
                    }
                    placeholder="Confirm new password"
                  />

                  <button
                    type="button"
                    className="ap-password-toggle"
                    onClick={() =>
                      setShowConfirm(
                        (prev) =>
                          !prev
                      )
                    }
                  >
                    {showConfirm ? (
                      <FiEyeOff
                        size={16}
                      />
                    ) : (
                      <FiEye
                        size={16}
                      />
                    )}
                  </button>
                </div>
              </div>

              {/* ERROR */}

              {passwordError && (
                <div className="ap-password-error">
                  {
                    passwordError
                  }
                </div>
              )}

            </div>

            {/* FOOTER */}

            <div className="ap-modal-footer">
              <button
                type="button"
                className="ap-btn-cancel"
                onClick={
                  closePasswordModal
                }
                disabled={
                  passwordLoading
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="ap-btn-save"
                onClick={
                  handleSavePassword
                }
                disabled={
                  passwordLoading
                }
              >
                {passwordLoading
                  ? "Saving..."
                  : "Save Password"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}