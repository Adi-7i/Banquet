import { IndianPatternBg } from "@/components/ui/indian-pattern-bg";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            {/* Left Side - Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-background relative">
                <div className="w-full max-w-md z-10">
                    {children}
                </div>
                {/* Subtle pattern on the white background too */}
                <IndianPatternBg pattern="floral" opacity={0.03} />
            </div>

            {/* Right Side - Decorative (Hidden on mobile) */}
            <div className="hidden lg:flex flex-1 relative bg-zinc-900 items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-900/40 mix-blend-overlay z-10" />

                {/* Main Image */}
                <img
                    src="/images/Stylized Peacock Motif.png"
                    alt="Decorative"
                    className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale-[20%]"
                />

                {/* Content Overlay */}
                <div className="relative z-20 text-center px-12 text-white">
                    <h2 className="text-4xl font-bold mb-6 font-serif">Celebrate Architecture & Culture</h2>
                    <p className="text-lg text-zinc-300 max-w-md mx-auto leading-relaxed">
                        "Experience the grandeur of India's finest banquet halls, curated for your most memorable occasions."
                    </p>
                </div>
            </div>
        </div>
    );
}
