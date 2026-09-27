export function PaintStrokes() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none h-full w-full" aria-hidden="true">
      {/* BASE: The exact background painting provided by the user, unmuted and unblurred */}
      {/* Set to span 100% width, scale height automatically, and repeat vertically for infinite scroll */}
      <div 
        className="absolute inset-0 w-full h-full bg-[length:100%_auto] bg-repeat-y bg-top"
        style={{ backgroundImage: "url('/bg-main.jpg')" }}
      />
    </div>
  );
}
