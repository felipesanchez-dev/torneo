import { Redirect } from 'expo-router';

export default function Index() {
  // Redirecciona automáticamente a la página de login
  return <Redirect href="./pages/versus" />;
}