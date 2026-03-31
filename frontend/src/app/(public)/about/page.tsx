import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Globe, Server, Cpu } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative py-20 bg-muted/30">
                <div className="container px-4 md:px-6">
                    <div className="grid gap-10 lg:grid-cols-2 items-center">
                        <div className="space-y-4">
                            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-foreground">
                                Empowering Digital Transformation with <span className="text-primary">Cynerza</span>
                            </h1>
                            <p className="max-w-[600px] text-muted-foreground md:text-xl">
                                Your strategic partner in innovative software solutions. We specialize in Unified AI Platforms, Cloud & DevOps Engineering, and IT Service Management.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2 min-[400px]:flex-row">
                                <Link href="/search">
                                    <Button size="lg" className="w-full sm:w-auto">Explore Our Venues</Button>
                                </Link>
                                <Link href="https://cynerza.com" target="_blank">
                                    <Button variant="outline" size="lg" className="w-full sm:w-auto">Visit Cynerza</Button>
                                </Link>
                            </div>
                        </div>
                        <div className="relative aspect-video rounded-xl overflow-hidden shadow-xl border bg-background/50">
                             <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                                <span className="text-muted-foreground font-medium">Cynerza Innovation Hub</span>
                             </div>
                             {/* Placeholder for a company image */}
                             <Image 
                                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop"
                                alt="Cynerza Team"
                                fill
                                className="object-cover"
                             />
                        </div>
                    </div>
                </div>
            </section>

            {/* Application Overview */}
            <section className="py-16 md:py-24">
                <div className="container px-4 md:px-6">
                     <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                        <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">About Banquet Booking System</h2>
                        <p className="max-w-[700px] text-muted-foreground md:text-lg">
                            Built with the expertise of Cynerza, this platform revolutionizes how you find and book event venues.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                         <Card>
                            <CardContent className="pt-6 space-y-4">
                                <Globe className="h-10 w-10 text-primary" />
                                <h3 className="text-xl font-bold">Unified AI Platform</h3>
                                <p className="text-muted-foreground">
                                    Leveraging Cynerza's unified ecosystem to provide intelligent search, recommendations, and analytics for both users and venue owners.
                                </p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardContent className="pt-6 space-y-4">
                                <Server className="h-10 w-10 text-primary" />
                                <h3 className="text-xl font-bold">Cloud & DevOps</h3>
                                <p className="text-muted-foreground">
                                    Built on a robust cloud infrastructure ensuring high availability, security, and seamless scalability for thousands of concurrent users.
                                </p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardContent className="pt-6 space-y-4">
                                <Cpu className="h-10 w-10 text-primary" />
                                <h3 className="text-xl font-bold">IT Service Management</h3>
                                <p className="text-muted-foreground">
                                    Integrated support ticketing and service management to ensure every booking experience is smooth and professionally handled.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Core Values / Features */}
            <section className="py-16 bg-muted/30">
                 <div className="container px-4 md:px-6">
                    <div className="grid gap-12 lg:grid-cols-2">
                        <div>
                             <h2 className="text-3xl font-bold tracking-tighter mb-4">Why Choose Us?</h2>
                             <p className="text-muted-foreground mb-6">
                                The Banquet Booking System is designed to solve the real-world challenges of event planning.
                             </p>
                             <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                                    <div>
                                        <span className="font-bold">Seamless Booking Experience</span>
                                        <p className="text-sm text-muted-foreground">From discovery to confirmation in just a few clicks.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                                    <div>
                                        <span className="font-bold">Transparent Pricing</span>
                                        <p className="text-sm text-muted-foreground">No hidden fees. Direct pricing from venue owners.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                                    <div>
                                        <span className="font-bold">Trusted Reviews</span>
                                        <p className="text-sm text-muted-foreground">Authentic feedback from real customers to help you decide.</p>
                                    </div>
                                </li>
                             </ul>
                        </div>
                        <div className="relative aspect-square md:aspect-video rounded-xl overflow-hidden bg-background border">
                            <Image 
                                src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2664&auto=format&fit=crop"
                                alt="Meeting"
                                fill
                                className="object-cover"
                             />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
