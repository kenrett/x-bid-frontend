interface AdminPlaceholderProps {
  title: string;
  description?: string;
}

export const AdminPlaceholder = ({
  title,
  description,
}: AdminPlaceholderProps) => (
  <div className="text-[color:var(--sf-text)]">
    <h2 className="text-2xl font-bold mb-2">{title}</h2>
    <p className="text-[color:var(--sf-mutedText)]">
      {description ?? "This section is coming soon."}
    </p>
  </div>
);
