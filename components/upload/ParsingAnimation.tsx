interface Props {
  label?: string;
}

export default function ParsingAnimation({ label = "Analyserer fagstoffet…" }: Props) {
  return (
    <div className="flex flex-col items-center gap-3.5 py-5">
      <div className="w-9 h-9 border-[3px] border-black/10 border-t-gold rounded-full animate-spin" />
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
