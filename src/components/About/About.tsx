import logo from "../../assets/xbid_logo_high_res.png";
import { Link } from "react-router-dom";
export const About = () => {
  return (
    <div className="font-sans bg-[color:var(--sf-background)] text-[color:var(--sf-text)] antialiased">
      {/* Hero Section */}
      <header
        className="relative min-h-screen flex items-center justify-center text-center py-20 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1593393967840-0f0a51c7ab13?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
        }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-[color:var(--sf-background)]/95 via-[color:var(--sf-background)]/60 to-[color:var(--sf-background)]/95"></div>

        <div className="relative z-10 px-6 max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 text-left md:pr-12 mb-8 md:mb-0">
            <h1 className="font-serif text-6xl md:text-7xl font-extrabold leading-tight mb-6 bg-gradient-to-r from-[color:var(--sf-primary)] to-[color:var(--sf-accent)] bg-clip-text text-transparent">
              The Thrill of the Chase, The Pleasure of the Win.
            </h1>
            <p className="text-xl md:text-2xl text-[color:var(--sf-mutedText)] mb-8 font-light italic">
              You're not just bidding; you're indulging. The thrill, the tease,
              the tantalizing win.
            </p>
            <a
              href="/auctions"
              className="inline-block text-lg md:text-xl bg-[color:var(--sf-primary)] text-[color:var(--sf-onPrimary)] px-8 py-3 rounded-[var(--sf-radius)] font-semibold shadow-[var(--sf-shadow)] transition-all duration-300 ease-in-out hover:brightness-95 active:brightness-90 transform hover:scale-105"
            >
              Start Your Bid-venture
            </a>
          </div>
          <div className="md:w-1/2 flex justify-center items-center">
            <Link
              to="/"
              className={`flex items-center space-x-3 rtl:space-x-reverse`}
            >
              <img
                src={logo}
                alt="BidderSweet logo on a luxurious dark background"
                loading="lazy"
                decoding="async"
                width={512}
                height={512}
                className="w-full max-w-sm rounded-full shadow-2xl transition-all duration-500 ease-in-out hover:scale-105 drop-shadow-[0_0_20px_rgba(255,105,180,0.7)]"
              />
            </Link>
          </div>
        </div>
      </header>

      {/* Story Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2 flex justify-center">
            <img
              src="https://placehold.co/300x300/0d0d1a/a020f0?text=Secure"
              alt="Stylized glowing padlock representing security and tantalizing mystery"
              loading="lazy"
              decoding="async"
              width={256}
              height={256}
              className="w-64 h-64 object-contain transition-all duration-500 hover:rotate-3 drop-shadow-[0_0_15px_rgba(160,32,240,0.6)]"
            />
          </div>
          <div className="md:w-1/2 text-left">
            <h2 className="font-serif text-5xl font-extrabold mb-6 bg-gradient-to-r from-[color:var(--sf-primary)] to-[color:var(--sf-accent)] bg-clip-text text-transparent">
              Our Story: Our Tease
            </h2>
            <p className="text-lg text-[color:var(--sf-mutedText)] leading-relaxed mb-4">
              BidderSweet was born from a little whisper, a shared fantasy: What
              if bidding could be more... *personal*? We saw a world of auctions
              that were dull, distant, and devoid of desire. We yearned for a
              platform where every click was a heartbeat, every bid a delicious
              gamble.
            </p>
            <p className="text-lg text-[color:var(--sf-mutedText)] leading-relaxed">
              CEO and founder Ken Rettberg dreamed of a place where winning felt
              truly exquisite. He poured his passion into crafting BidderSweet,
              transforming the mundane into the magnificent, one tantalizing
              penny at a time.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-[color:var(--sf-surface)] via-[color:var(--sf-background)] to-[color:var(--sf-surface)] text-center">
        <h2 className="font-serif text-5xl font-extrabold mb-12 bg-gradient-to-r from-[color:var(--sf-primary)] to-[color:var(--sf-accent)] bg-clip-text text-transparent">
          Our Values: More Than Just Talk
        </h2>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {[
            {
              title: "Innovation",
              subtitle: "We're Pushing the Envelope",
              description:
                "We constantly flirt with new ideas, pushing boundaries to keep your bidding experience fresh, exciting, and utterly irresistible. Expect the unexpected!",
              icon: (
                <svg
                  className="w-24 h-24"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4.228 4.228L3.52 3.52M4 12H3m18.364 4.364l-.707-.707M17 19h-1.657M2 10.5h2m-2 3h2M21 10.5h-2m2 3h-2M15.5 12a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z"
                  ></path>
                </svg>
              ),
            },
            {
              title: "Discretion",
              subtitle: "Your Secret Is Safe",
              description:
                "What happens on BidderSweet, stays on BidderSweet. We understand the delicate nature of desire, ensuring your bids and wins are always handled with the utmost privacy.",
              icon: (
                <svg
                  className="w-24 h-24"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  ></path>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  ></path>
                </svg>
              ),
            },
            {
              title: "The Thrill",
              subtitle: "Get That Rush!",
              description:
                "Every auction is designed to deliver a heart-pounding, pulse-racing experience that culminates in the sweet ecstasy of victory.",
              icon: (
                <svg
                  className="w-24 h-24"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  ></path>
                </svg>
              ),
            },
          ].map((value) => (
            <div
              key={value.title}
              className="bg-[color:var(--sf-surface)] border border-[color:var(--sf-border)] p-8 rounded-3xl shadow-[var(--sf-shadow)] transition-all duration-300 ease-in-out hover:-translate-y-2 hover:brightness-95"
            >
              <div className="flex items-center justify-center mb-6 text-[color:var(--sf-primary)]">
                {value.icon}
              </div>
              <h3 className="font-serif text-3xl font-bold mb-2">
                {value.title}
              </h3>
              <p className="text-lg text-[color:var(--sf-primary)] italic mb-4">
                {value.subtitle}
              </p>
              <p className="text-[color:var(--sf-mutedText)]">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-6 text-center">
        <h2 className="font-serif text-5xl font-extrabold mb-4 bg-gradient-to-r from-[color:var(--sf-primary)] to-[color:var(--sf-accent)] bg-clip-text text-transparent">
          Leadership
        </h2>
        <p className="text-xl text-[color:var(--sf-mutedText)] mb-12 max-w-3xl mx-auto">
          BidderSweet is led by CEO and founder Ken Rettberg.
        </p>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {[
            {
              name: "Ken Rettberg",
              title: "CEO and Founder",
              description:
                "Ken curates every experience, ensuring each auction holds a captivating allure. His motto: 'I don't just find items, I find obsessions.'",
              img: "https://placehold.co/150x150/1a0d2e/ff69b4?text=KR",
              borderColor: "border-[color:var(--sf-border)]",
              titleColor: "text-[color:var(--sf-primary)]",
            },
          ].map((member) => (
            <div
              key={member.name}
              className="bg-[color:var(--sf-surface)] border border-[color:var(--sf-border)] p-8 rounded-3xl shadow-[var(--sf-shadow)] transition-all duration-300 ease-in-out hover:-translate-y-2 hover:brightness-95 flex flex-col items-center"
            >
              <img
                src={member.img}
                alt={`Portrait of ${member.name}`}
                loading="lazy"
                decoding="async"
                width={144}
                height={144}
                className={`w-36 h-36 rounded-full object-cover mb-6 border-4 ${member.borderColor} shadow-lg transform hover:scale-105 transition-transform duration-300`}
              />
              <h3 className="font-serif text-3xl font-bold mb-2">
                {member.name}
              </h3>
              <p className={`text-lg mb-4 font-semibold ${member.titleColor}`}>
                {member.title}
              </p>
              <p className="text-[color:var(--sf-mutedText)] text-base leading-relaxed">
                {member.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-[color:var(--sf-accent)] to-[color:var(--sf-primary)] text-center">
        <h2 className="font-serif text-5xl font-extrabold mb-8 text-[color:var(--sf-onPrimary)] drop-shadow-lg">
          Ready to Claim Your Victory?
        </h2>
        <p className="text-xl md:text-2xl text-[color:var(--sf-onPrimary)]/90 mb-10 max-w-4xl mx-auto leading-relaxed">
          The thrill awaits. Dive into the world of BidderSweet where every bid
          is an adventure and every win is pure ecstasy.
        </p>
        <a
          href="#auctions"
          className="inline-block text-2xl md:text-3xl bg-[color:var(--sf-surface)] text-[color:var(--sf-text)] px-10 py-4 rounded-[var(--sf-radius)] font-bold shadow-[var(--sf-shadow)] transition-all duration-300 ease-in-out transform hover:scale-105 hover:brightness-95"
        >
          Unleash Your Desires Now!
        </a>
      </section>

      {/* Footer */}
      <footer className="bg-[color:var(--sf-background)] py-12 px-6 text-center text-[color:var(--sf-mutedText)] text-sm border-t border-[color:var(--sf-border)]">
        <div className="max-w-6xl mx-auto">
          <p>
            &copy; {new Date().getFullYear()} BidderSweet. All rights reserved.
            Play Responsibly, Bid Enthusiastically.
          </p>
          <div className="mt-4 flex justify-center space-x-6">
            <a
              href="#privacy"
              className="hover:text-[color:var(--sf-primary)] transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="#terms"
              className="hover:text-[color:var(--sf-primary)] transition-colors"
            >
              Terms of Service
            </a>
            <a
              href="#contact"
              className="hover:text-[color:var(--sf-primary)] transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
