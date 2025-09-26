import Modal from './Modal';
import Button from './Button';
import Spinner from './Spinner';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  loading?: boolean;
};

export default function ConfirmationModal({ 
  open, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
  loading = false
}: Props) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const footer = (
    <>
      <Button
        variant="ghost"
        onClick={onClose}
        disabled={loading}
      >
        {cancelText}
      </Button>
      <Button
        variant="primary"
        onClick={handleConfirm}
        disabled={loading}
        className={destructive ? "bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700" : undefined}
      >
        <div className="flex items-center">
          {loading && <Spinner size={16} />}
          {loading && <span className="ml-2">{confirmText}</span>}
          {!loading && confirmText}
        </div>
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={footer}
      footerJustify="end"
    >
      <p>{message}</p>
    </Modal>
  );
}