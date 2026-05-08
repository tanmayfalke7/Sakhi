import Data from "./Data";
import ThyroidForm from "./ThyroidForm";

export default function Prediction() {
  return (
    <section className="page-shell">
      <div className="container py-5">
        <div className="page-hero text-center">
          <span className="section-badge">AI-supported screening</span>
          <h1>Understand your risk before symptoms take over</h1>
          <p>
            Sakhi connects your existing ML models to a patient-friendly experience and stores every
            assessment securely in your health history.
          </p>
        </div>

        <div className="row g-4">
          <div className="col-lg-7">
            <Data />
          </div>
          <div className="col-lg-5">
            <ThyroidForm />
          </div>
        </div>
      </div>
    </section>
  );
}
