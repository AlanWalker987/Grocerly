import { useEffect, useMemo, useRef, useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Catalog } from "./components/Catalog";
import { Dialog, Icon } from "./components/Controls";
import { ShoppingList } from "./components/ShoppingList";
import { Welcome } from "./components/Welcome";
import { groceryItems } from "./data/groceries";
import { useGroceries } from "./store/groceries";

const isListRoute = () => window.location.hash === "#/list";

export default function App() {
  const [list, setList] = useState(isListRoute);
  const [category, setCategory] = useState("vegetables");
  const [query, setQuery] = useState("");
  const [confirmLogout, setConfirmLogout] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const custom = useGroceries((s) => s.custom);
  const userName = useGroceries((s) => s.userName);
  const count = useGroceries((s) => Object.keys(s.selected).length);
  const storageError = useGroceries((s) => s.storageError);
  const items = useMemo(() => [...groceryItems, ...custom], [custom]);

  useEffect(() => {
    function navigate() {
      setList(isListRoute());
      window.scrollTo(0, 0);
      document.getElementById("main")?.focus({ preventScroll: true });
    }

    window.addEventListener("hashchange", navigate);

    function focusSearch(event: KeyboardEvent) {
      if (
        event.key !== "/" ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        !searchRef.current ||
        document.querySelector("dialog[open]") ||
        !(event.target instanceof HTMLElement) ||
        event.target.closest(
          'input, textarea, select, [contenteditable="true"]',
        )
      )
        return;
      event.preventDefault();
      searchRef.current.focus();
    }

    window.addEventListener("keydown", focusSearch);

    return () => {
      window.removeEventListener("hashchange", navigate);
      window.removeEventListener("keydown", focusSearch);
    };
  }, []);

  function logout() {
    setConfirmLogout(false);
    useGroceries.getState().logout();
    window.history.replaceState(null, "", "#/");
    setList(false);
    setQuery("");
    setCategory("vegetables");
  }

  if (!userName)
    return (
      <Welcome
        onContinue={(name) => {
          window.history.replaceState(null, "", "#/");
          setList(false);
          useGroceries.getState().setUserName(name);
          requestAnimationFrame(() => document.getElementById("main")?.focus());
        }}
      />
    );

  return (
    <>
      <a
        className="skip"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Skip to content
      </a>

      <header>
        <div className="topbar">
          <a className="brand" href="#/" aria-label="Grocerly home">
            <span className="brand-icon">
              <Icon name="basket" size={26} />
            </span>
            Grocerly
          </a>
          <nav className="topnav" aria-label="Main navigation">
            <a
              href="#/"
              className={!list ? "current" : ""}
              aria-current={!list ? "page" : undefined}
            >
              Catalog
            </a>
            <a
              href="#/list"
              className={list ? "current" : ""}
              aria-current={list ? "page" : undefined}
            >
              My List
              <span className="mobile-count" aria-label={count + " selected"}>
                {count}
              </span>
            </a>
          </nav>
          {!list && (
            <div className="search">
              <Icon name="search" size={17} />
              <Input
                ref={searchRef}
                type="search"
                aria-label="Search groceries"
                aria-keyshortcuts="/"
                placeholder="Search groceries…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query ? (
                <button
                  className="clear-search"
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery("");
                    searchRef.current?.focus();
                  }}
                >
                  <Icon name="close" size={15} />
                </button>
              ) : (
                <kbd aria-hidden="true">/</kbd>
              )}
            </div>
          )}
          <a
            className="basket-link"
            href="#/list"
            aria-label={"My grocery list, " + count + " items"}
          >
            <Icon name="basket" />
            <span>{count}</span>
          </a>
          <Button
            className="logout-button"
            variant="outline"
            aria-label="Log out"
            title="Log out"
            aria-haspopup="dialog"
            onClick={() => setConfirmLogout(true)}
          >
            <LogOut aria-hidden="true" />
            <span>Log out</span>
          </Button>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="shell">
        {storageError && (
          <p role="status" className="storage-warning">
            Browser storage is unavailable. Your changes last for this session.
          </p>
        )}
        {list ? (
          <ShoppingList items={items} />
        ) : (
          <Catalog
            userName={userName}
            items={items}
            categoryId={category}
            choose={(id) => {
              setCategory(id);
              setQuery("");
            }}
            query={query}
            count={count}
          />
        )}
      </main>

      {confirmLogout && (
        <Dialog
          title="Log out of Grocerly?"
          close={() => setConfirmLogout(false)}
        >
          <p>
            Logging out will clear your saved name, shopping list, and custom
            items from this browser.
          </p>
          <div className="actions">
            <Button
              autoFocus
              variant="outline"
              onClick={() => setConfirmLogout(false)}
            >
              Keep shopping
            </Button>
            <Button variant="destructive" onClick={logout}>
              Log out
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
}
