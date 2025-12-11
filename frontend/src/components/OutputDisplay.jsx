import React, { useEffect, useRef } from "react";

const OutputDisplay = ({ output }) => {
  const outputEndRef = useRef(null);

  // Auto-scroll to bottom when new output is added
  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [output]);

  const getLineClass = type => {
    switch (type) {
      case "command":
        return "output-line command";
      case "error":
        return "output-line error";
      case "success":
        return "output-line success";
      case "info":
        return "output-line info";
      default:
        return "output-line response";
    }
  };

  return (
    <div className="terminal-output">
      {output.map((line, index) => (
        <div key={index} className={getLineClass(line.type)}>
          {line.type === "command" && <span className="prompt-symbol">$</span>}
          {line.content}
        </div>
      ))}
      <div ref={outputEndRef} />
    </div>
  );
};

export default OutputDisplay;
