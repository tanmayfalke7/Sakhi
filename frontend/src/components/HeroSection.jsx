import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function HeroSection({
  badge,
  title,
  description,
  image,
  primaryBtn,
  secondaryBtn
}) {
  return (
    <section className="hero-section hero-bg py-5">
      <div className="container py-5">
        <div className="row align-items-center">

          <div className="col-lg-6 p-4">

            <span className="custom-badge d-inline-flex align-items-center px-3 py-2 rounded-pill mb-4">
              <Sparkles size={16} className="me-2"/>
              {badge}
            </span>

            <h1 className="fw-bold mb-4">{title}</h1>

            <p className="text-muted fs-5 mb-4">
              {description}
            </p>

            <div className="d-flex gap-3 flex-wrap">

              {primaryBtn && (
                <Link to={primaryBtn.link} className="btn btn-primary d-flex align-items-center gap-2">
                  {primaryBtn.text}
                  <ArrowRight size={20}/>
                </Link>
              )}

              {secondaryBtn && (
                <Link to={secondaryBtn.link} className="btn btn-outline-secondary">
                  {secondaryBtn.text}
                </Link>
              )}

            </div>

          </div>

          <div className="col-lg-6 p-4 text-center">
            <img
              src={image}
              alt="hero"
              className="img-fluid rounded-4 shadow-lg"
            />
          </div>

        </div>
      </div>
    </section>
  );
}