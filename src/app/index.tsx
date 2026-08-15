import { Redirect } from 'expo-router';
import { useOnboarding } from '@/core/onboarding/store';

/** Root entry → onboarding until complete, then the Home tab. */
export default function Index() {
  const hydrated = useOnboarding((s) => s.hydrated);
  const hasOnboarded = useOnboarding((s) => s.hasOnboarded);

  if (!hydrated) return null;
  return <Redirect href={hasOnboarded ? '/home' : '/onboarding/ob-welcome'} />;
}
