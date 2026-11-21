type Props = {
  message?: string;
};

export function PolicyRefusalNotice({ message }: Props) {
  return (
    <div role="alert" className="rounded-[8px] border border-[#d3cec6] bg-[#f5f1ec] px-3.5 py-2.5 text-[12px] text-[#626260]">
      {message ?? "I can only help with educational topics related to learning, programming, and career development."}
    </div>
  );
}
