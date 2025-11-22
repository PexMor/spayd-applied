import './Dialog.css';

interface ConfirmDialogProps {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
    return (
        <div className="dialog-overlay" onClick={onCancel}>
            <div className="dialog-container" onClick={(e) => e.stopPropagation()}>
                <div className="dialog-icon warning">⚠️</div>
                <div className="dialog-message">{message}</div>
                <div className="dialog-actions">
                    <button className="btn btn-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className="btn btn-danger" onClick={onConfirm} autoFocus>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

interface AlertDialogProps {
    message: string;
    onClose: () => void;
}

export function AlertDialog({ message, onClose }: AlertDialogProps) {
    return (
        <div className="dialog-overlay" onClick={onClose}>
            <div className="dialog-container" onClick={(e) => e.stopPropagation()}>
                <div className="dialog-icon info">ℹ️</div>
                <div className="dialog-message">{message}</div>
                <div className="dialog-actions">
                    <button className="btn btn-primary" onClick={onClose} autoFocus>
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}

interface ModalProps {
    title: string;
    children: import('preact').ComponentChildren;
    onClose: () => void;
}

export function Modal({ title, children, onClose }: ModalProps) {
    return (
        <div className="dialog-overlay" onClick={onClose}>
            <div className="dialog-container modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="close-button" onClick={onClose}>
                        &times;
                    </button>
                </div>
                <div className="modal-content">{children}</div>
            </div>
        </div>
    );
}
