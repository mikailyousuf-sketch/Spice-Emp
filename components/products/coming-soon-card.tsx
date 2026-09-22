type ComingSoonCardProps = {
  spice: {
    name: string;
    image: string;
    note: string;
  };
};

export function ComingSoonCard({ spice }: ComingSoonCardProps) {
  return (
    <article className="coming-soon-card group text-center">
      <div className="coming-soon-visual">
        <span className="coming-soon-badge">Coming soon</span>
        <img
          src={spice.image}
          alt={spice.name}
          className="coming-soon-jar"
        />
      </div>

      <h3 className="display-font mt-4 text-2xl italic tracking-[-.02em]">
        {spice.name}
      </h3>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[.18em] text-white/38">
        {spice.note}
      </p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[.18em] text-[#d7b06a]">
        Coming soon
      </p>
    </article>
  );
}
