import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to the beautiful welcome screen
  return <Redirect href="/WelcomeScreen" />;
}
