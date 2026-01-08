import { useRouteError, isRouteErrorResponse, Link } from "react-router-dom";
import { Header } from "../Header/Header";
import { Footer } from "../Footer/Footer";

export function RouteErrorBoundary() {
  const error = useRouteError();
  let heading = "An Unexpected Error Occurred";
  let message = "Something went wrong. Please try again later.";

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      heading = "404 - Page Not Found";
      message = "The page you are looking for does not exist.";
    } else {
      heading = `${error.status} - ${error.statusText}`;
      message =
        error.data?.message || "An error occurred while loading this page.";
    }
  }

  console.error(error);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#0d0d1a] flex items-center justify-center">
        <div className="font-sans text-[#e0e0e0] antialiased py-12 md:py-20 px-4 text-center">
          <h2 className="font-serif text-4xl font-bold mb-4 text-red-400">
            {heading}
          </h2>
          <p className="mb-6 text-lg text-gray-400">{message}</p>
          <Link
            to="/"
            className="inline-flex items-center justify-center text-lg bg-[color:var(--sf-primary)] text-[color:var(--sf-onPrimary)] px-8 py-3 rounded-[var(--sf-radius)] font-semibold shadow-[var(--sf-shadow)] transition hover:brightness-95 active:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--sf-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--sf-background)]"
          >
            Go Home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
