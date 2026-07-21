import "./UserForget.css";


import {
  FaTimes,
  FaEnvelope,
  FaPaperPlane,
} from "react-icons/fa";

import { MdLockReset } from "react-icons/md";

const UserForget = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fp-overlay">

      <div className="fp-modal">

        {/* Close Button */}
        <button className="fp-close" onClick={onClose}>
          <FaTimes />
        </button>

        {/* Icon */}

        <div className="fp-icon">
          <MdLockReset />
        </div>

        {/* Heading */}

        <h2>Forgot Password?</h2>

        <p className="fp-subtitle">
          We'll send a password reset link to your registered email.
        </p>

        {/* Divider */}

        <div className="fp-divider">
          <span></span>
          <div className="pulse"></div>
          <span></span>
        </div>

        {/* Form */}

        <form className="fp-form">

          <label>Email / Username</label>

          <div className="fp-input">

            <FaEnvelope className="input-iconn" />

            <input
              type="email"
              placeholder="Enter your email or username"
            />

          </div>

          {/* Button */}

          <button type="submit" className="fp-btn">

            <FaPaperPlane />

            Send Reset Link

          </button>

          <button
            type="button"
            className="fp-cancel"
            onClick={onClose}
          >
            Cancel
          </button>

        </form>

      </div>

    </div>
  );
};

export default UserForget;