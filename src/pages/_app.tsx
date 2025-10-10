import Head from 'next/head';
import { AppProps } from 'next/app';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Daily Star</title>
      </Head>
      <Component { ...pageProps } />
    </>
  );
}