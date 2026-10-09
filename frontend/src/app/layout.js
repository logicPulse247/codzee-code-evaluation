import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'AI Interview Prep Kit | Research, Coverage & Practice Engine',
  description: 'Structured, company-researched interview preparation kit with deterministic requirement coverage and study scheduling.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[var(--background)] text-[var(--foreground)] min-h-screen font-sans antialiased selection:bg-blue-600 selection:text-white dark:bg-[#0a0a0f] dark:text-white">
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <main className="min-h-[calc(100vh-3.5rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
