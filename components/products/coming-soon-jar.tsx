type Props = {
  name: string;
  image: string;
  className?: string;
};

export function ComingSoonJar({ name, image, className = "" }: Props) {
  return (
    <div className={`cutout-jar ${className}`}>
      <img src={image} alt={name} className="cutout-jar-source" />
      <div className="cutout-jar-lid" aria-hidden="true" />
      <div className="cutout-jar-label" aria-hidden="true">
        <span className="cutout-jar-brand" />
        <span className="cutout-jar-rule" />
        <strong>{name}</strong>
        <span className="cutout-jar-rule cutout-jar-rule-bottom" />
        <span className="cutout-jar-monogram" />
        <small>Spices · Elevate · Everyday</small>
      </div>
    </div>
  );
}
