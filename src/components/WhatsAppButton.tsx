import { MessageCircle } from "lucide-react";

export function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/60000000000"
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[oklch(0.72_0.18_155)] px-4 py-3 font-medium text-black shadow-lg shadow-[oklch(0.72_0.18_155/0.4)] transition hover:scale-105 hover:shadow-[oklch(0.72_0.18_155/0.7)]"
      aria-label="WhatsApp Support"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden sm:inline">Support</span>
    </a>
  );
}
