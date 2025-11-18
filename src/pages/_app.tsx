import Head from 'next/head';
import { AppProps } from 'next/app';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="icon" href="/icon.png" type="image/x-icon"/>
        <title>Daily Star</title>
      </Head>
      <Component { ...pageProps } />
    </>
  );
}