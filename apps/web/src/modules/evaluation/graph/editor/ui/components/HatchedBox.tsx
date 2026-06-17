export const HatchedBox = () => {
  return (
    <div
      className="flex flex-1 border-y-2 border-zinc-200 overflow-hidden"
      style={{
        backgroundImage: `
          repeating-linear-gradient(
            -45deg,
            transparent 0px,
            transparent 20px,
            var(--color-zinc-200) 20px,
            var(--color-zinc-200) 25px
          )
        `,
      }}
    >
      <div className="flex flex-1 items-center justify-center">
        <span className="px-2 py-1 bg-zinc-50 border-3 border-zinc-200 text-zinc-200 font-semibold">
          CHILDREN AREA
        </span>
      </div>
    </div>
  );
};
