import React, { useState } from "react";
import "./answer-card.css";

const AIAnswerCard = ({
  answer,
  explanation,
  color,
  won,
}: {
  answer: string;
  explanation?: string | null;
  color: string;
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
      <div className="answer-box">{answer}</div>

      {showingPopup && explanation && (
        <div className="popup">{explanation}</div>
      )}
    </div>
  );
};

export default AIAnswerCard;
