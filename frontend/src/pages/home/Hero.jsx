import HeroSection from "../../components/HeroSection";

export default function Hero() {
  return (
    <HeroSection
      badge="Your Trusted Health Companion"
      title="Sakhi — Your Companion for PCOS Awareness & Prediction"
      description="Early awareness brings early control. Get fast, accurate PCOS risk prediction and comprehensive support for your health journey."
      image="/images/wellness.png"
      primaryBtn={{ text: "Predict Now", link: "/prediction" }}
      secondaryBtn={{ text: "Learn More", link: "/about-pcos" }}
    />
  );
}