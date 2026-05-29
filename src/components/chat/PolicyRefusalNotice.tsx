type Props = {
  message?: string;
};

export function PolicyRefusalNotice({ message }: Props) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
      <span className="text-base" aria-hidden>
        📚
      </span>
      <span>
        {message ?? "I can only help with educational topics related to learning, programming, and career development."}
      </span>
    </div>
  );
}
