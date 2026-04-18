import { Quote } from "lucide-react";

export default function Quotes() {
  return (
    <section className="py-5 bg-white">
      <div className="container">

        <div className="row g-4">

          {/* Quote 1 */}
          <div className="col-md-6">
            <div className="quote-card p-4 h-100">
              
              <Quote className="quote-icon mb-3" />

              <p className="fs-5">
                "Your body is not a battleground. It's a place where you live,
                and it deserves your love and care."
              </p>

              <small className="text-muted">
                — Women's Health Advocate
              </small>

            </div>
          </div>

          {/* Quote 2 */}
          <div className="col-md-6">
            <div className="quote-card p-4 h-100">

              <Quote className="quote-icon mb-3" />

              <p className="fs-5">
                "Knowledge is power. Understanding PCOS is the first step to
                taking control of your health."
              </p>

              <small className="text-muted">
                — Health Expert
              </small>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}