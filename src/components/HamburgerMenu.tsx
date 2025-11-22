import { useState } from 'preact/hooks';
import { useI18n } from '../I18nContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import './HamburgerMenu.css';

interface HamburgerMenuProps {
    activeView: string;
    onNavigate: (view: string) => void;
}

export function HamburgerMenu({ activeView, onNavigate }: HamburgerMenuProps) {
    const { t } = useI18n();
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        { id: 'generate', label: t.tabGenerate, icon: '💳' },
        { id: 'accounts', label: t.tabAccounts, icon: '🏦' },
        { id: 'events', label: t.tabEvents, icon: '📅' },
        { id: 'history', label: t.tabHistory, icon: '📜' },
        { id: 'sync', label: t.tabSync, icon: '🔄' },
    ];

    const handleNavigate = (view: string) => {
        onNavigate(view);
        setIsOpen(false);
    };

    return (
        <>
            {/* Hamburger Icon - visible on mobile */}
            <button
                className={`hamburger-icon ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle menu"
            >
                <span className={`hamburger-line ${isOpen ? 'open' : ''}`}></span>
                <span className={`hamburger-line ${isOpen ? 'open' : ''}`}></span>
                <span className={`hamburger-line ${isOpen ? 'open' : ''}`}></span>
            </button>

            {/* Overlay */}
            {isOpen && (
                <div className="menu-overlay" onClick={() => setIsOpen(false)}></div>
            )}

            {/* Slide-in Menu - mobile */}
            <nav className={`slide-menu ${isOpen ? 'open' : ''}`}>
                <ul className="menu-list">
                    {menuItems.map((item) => (
                        <li key={item.id}>
                            <button
                                className={`menu-item ${activeView === item.id ? 'active' : ''}`}
                                onClick={() => handleNavigate(item.id)}
                            >
                                <span className="menu-icon">{item.icon}</span>
                                <span className="menu-label">{item.label}</span>
                            </button>
                        </li>
                    ))}
                </ul>
                <div className="menu-footer">
                    <LanguageSwitcher />
                </div>
            </nav>

            {/* Desktop Menu - horizontal */}
            <nav className="desktop-menu">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        className={`desktop-menu-item ${activeView === item.id ? 'active' : ''}`}
                        onClick={() => onNavigate(item.id)}
                    >
                        <span className="menu-icon">{item.icon}</span>
                        <span className="menu-label">{item.label}</span>
                    </button>
                ))}
                <div className="desktop-menu-separator"></div>
                <div className="desktop-menu-language">
                    <LanguageSwitcher />
                </div>
            </nav>
        </>
    );
}
