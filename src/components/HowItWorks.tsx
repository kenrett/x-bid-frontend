import { Link } from "react-router-dom";

export const HowItWorks = () => {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">The Art of the Win</h1>
        <p className="text-lg text-gray-600">Score Premium, Untouched Goods for a Steal.</p>
      </div>

      <div className="max-w-3xl mx-auto mb-8">
        <p className="text-gray-700 mb-4">
          Welcome to X-Bid. You're moments away from acquiring incredible deals on pristine, factory-sealed products. This isn't your standard auction. Here, the action is fast, the pulse is high, and the satisfaction of saving is immense.
        </p>
        <p className="text-gray-700 font-semibold">
          Here’s our simple, 4-step guide to mastering the game.
        </p>
      </div>

      <div id="accordion-flush" data-accordion="collapse" data-active-classes="bg-white text-gray-900" data-inactive-classes="text-gray-500">
        {/* Step 1 */}
        <h2 id="accordion-flush-heading-1">
          <button type="button" className="flex items-center justify-between w-full py-5 font-medium rtl:text-right text-gray-500 border-b border-gray-200 gap-3" data-accordion-target="#accordion-flush-body-1" aria-expanded="true" aria-controls="accordion-flush-body-1">
            <span>Step 1: Indulge Your Desire</span>
            <svg data-accordion-icon className="w-3 h-3 rotate-180 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5 5 1 1 5"/>
            </svg>
          </button>
        </h2>
        <div id="accordion-flush-body-1" className="hidden" aria-labelledby="accordion-flush-heading-1">
          <div className="py-5 border-b border-gray-200">
            <p className="mb-2 text-gray-600">First, create your account. It's complimentary and takes only a moment. To play, you don't use cash directly. Instead, you acquire "Bids" in packages—think of them as your currency for the thrill of the chase. Each move you make costs one Bid from your balance.</p>
            <ul className="list-disc pl-5 text-gray-600 space-y-1">
              <li><span className="font-semibold">Welcome Bonus:</span> We'll give you a taste of the action with complimentary Bids just for joining.</li>
              <li><span className="font-semibold">Purchase a Bid Pack:</span> Visit our "Buy Bids" page to load up. The larger the pack, the more potent your bidding power becomes.</li>
            </ul>
          </div>
        </div>

        {/* Step 2 */}
        <h2 id="accordion-flush-heading-2">
          <button type="button" className="flex items-center justify-between w-full py-5 font-medium rtl:text-right text-gray-500 border-b border-gray-200 gap-3" data-accordion-target="#accordion-flush-body-2" aria-expanded="false" aria-controls="accordion-flush-body-2">
            <span>Step 2: Find Your Fix</span>
            <svg data-accordion-icon className="w-3 h-3 rotate-180 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5 5 1 1 5"/>
            </svg>
          </button>
        </h2>
        <div id="accordion-flush-body-2" className="hidden" aria-labelledby="accordion-flush-heading-2">
          <div className="py-5 border-b border-gray-200">
            <p className="mb-2 text-gray-600">Peruse our curated selection of desirable items. We feature everything from the latest tech and exclusive gift cards to high-end home appliances. Every item is untouched, in its original, factory-sealed packaging.</p>
            <p className="text-gray-600">Select an auction to reveal its details, including the current price and the heart-pounding countdown timer.</p>
          </div>
        </div>

        {/* Step 3 */}
        <h2 id="accordion-flush-heading-3">
          <button type="button" className="flex items-center justify-between w-full py-5 font-medium rtl:text-right text-gray-500 border-b border-gray-200 gap-3" data-accordion-target="#accordion-flush-body-3" aria-expanded="false" aria-controls="accordion-flush-body-3">
            <span>Step 3: Make Your Move</span>
            <svg data-accordion-icon className="w-3 h-3 rotate-180 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5 5 1 1 5"/>
            </svg>
          </button>
        </h2>
        <div id="accordion-flush-body-3" className="hidden" aria-labelledby="accordion-flush-heading-3">
          <div className="py-5 border-b border-gray-200">
            <p className="mb-2 text-gray-600">This is where the seduction begins. Every auction features a countdown timer starting from just 10 seconds.</p>
            <ul className="list-disc pl-5 text-gray-600 space-y-1 mb-4">
              <li><span className="font-semibold">Each Bid Raises the Price by a Penny:</span> A subtle move with a powerful impact.</li>
              <li><span className="font-semibold">Each Bid Resets the Timer:</span> When you make your move, the clock resets, giving others a moment to respond to your challenge.</li>
            </ul>
            <p className="mb-2 text-gray-600">The objective is simple: be the last one standing when time expires.</p>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800">Pro Tip: Dominate with the Wingman</h4>
              <p className="text-blue-700">Define your limit, and our system will strategically place bids for you in the crucial final moments. It's the ultimate tool for securing victory while you maintain your composure.</p>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <h2 id="accordion-flush-heading-4">
          <button type="button" className="flex items-center justify-between w-full py-5 font-medium rtl:text-right text-gray-500 border-b border-gray-200 gap-3" data-accordion-target="#accordion-flush-body-4" aria-expanded="false" aria-controls="accordion-flush-body-4">
            <span>Step 4: The Ultimate Score!</span>
            <svg data-accordion-icon className="w-3 h-3 rotate-180 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5 5 1 1 5"/>
            </svg>
          </button>
        </h2>
        <div id="accordion-flush-body-4" className="hidden" aria-labelledby="accordion-flush-heading-4">
          <div className="py-5 border-b border-gray-200">
            <p className="mb-2 text-gray-600">If your bid is the last one when the timer hits zero, you've won. Congratulations. You've earned the right to purchase the item at its final, often shockingly low, auction price.</p>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800">Example of a Win:</h4>
              <p className="text-green-700 mb-2">You desire a new pair of headphones (Retail: $250). You commit 40 bids (e.g., at $0.50 each). The clock runs out. You are the final bidder. The auction closes at a mere $12.34.</p>
              <h5 className="font-semibold text-green-800">Your Total Cost:</h5>
              <ul className="list-none text-green-700">
                <li>Cost of Bids Used: 40 × $0.50 = <strong>$20.00</strong></li>
                <li>Final Auction Price: <strong>$12.34</strong></li>
                <li>Shipping & Handling: <strong>$9.99</strong></li>
                <li className="font-bold border-t border-green-300 mt-1 pt-1">Total You Pay: $20.00 + $12.34 + $9.99 = <strong>$42.33</strong></li>
              </ul>
              <p className="mt-2 font-bold text-green-800">You've just claimed a $250 prize for less than $43.</p>
            </div>
          </div>
        </div>

        {/* Key Things to Remember */}
        <h2 id="accordion-flush-heading-5">
          <button type="button" className="flex items-center justify-between w-full py-5 font-medium rtl:text-right text-gray-500 border-b border-gray-200 gap-3" data-accordion-target="#accordion-flush-body-5" aria-expanded="false" aria-controls="accordion-flush-body-5">
            <span>Key Things to Remember</span>
            <svg data-accordion-icon className="w-3 h-3 rotate-180 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5 5 1 1 5"/>
            </svg>
          </button>
        </h2>
        <div id="accordion-flush-body-5" className="hidden" aria-labelledby="accordion-flush-heading-5">
          <div className="py-5 border-b border-gray-200">
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li><span className="font-semibold">Bids are Non-Refundable:</span> Every bid is a commitment. It's the price of admission to the game, win or lose.</li>
              <li><span className="font-semibold">This Is a Game of Strategy:</span> Victory isn't about luck; it's about timing, observing your rivals, and knowing the precise moment to strike.</li>
              <li><span className="font-semibold">Didn't Win? There's Always a Second Chance:</span> Many auctions feature a "Morning After" option. If you don't secure the win, you can often apply the value of your spent Bids toward purchasing the item at its retail price. You never have to leave unsatisfied.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="text-center mt-10">
        <Link to="/auctions" className="inline-block bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors">
          Ready to play? Find your first conquest.
        </Link>
      </div>
    </div>
  );
};