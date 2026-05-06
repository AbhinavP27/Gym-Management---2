import React from "react";
import "./styl/ComingSoon.css";

const ComingSoon = ({
  title = "Coming Soon",
  message = "We're building this page for you.",
}) => {
  return (
    <div className="coming-wrapper">
      <div className="coming-soon">
        <div className="coming-soon__badge">🚧 In Progress</div>

        <h1>{title}</h1>
        <p>{message}</p>

        <div className="coming-soon__glow" />
      </div>
    </div>
  );
};

export default ComingSoon;