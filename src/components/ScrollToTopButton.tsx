import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

const ScrollToTopButton = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShow(true);
      } else {
        setShow(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!show) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className="fixed bottom-20 left-4 md:bottom-6 md:left-6 z-[50] w-11 h-11 md:w-12 md:h-12 rounded-full bg-primary/90 hover:bg-primary text-primary-foreground shadow-lg backdrop-blur-xs flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-90 animate-scale-in border border-primary-foreground/20 group"
    >
      <ChevronUp className="h-6 w-6 transition-transform duration-200 group-hover:-translate-y-0.5" />
    </button>
  );
};

export default ScrollToTopButton;
