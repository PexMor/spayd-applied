import { useState, useEffect, useCallback } from 'preact/hooks';

/**
 * HamburgerMenu component
 * - Slides in from the right
 * - Contains Config panel
 * - Prevents background scroll when open
 */
function HamburgerMenu({ isOpen, onClose, children }) {
    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Handle Escape key
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, handleKeyDown]);

    return (
        <>
            {/* Overlay */}
            <div 
                className={`hamburger-overlay ${isOpen ? 'open' : ''}`}
                onClick={onClose}
            />
            
            {/* Slide-in panel */}
            <div className={`hamburger-panel ${isOpen ? 'open' : ''}`}>
                <div className="hamburger-header">
                    <h2>⚙️ Settings</h2>
                    <button
                        onClick={onClose}
                        className="hamburger-close-btn"
                        aria-label="Close menu"
                    >
                        ✕
                    </button>
                </div>
                <div className="hamburger-content">
                    {children}
                </div>
            </div>
        </>
    );
}

/**
 * Hamburger Button (three horizontal lines)
 */
export function HamburgerButton({ onClick, isOpen }) {
    return (
        <button
            onClick={onClick}
            className={`hamburger-btn ${isOpen ? 'open' : ''}`}
            aria-label="Toggle menu"
            aria-expanded={isOpen}
        >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
        </button>
    );
}

export default HamburgerMenu;

