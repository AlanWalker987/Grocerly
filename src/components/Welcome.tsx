import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "./Controls";

export function Welcome({
  onContinue,
}: {
  onContinue: (name: string) => void;
}) {
  return (
    <main className="welcome">
      <section className="welcome-card" aria-labelledby="welcome-title">
        <div className="welcome-banner">
          <span className="brand">
            <span className="brand-icon">
              <Icon name="basket" size={26} />
            </span>
            Grocerly
          </span>
        </div>

        <div className="welcome-body">
          <h1 id="welcome-title">What’s your name?</h1>
          <form
            className="custom-form"
            onSubmit={(event) => {
              event.preventDefault();
              const field = event.currentTarget.elements.namedItem(
                "userName",
              ) as HTMLInputElement;
              if (!field.value.trim()) {
                field.setCustomValidity("Please enter your name.");
                field.reportValidity();
                return;
              }
              onContinue(field.value);
            }}
          >
            <label>
              Your name
              <Input
                name="userName"
                autoComplete="given-name"
                autoFocus
                required
                maxLength={80}
                onInput={(event) => event.currentTarget.setCustomValidity("")}
              />
            </label>
            <Button type="submit">
              Continue to groceries <Icon name="arrow" />
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
