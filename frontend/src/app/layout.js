import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'AI Interview Prep Kit | Research, Coverage & Practice Engine',
  description: 'Structured, company-researched interview preparation kit with deterministic requirement coverage and study scheduling.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="light">
      <body className="bg-slate-50 text-slate-900 min-h-screen font-sans antialiased selection:bg-blue-600 selection:text-white">
        <AuthProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-3.5rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
