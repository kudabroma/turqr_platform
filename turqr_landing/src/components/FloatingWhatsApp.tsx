import { MessageCircle } from "lucide-react";

const FloatingWhatsApp = () => {
  return (
    <a
      href="https://wa.me/905011224211?text=Merhaba%20TurQR!%20Restoranım%20için%20QR%20menü%20hakkında%20bilgi%20almak%20istiyorum."
      target="_blank"
      rel="noopener noreferrer"
      className="
        fixed 
        bottom-6 
        right-6 
        z-50
        w-14 
        h-14 
        rounded-full 
        bg-[#25D366]
        shadow-[0_10px_25px_rgba(0,0,0,0.25)]
        flex 
        items-center 
        justify-center 
        transition-all 
        duration-300
        hover:scale-110
        hover:shadow-[0_15px_35px_rgba(0,0,0,0.35)]
      "
    >
      <MessageCircle className="w-7 h-7 text-white" />
    </a>
  );
};

export default FloatingWhatsApp;