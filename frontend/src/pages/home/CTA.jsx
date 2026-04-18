import { Link } from "react-router-dom";

export default function CTA() {
  return (
    <section className="py-5 text-center text-white"
      style={{
        background: "linear-gradient(90deg,#C8A2C8,#BFA2DB)"
      }}
    >
      <div className="container">

        <h2 className="mb-3">
          Ready to Take Control of Your Health?
        </h2>

        <p className="mb-4">
          Join thousands of women who trust Sakhi
        </p>

        <Link
          to="/signup"
          className="btn btn-light px-4 py-2 fw-semibold"
        >
          Get Started Today
        </Link>

      </div>
    </section>
  );
}