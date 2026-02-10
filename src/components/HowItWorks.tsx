import { Link } from "react-router-dom";
import { Page } from "./Page";

export const HowItWorks = () => {
  const steps = [
    {
      title: "Step 1: Arm Yourself",
      content: (
        <>
          <p className="mb-4 text-[color:var(--sf-mutedText)]">
            First, create your complimentary account. To play, you don't use
            cash directly. You acquire 'Bids' in packages—your currency for the
            thrill of the chase. Each move costs one Bid from your balance.
          </p>
          <ul className="list-disc pl-5 text-[color:var(--sf-mutedText)] space-y-2">
            <li>
              <span className="font-semibold text-[color:var(--sf-primary)]">
                A Taste of the Action:
              </span>{" "}
              We'll give you complimentary Bids just for joining. Your first fix
              is on us.
            </li>
            <li>
              <span className="font-semibold text-[color:var(--sf-primary)]">
                Load Up:
              </span>{" "}
              Visit our "Buy Bids" page to stock your arsenal. The larger the
              pack, the more potent your power.
            </li>
          </ul>
        </>
      ),
    },
    {
      title: "Step 2: Find Your Fixation",
      content: (
        <>
          <p className="mb-2 text-[color:var(--sf-mutedText)]">
            Explore our gallery of temptations. We feature everything from the
            latest tech and exclusive gift cards to high-end home appliances.
            Every item is untouched, in its original, factory-sealed packaging,
            waiting for a worthy winner.
          </p>
          <p className="text-[color:var(--sf-mutedText)]">
            Select an auction to reveal its details, including the current price
            and the heart-pounding countdown timer.
          </p>
        </>
      ),
    },
    {
      title: "Step 3: Make Your Move",
      content: (
        <>
          <p className="mb-4 text-[color:var(--sf-mutedText)]">
            This is where the seduction begins. Every auction features a
            countdown timer starting from as little as 10 seconds.
          </p>
          <ul className="list-disc pl-5 text-[color:var(--sf-mutedText)] space-y-2 mb-6">
            <li>
              <span className="font-semibold text-[color:var(--sf-primary)]">
                Raise the Price by a Penny:
              </span>{" "}
              A subtle move with a powerful impact.
            </li>
            <li>
              <span className="font-semibold text-[color:var(--sf-primary)]">
                Reset the Timer:
              </span>{" "}
              When you strike, the clock resets, teasing your rivals and daring
              them to challenge you.
            </li>
          </ul>
          <div className="p-6 bg-[color:var(--sf-surface)] border border-[color:var(--sf-border)] rounded-2xl shadow-[var(--sf-shadow)]">
            <h4 className="font-serif font-bold text-xl text-[color:var(--sf-accent)]">
              Pro Tip: Dominate with The Wingman
            </h4>
            <p className="text-[color:var(--sf-mutedText)]">
              Our auto-bidder is your secret weapon. Define your limit, and our
              system strategically places bids for you in the crucial final
              moments. It's the ultimate tool for securing victory while you
              maintain an aura of cool composure.
            </p>
          </div>
        </>
      ),
    },
    {
      title: "Step 4: The Ecstasy of the Score",
      content: (
        <>
          <p className="mb-4 text-[color:var(--sf-mutedText)]">
            If your bid is the last one when the timer hits zero, you've won.
            Congratulations. You've earned the right to claim your prize at its
            final, often shockingly low, auction price.
          </p>
          <div className="p-6 bg-gradient-to-br from-green-900/20 to-green-800/10 border border-green-400/50 rounded-2xl shadow-lg text-left">
            <h4 className="font-serif font-bold text-xl text-green-300">
              Example of a Win:
            </h4>
            <p className="text-[color:var(--sf-mutedText)] mb-3">
              You desire a new pair of headphones (Retail: $250). You commit 40
              bids (e.g., at $0.50 each). The clock runs out. You are the final
              bidder. The auction closes at a mere $12.34.
            </p>
            <h5 className="font-semibold text-green-300">Your Total Cost:</h5>
            <ul className="list-none text-[color:var(--sf-mutedText)] text-sm">
              <li>
                Cost of Bids Used: 40 × $0.50 ={" "}
                <strong className="text-[color:var(--sf-text)]">$20.00</strong>
              </li>
              <li>
                Final Auction Price:{" "}
                <strong className="text-[color:var(--sf-text)]">$12.34</strong>
              </li>
              <li>
                Shipping & Handling:{" "}
                <strong className="text-[color:var(--sf-text)]">$9.99</strong>
              </li>
              <li className="font-bold border-t border-green-300/50 mt-2 pt-2 text-base">
                Total You Pay: $20.00 + $12.34 + $9.99 ={" "}
                <strong className="text-[color:var(--sf-text)]">$42.33</strong>
              </li>
            </ul>
            <p className="mt-3 font-bold text-green-300 text-lg">
              You've just claimed a $250 prize for less than $43. That's the
              BidderSweet high.
            </p>
          </div>
        </>
      ),
    },
    {
      title: "The Rules of Engagement",
      content: (
        <>
          <ul className="list-disc pl-5 text-[color:var(--sf-mutedText)] space-y-3">
            <li>
              <span className="font-semibold text-[color:var(--sf-primary)]">
                Bids are Non-Refundable:
              </span>{" "}
              Every bid is a commitment. It's the price of admission to the
              game, win or lose. The thrill is in the risk.
            </li>
            <li>
              <span className="font-semibold text-[color:var(--sf-primary)]">
                This Is a Game of Strategy:
              </span>{" "}
              Victory isn't luck; it's timing, observing your rivals, and
              knowing the precise moment to strike.
            </li>
            <li>
              <span className="font-semibold text-[color:var(--sf-primary)]">
                Didn't Win? The "Morning After" Awaits:
              </span>{" "}
              Many auctions feature a 'Buy Now' option. If you don't secure the
              win, you can often apply the value of your spent Bids toward
              purchasing the item at its retail price. You never have to leave
              unsatisfied.
            </li>
          </ul>
        </>
      ),
    },
  ];

  return (
    <Page>
      <div className="container mx-auto ">
        <div className="text-center mb-12">
          <h1 className="font-serif text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-[color:var(--sf-primary)] to-[color:var(--sf-accent)] bg-clip-text text-transparent">
            The Seduction of the Steal
          </h1>
          <p className="text-lg md:text-xl text-[color:var(--sf-mutedText)]">
            Master the Art of the Win. Score Premium Goods for a Fraction of the
            Price.
          </p>
        </div>

        <div className="max-w-4xl mx-auto mb-12 text-center">
          <p className="text-[color:var(--sf-mutedText)] leading-relaxed">
            Welcome to BidderSweet. You're moments away from acquiring
            incredible deals on pristine, factory-sealed products. This isn't
            your standard auction. Here, the action is fast, the pulse is high,
            and the satisfaction of the win is exquisite. Follow our guide to
            mastering the game.
          </p>
        </div>

        {/* Accordion */}
        <div className="max-w-4xl mx-auto space-y-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-[color:var(--sf-surface)] border border-[color:var(--sf-border)] rounded-2xl overflow-hidden shadow-[var(--sf-shadow)]"
            >
              <details className="group" open={index === 0}>
                <summary className="flex items-center justify-between w-full p-6 font-semibold text-xl text-left cursor-pointer transition duration-300 group-hover:brightness-95">
                  <span className="text-[color:var(--sf-primary)]">
                    {step.title}
                  </span>
                  <svg
                    className="w-5 h-5 text-[color:var(--sf-mutedText)] transition-transform duration-300 group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </summary>
                <div className="p-6 pt-0 text-[color:var(--sf-mutedText)] leading-relaxed">
                  {step.content}
                </div>
              </details>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <Link
            to="/auctions"
            className="inline-block text-lg md:text-xl bg-[color:var(--sf-primary)] text-[color:var(--sf-onPrimary)] px-10 py-4 rounded-[var(--sf-radius)] font-bold shadow-[var(--sf-shadow)] transition-all duration-300 ease-in-out hover:brightness-95 active:brightness-90 transform hover:scale-105"
          >
            Ready to Play? Find Your First Conquest.
          </Link>
        </div>
      </div>
    </Page>
  );
};
