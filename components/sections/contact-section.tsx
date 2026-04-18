"use client"

import { Mail, MapPin } from "lucide-react"
import { useReveal } from "@/hooks/use-reveal"
import { useState } from "react"
import { MagneticButton } from "@/components/magnetic-button"

type Status = 'idle' | 'loading' | 'success' | 'error';

export function ContactSection() {
  const { ref, isVisible } = useReveal(0.3)
  
  // 1. Keep only one state object for the form
  const [formData, setFormData] = useState({ name: "", email: "", message: "" })
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");

    // 2. Access data directly from formData
    console.log("Submitting:", formData);

    try {
      const response = await fetch("http://localhost:3000/api/v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData), // Send the whole object
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Error: ${response.status}`);
      }

      setStatus("success");
      // Reset form
      setFormData({ name: "", email: "", message: "" });
      alert("Message sent successfully!");

    } catch (err) {
      console.error(err);
      setStatus("error");
      const msg = err instanceof Error ? err.message : "Submission failed";
      alert("Error: " + msg);
    }
  };

  return (
    <section
      ref={ref}
      className="flex h-screen w-screen shrink-0 snap-start items-center px-4 pt-20 md:px-12 md:pt-0 lg:px-16"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:gap-16 lg:gap-24">
          {/* Left Side Content - Kept your existing UI */}
          <div className="flex flex-col justify-center">
             <div className={`mb-6 transition-all duration-700 md:mb-12 ${isVisible ? "translate-x-0 opacity-100" : "-translate-x-12 opacity-0"}`}>
               <h2 className="mb-2 font-sans text-4xl font-light leading-[1.05] tracking-tight text-foreground md:mb-3 md:text-7xl lg:text-8xl">
                 Let's<br />talk
               </h2>
               <p className="font-mono text-xs text-foreground/60 md:text-base">/ Get in touch</p>
             </div>
             {/* ... (rest of your contact info) */}
          </div>

          {/* Right side - Minimal form */}
          <div className="flex flex-col justify-center">
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div className={`transition-all duration-700 ${isVisible ? "translate-x-0 opacity-100" : "translate-x-16 opacity-0"}`} style={{ transitionDelay: "200ms" }}>
                <label className="mb-1 block font-mono text-xs text-foreground/60 md:mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full border-b border-foreground/30 bg-transparent py-1.5 text-sm text-foreground focus:border-foreground/50 focus:outline-none md:py-2 md:text-base"
                  placeholder="Your name"
                />
              </div>

              <div className={`transition-all duration-700 ${isVisible ? "translate-x-0 opacity-100" : "translate-x-16 opacity-0"}`} style={{ transitionDelay: "350ms" }}>
                <label className="mb-1 block font-mono text-xs text-foreground/60 md:mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full border-b border-foreground/30 bg-transparent py-1.5 text-sm text-foreground focus:border-foreground/50 focus:outline-none md:py-2 md:text-base"
                  placeholder="your@email.com"
                />
              </div>

              <div className={`transition-all duration-700 ${isVisible ? "translate-x-0 opacity-100" : "translate-x-16 opacity-0"}`} style={{ transitionDelay: "500ms" }}>
                <label className="mb-1 block font-mono text-xs text-foreground/60 md:mb-2">Message</label>
                <textarea
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  className="w-full border-b border-foreground/30 bg-transparent py-1.5 text-sm text-foreground focus:border-foreground/50 focus:outline-none md:py-2 md:text-base"
                  placeholder="Tell us about your project..."
                />
              </div>

              <div className={`transition-all duration-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"}`} style={{ transitionDelay: "650ms" }}>
                {/* 3. Ensure the button has type="submit" */}
                <MagneticButton
                  type="submit" 
                  variant="primary"
                  size="lg"
                  className="w-full disabled:opacity-50"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "Sending..." : "Send Message"}
                </MagneticButton>
                
                {status === "success" && (
                  <p className="mt-3 text-center font-mono text-sm text-green-500">Message sent successfully!</p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}