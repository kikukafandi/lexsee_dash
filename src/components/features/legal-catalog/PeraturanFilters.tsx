export default function PeraturanFilters({
  search,
  onSearch,
  jenis,
  onJenis,
  tahun,
  onTahun,
}: {
  search: string;
  onSearch: (value: string) => void;
  jenis: string;
  onJenis: (value: string) => void;
  tahun: string;
  onTahun: (value: string) => void;
}) {
  return (
    <div className="lux-card p-4">
      <div className="grid gap-3 md:grid-cols-3">
        <input
          className="rounded-lg border border-borderGold bg-surface2 px-3 py-2 text-sm text-textHigh focus:border-gold focus:outline-none"
          placeholder="Cari judul..."
          value={search}
          onChange={(event) => onSearch(event.target.value)}
        />
        <input
          className="rounded-lg border border-borderGold bg-surface2 px-3 py-2 text-sm text-textHigh focus:border-gold focus:outline-none"
          placeholder="Jenis (UU, PP, PERPU...)"
          value={jenis}
          onChange={(event) => onJenis(event.target.value)}
        />
        <input
          className="rounded-lg border border-borderGold bg-surface2 px-3 py-2 text-sm text-textHigh focus:border-gold focus:outline-none"
          placeholder="Tahun"
          value={tahun}
          onChange={(event) => onTahun(event.target.value)}
        />
      </div>
    </div>
  );
}
