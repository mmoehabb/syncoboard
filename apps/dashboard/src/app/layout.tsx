import "./globals.css";

export const metadata = {
  title: "Admin Dashboard | Syncoboard",
  description: "Syncoboard Admin Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
