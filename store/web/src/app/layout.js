import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata = {
  title: 'Sportsbet Studio App Store',
  description: 'Discover, install, and manage studio apps.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
