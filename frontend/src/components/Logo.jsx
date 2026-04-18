export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Lotus petals */}
        <path
          d="M24 44C24 44 10 38 10 24C10 20 12 16 14 14C16 12 20 10 24 10C28 10 32 12 34 14C36 16 38 20 38 24C38 38 24 44 24 44Z"
          stroke="#C8A2C8"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M14 14C14 14 16 8 24 8C32 8 34 14 34 14"
          stroke="#BFA2DB"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M10 24C10 24 6 22 6 18C6 14 8 12 10 12C12 12 14 14 14 18C14 20 12 22 10 24Z"
          stroke="#F9D7E6"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M38 24C38 24 42 22 42 18C42 14 40 12 38 12C36 12 34 14 34 18C34 20 36 22 38 24Z"
          stroke="#F9D7E6"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Woman silhouette */}
        <circle
          cx="24"
          cy="20"
          r="4"
          stroke="#C8A2C8"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M18 28C18 25 20.5 24 24 24C27.5 24 30 25 30 28C30 30 28 34 24 34C20 34 18 30 18 28Z"
          stroke="#C8A2C8"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>

      <span
        className="text-2xl tracking-wide"
        style={{
          fontWeight: 500,
          background: "linear-gradient(135deg, #C8A2C8 0%, #BFA2DB 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        Sakhi
      </span>
    </div>
  );
}
