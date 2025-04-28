import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to the default category page
  redirect('/GH18');
  // Keep TS happy, though redirect() prevents rendering
  return null;
}
