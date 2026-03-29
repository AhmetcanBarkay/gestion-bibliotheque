import "./AppFooter.css";

export interface NavbarAction<K extends string> {
    key: K;
    label: string;
}

interface AppNavbarProps<K extends string> {
    actions: NavbarAction<K>[];
    activeKey?: K;
    onSelect?: (key: K) => void;
}

function AppNavbar<K extends string>({ actions, activeKey, onSelect }: AppNavbarProps<K>) {
    return (
        <nav className="app-navbar" aria-label="Navigation principale">
            <div className="app-navbar-content">
                {
                    actions.length > 0 ? actions.map(action => (
                        <div key={action.key} className="app-navbar-item">
                            <button
                                type="button"
                                className={activeKey === action.key ? "app-navbar-btn active" : "app-navbar-btn"}
                                onClick={() => onSelect?.(action.key)}
                            >
                                {action.label}
                            </button>
                        </div>
                    )) : <span className="app-navbar-empty">Menu</span>
                }
            </div>
        </nav>
    );
}

export default AppNavbar;
