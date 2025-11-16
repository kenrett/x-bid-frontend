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
      message = error.data?.message || "An error occurred while loading this page.";
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
            className="inline-block text-lg bg-[#ff69b4] text-[#1a0d2e] px-8 py-3 rounded-full font-bold transition-all duration-300 ease-in-out hover:bg-[#a020f0] hover:text-white transform hover:scale-105 shadow-lg shadow-[#ff69b4]/20"
          >
            Go Home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}