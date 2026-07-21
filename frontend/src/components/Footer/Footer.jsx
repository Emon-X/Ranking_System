export default function Footer() {
  return (
    <footer className="border-t bg-background py-8 text-center text-sm text-muted-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p>© {new Date().getFullYear()} Md Solaiman hossain Emon. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="mailto:mdemonhossaince23013@gmail.com" className="hover:text-foreground transition-colors">
            Contact Support
          </a>
          <a href="#" className="hover:text-foreground transition-colors">
            Terms
          </a>
          <a href="#" className="hover:text-foreground transition-colors">
            Privacy
          </a>
        </div>
      </div>
    </footer>
  );
}