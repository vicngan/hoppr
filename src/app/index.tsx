import { Redirect } from 'expo-router';

/** Root entry → open on the Ask (mascot) tab. */
export default function Index() {
  return <Redirect href="/ask" />;
}
