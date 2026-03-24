import "./AppFooter.css";

interface FooterAction {
    key: string;
    label: string;
}

interface AppFooterProps {
    actions: FooterAction[];
    activeKey?: string;
    onSelect?: (key: string) => void;
}

function AppFooter({ actions, activeKey, onSelect }: AppFooterProps) {
    return (
        <footer className="app-footer">
            <div className="app-footer-content">
                {
                    actions.length > 0 ? actions.map(action => (
                        <div key={action.key} className="app-footer-item">
                            <button
                                type="button"
                                className={activeKey === action.key ? "app-footer-btn active" : "app-footer-btn"}
                                onClick={() => onSelect?.(action.key)}
                            >
                                {action.label}
                            </button>
                        </div>
                    )) : <span className="app-footer-empty">Menu</span>
                }
            </div>
        </footer>
    );
}

export default AppFooter;
