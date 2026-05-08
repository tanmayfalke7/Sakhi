import { CalendarDays, HeartPulse, MessageSquareText } from "lucide-react";

export default function ContactPage() {
  return (
    <section className="page-shell">
      <div className="container py-5">
        <div className="page-hero text-center">
          <span className="section-badge">Support and consultation</span>
          <h1>Reach the Sakhi care team</h1>
          <p>
            This MVP supports one doctor, so every consultation request, follow-up note, and patient
            journey is managed through a single coordinated care flow.
          </p>
        </div>

        <div className="row g-4">
          <div className="col-lg-4">
            <div className="panel-card h-100">
              <CalendarDays className="mb-3 text-primary" />
              <h3 className="panel-title">Book a consultation</h3>
              <p className="panel-subtitle">Use your patient dashboard to request an online or clinic slot.</p>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="panel-card h-100">
              <MessageSquareText className="mb-3 text-primary" />
              <h3 className="panel-title">Doctor portal</h3>
              <p className="panel-subtitle">For the current MVP, the assigned doctor manages approvals and notes centrally.</p>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="panel-card h-100">
              <HeartPulse className="mb-3 text-primary" />
              <h3 className="panel-title">Care philosophy</h3>
              <p className="panel-subtitle">Sakhi is built to support awareness, early action, and compassionate follow-through.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
