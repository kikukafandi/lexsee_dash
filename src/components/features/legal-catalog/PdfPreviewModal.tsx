import { Modal } from "@/components/ui/Modal";
import type { Peraturan } from "@/types";

export default function PdfPreviewModal({
  open,
  item,
  onClose,
}: {
  open: boolean;
  item: Peraturan | null;
  onClose: () => void;
}) {
  return (
    <Modal isOpen={open} title={item?.judul || "PDF Preview"} onClose={onClose}>
      {item?.pdfPath ? (
        <iframe
          className="h-full w-full border-0"
          src={item.pdfPath}
        />
      ) : (
        <div className="p-6 text-sm text-text-med">PDF tidak tersedia.</div>
      )}
    </Modal>
  );
}
