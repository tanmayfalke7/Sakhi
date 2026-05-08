import HeroSection from "../../components/HeroSection";
import authService from "../../services/authService";

export default function Hero() {
  const isLoggedIn = authService.isAuthenticated();

  return (
    <HeroSection
      badge="Your Trusted Health Companion"
      title="Sakhi - Your Companion for PCOS Awareness and Prediction"
      description="Early awareness brings early control. Get fast, accurate PCOS risk prediction and comprehensive support for your health journey."
      image="/images/wellness.png"
      primaryBtn={{ text: isLoggedIn ? "Predict Now" : "Sign Up to Start", link: isLoggedIn ? "/prediction" : "/signup" }}
      secondaryBtn={{ text: "Learn More", link: "/about-pcos" }}
    />
  );
}
