interface Props {
  text: string;
  className?: string;
}

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

export default function Markdown({ text, className }: Props) {
  const blocks = text.split(/\n\n+/);

  return (
    <div className={className}>
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const isList = lines.some((l) => /^[\-\*] /.test(l.trim()));
        const isNumbered = lines.some((l) => /^\d+\. /.test(l.trim()));

        if (isList) {
          return (
            <ul key={i} className="list-disc pl-4 mb-2 space-y-0.5 last:mb-0">
              {lines.filter((l) => l.trim()).map((line, j) => (
                <li key={j}>{renderInline(line.replace(/^[\-\*]\s/, ""))}</li>
              ))}
            </ul>
          );
        }

        if (isNumbered) {
          return (
            <ol key={i} className="list-decimal pl-4 mb-2 space-y-0.5 last:mb-0">
              {lines.filter((l) => l.trim()).map((line, j) => (
                <li key={j}>{renderInline(line.replace(/^\d+\.\s/, ""))}</li>
              ))}
            </ol>
          );
        }

        return (
          <p key={i} className="mb-2 last:mb-0">
            {renderInline(block)}
          </p>
        );
      })}
    </div>
  );
}
