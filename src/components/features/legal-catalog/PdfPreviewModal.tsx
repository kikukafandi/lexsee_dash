import Modal from "@/components/ui/Modal";
import type { PeraturanItem } from "@/types";

export default function PdfPreviewModal({
  open,
  item,
  onClose,
}: {
  open: boolean;
  item: PeraturanItem | null;
  onClose: () => void;
}) {
  return (
    <Modal open={open} title={item?.judul || "PDF Preview"} onClose={onClose}>
      {item?.pdfUrl ? (
        <iframe
          className="h-[70vh] w-full rounded-lg border border-borderGold"
          src={item.pdfUrl}
        />
      ) : (
        <div className="text-sm text-textMed">PDF tidak tersedia.</div>
      )}
    </Modal>
  );
}
