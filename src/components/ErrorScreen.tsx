export function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="font-sans bg-[#0d0d1a] text-red-400 text-lg text-center p-8 min-h-screen">
      {message}
    </div>
  );
}