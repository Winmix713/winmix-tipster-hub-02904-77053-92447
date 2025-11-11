import { useEffect } from "react";

/**
 * FocusVisible - Adds focus-visible styles for keyboard navigation
 * Improves accessibility by showing focus indicators only for keyboard users
 */
const FocusVisible = () => {
  useEffect(() => {
    // Add class when user tabs (keyboard navigation)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        document.body.classList.add("user-is-tabbing");
      }
    };

    // Remove class when user clicks (mouse navigation)
    const handleMouseDown = () => {
      document.body.classList.remove("user-is-tabbing");
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  return null;
};

export default FocusVisible;
