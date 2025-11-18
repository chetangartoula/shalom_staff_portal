
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getUser } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/shadcn/accordion';
import { Mail, Phone } from 'lucide-react';

export default async function SupportPage() {
    const user = await getUser();

    const faqs = [
        {
            question: "How do I create a new cost report?",
            answer: "Navigate to the 'Cost Estimator' page from the sidebar, select a trek, fill in the group details, and then proceed through the costing steps."
        },
        {
            question: "Can I edit a report after it has been saved?",
            answer: "Yes, you can edit any report by going to the 'All Reports' page and clicking the 'Edit' button on the desired report."
        },
        {
            question: "How do I add traveler details to a group?",
            answer: "From the 'All Reports' page, you can copy the 'Traveler Form Link' and send it to your clients. They can fill out their details using that link. You can view submitted details by clicking 'View Travelers'."
        },
        {
            question: "Where can I assign guides and porters?",
            answer: "You can assign team members from the 'Team Assignments' page, or by clicking 'Assign Team' from the actions menu on a specific report in the 'All Reports' page."
        }
    ];

    return (
        <DashboardLayout user={user}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Support Center</h1>
                    <p className="text-muted-foreground text-sm md:text-base">
                        Get help and find answers to your questions.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Us</CardTitle>
                            <CardDescription>Reach out to our support team directly.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Phone className="h-6 w-6 text-primary" />
                                <div>
                                    <h4 className="font-semibold">Phone Support</h4>
                                    <a href="tel:+977-9841234567" className="text-muted-foreground hover:text-primary transition-colors">+977-9841234567</a>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Mail className="h-6 w-6 text-primary" />
                                <div>
                                    <h4 className="font-semibold">Email Support</h4>
                                    <a href="mailto:support@shalom.com" className="text-muted-foreground hover:text-primary transition-colors">support@shalom.com</a>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Business Hours</CardTitle>
                            <CardDescription>Our team is available during these hours.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                             <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Sunday - Friday</span>
                                <span>10:00 AM - 6:00 PM (NPT)</span>
                            </div>
                             <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Saturday</span>
                                <span>Closed</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Frequently Asked Questions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            {faqs.map((faq, index) => (
                                <AccordionItem value={`item-${index}`} key={index}>
                                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                                    <AccordionContent>{faq.answer}</AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
