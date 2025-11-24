export const metadata = {
  title: "Bebek Motoru",
  description: "Baby face generator demo",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
        {children}
      </body>
    </html>
  );
}
