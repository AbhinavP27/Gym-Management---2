import { FiMenu, FiBell, FiSearch } from "react-icons/fi";
import "./styl/Topbar.css";

const Topbar = ({ onToggle, isMobile }) => {
  return (
    <div className="topbar">
      <div className="topbar-left">
        {isMobile && (
          <button className="topbar-menu" onClick={onToggle} aria-label="Toggle sidebar">
            <FiMenu size={20} />
          </button>
        )}
        <h2>Dashboard</h2>
      </div>

      <div className="topbar-right">
        <div className="search-box">
          <FiSearch />
          <input type="text" placeholder="Search..." />
        </div>

        <FiBell className="icon" size={20} />

        {/* <div className="profile">
          <img src="https://i.pravatar.cc/40" alt="profile" />
        </div> */}
      </div>
    </div>
  );
};

export default Topbar;
