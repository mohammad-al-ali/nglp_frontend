export default function SectionHeading({ title, desc }) {
  return (
    <div>
      <h2 className="text-[35px] font-bold text-foreground">{title}</h2>
      {desc && <p className="pt-2 text-lg leading-8 text-muted-foreground">{desc}</p>}
    </div>
  );
}
