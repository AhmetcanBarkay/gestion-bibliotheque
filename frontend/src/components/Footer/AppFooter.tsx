import "./AppFooter.css";

export interface FooterAction<K extends string> {
    key: K;
    label: string;
}

interface AppFooterProps<K extends string> {
    actions: FooterAction<K>[];
    activeKey?: K;
    onSelect?: (key: K) => void;
}

function AppFooter<K extends string>({ actions, activeKey, onSelect }: AppFooterProps<K>) {
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
