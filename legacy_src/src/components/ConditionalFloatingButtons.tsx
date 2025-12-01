import { useLocation } from "react-router-dom";
import { FloatingContactButton } from "./FloatingContactButton";
import { FloatingCartButton } from "./FloatingCartButton";

export const ConditionalFloatingButtons = () => {
  const location = useLocation();

  // Show cart button only on menu and order pages
  if (location.pathname === "/menu" || location.pathname === "/order") {
    return <FloatingCartButton />;
  }

  // Show phone button on all other pages (especially homepage)
  return <FloatingContactButton />;
};
