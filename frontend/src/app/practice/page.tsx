import Link from "next/link";

export default function PracticePage() {
  return (
    <div className="max-w-xl mx-auto py-28 px-8 flex flex-col items-center bg-white rounded-2xl mt-20 border border-gray-100">
      <h1 className="text-4xl font-light mb-8 text-gray-900 tracking-tight" style={{letterSpacing: '0.01em'}}>AI Practice</h1>
      <p className="text-lg text-gray-700 mb-12 text-center font-light">
        Practice with AI coming soon!
      </p>
      <Link href="/">
        <span className="inline-block accent bg-white border border-accent px-8 py-3 rounded-xl font-light hover:bg-accent hover:text-white transition-colors cursor-pointer">
          Back to Decks
        </span>
      </Link>
    </div>
  );
} 