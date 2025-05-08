import BarcodeScanner from './components/BarcodeScanner';

export default function Home() {
  return (
    <main className="flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-4">Mobile Barcode POC</h1>
      <BarcodeScanner />
    </main>
  );
}