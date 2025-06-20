import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect from the root (/) to the TrackPal tab (/trackpal)
  return <Redirect href="/trackpal" />;
}
