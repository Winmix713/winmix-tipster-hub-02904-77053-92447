import { useEffect, useState } from "react";

interface ParallaxOrbProps {
  className?: string;
  speed?: number;
  color: "primary" | "secondary";
}

/**
 * ParallaxOrb - floating blur orb with parallax scroll effect
 */
const ParallaxOrb = ({ className = "", speed = 0.5, color }: ParallaxOrbProps) => {
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setOffsetY(window.scrollY * speed);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);

  return (
    <div
      className={`absolute rounded-full blur-3xl pointer-events-none transition-transform duration-700 ${
        color === "primary" ? "bg-primary/10" : "bg-secondary/10"
      } ${className}`}
      style={{ 
        transform: `translateY(${offsetY}px)`,
        willChange: "transform"
      }}
    />
  );
};

export default ParallaxOrb;
