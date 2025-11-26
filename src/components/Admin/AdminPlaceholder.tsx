interface AdminPlaceholderProps {
  title: string;
  description?: string;
}

export const AdminPlaceholder = ({ title, description }: AdminPlaceholderProps) => (
  <div className="text-white">
    <h2 className="text-2xl font-bold mb-2">{title}</h2>
    <p className="text-gray-400">{description ?? "This section is coming soon."}</p>
  </div>
);
