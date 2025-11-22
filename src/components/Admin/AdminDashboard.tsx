import { Page } from "../Page";

export const AdminDashboard = () => (
  <Page>
    <div className="container mx-auto">
      <h1 className="font-serif text-4xl md:text-5xl font-extrabold mb-4 text-white">
        Admin Dashboard
      </h1>
      <p className="text-gray-400">
        Welcome! Use the admin navigation to manage auctions, bid packs, and settings.
      </p>
    </div>
  </Page>
);
