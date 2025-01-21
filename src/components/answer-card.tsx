import React, { useState } from "react";
import "./answer-card.css";

const AIAnswerCard = ({
  answer,
  explanation,
  color,
  passes,
  won,
}: {
  answer: string;
  explanation?: string | null;
  color: string;
  passes: boolean | null;
  won: boolean;
}) => {
  const [showingPopup, setShowingPopup] = useState(false);

  return (
    <div
      style={{ backgroundColor: color }}
      className={`answer-card ${won ? "winner" : ""}`}
      onMouseEnter={() => setShowingPopup(true)}
      onMouseLeave={() => setShowingPopup(false)}
    >
      {passes === false && <div className="cancel-x" />}
      <div className="answer-box">{answer}</div>

      {showingPopup && explanation && (
        <div className="popup">{explanation}</div>
      )}
    </div>
  );
};

export default AIAnswerCard;
