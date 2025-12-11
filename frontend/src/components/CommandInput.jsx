import React, { useState, useRef, useEffect } from "react";

const CommandInput = ({ onCommand, username }) => {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef(null);

  // Focus input on mount and when clicking anywhere
  useEffect(() => {
    inputRef.current?.focus();

    const handleClick = () => {
      inputRef.current?.focus();
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const handleSubmit = e => {
    e.preventDefault();

    if (input.trim()) {
      // Add to history
      setHistory(prev => [...prev, input]);
      setHistoryIndex(-1);

      // Execute command
      onCommand(input);

      // Clear input
      setInput("");
    }
  };

  const handleKeyDown = e => {
    // Arrow up - previous command
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex =
          historyIndex === -1
            ? history.length - 1
            : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
    }

    // Arrow down - next command
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= history.length) {
          setHistoryIndex(-1);
          setInput("");
        } else {
          setHistoryIndex(newIndex);
          setInput(history[newIndex]);
        }
      }
    }

    // Tab - autocomplete (future feature)
    if (e.key === "Tab") {
      e.preventDefault();
      // TODO: Implement autocomplete
    }
  };

  const promptText = username
    ? `${username}@social-terminal:~$`
    : "guest@social-terminal:~$";

  return (
    <form onSubmit={handleSubmit} className="terminal-input-container">
      <span className="terminal-prompt">{promptText}</span>
      <input
        ref={inputRef}
        type="text"
        className="terminal-input"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        spellCheck="false"
      />
    </form>
  );
};

export default CommandInput;
