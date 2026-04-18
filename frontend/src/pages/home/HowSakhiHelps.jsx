import { TrendingUp, Heart, Shield } from "lucide-react";

export default function HowSakhiHelps() {
  return (
    <section className="py-5 bg-white">
      <div className="container">

        {/* Section Heading */}
        <div className="text-center mb-5">
          <h2>How Sakhi Helps You</h2>
          <p className="text-muted fs-5">
            Comprehensive support for your PCOS journey
          </p>
        </div>

        <div className="row g-4">

          {/* Card 1 */}
          <div className="col-md-4">
            <div className="sakhi-card p-4 h-100">
              <div className="icon-circle mb-3">
                <TrendingUp size={28} />
              </div>

              <h5>Early Detection</h5>
              <p className="text-muted">
                Get accurate PCOS risk predictions using AI models. Early
                detection helps in better health management.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="col-md-4">
            <div className="sakhi-card p-4 h-100">
              <div className="icon-circle mb-3">
                <Heart size={28} />
              </div>

              <h5>Personalized Care</h5>
              <p className="text-muted">
                Receive tailored insights and lifestyle recommendations based
                on your health data.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="col-md-4">
            <div className="sakhi-card p-4 h-100">
              <div className="icon-circle mb-3">
                <Shield size={28} />
              </div>

              <h5>Safe & Supportive</h5>
              <p className="text-muted">
                Your health data is secure and private. Sakhi provides a safe
                environment for women.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}