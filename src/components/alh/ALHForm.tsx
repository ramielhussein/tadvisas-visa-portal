import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, MessageCircle } from "lucide-react";

const formSchema = z.object({
  company_name: z.string().min(2, "Company name is required"),
  contact_person: z.string().min(2, "Contact person is required"),
  email: z.string().email("Invalid email address"),
  mobile: z.string().min(10, "Valid mobile number is required"),
  community: z.string().min(2, "Community/Project is required"),
  monthly_handovers: z.string().min(1, "Please select estimated handovers"),
  tracks: z.array(z.string()).min(1, "Please select at least one track"),
  preferred_start: z.string().optional(),
  notes: z.string().optional(),
  consent: z.boolean().refine((val) => val === true, "You must agree to proceed"),
});

type FormData = z.infer<typeof formSchema>;

const ALHForm = () => {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company_name: "",
      contact_person: "",
      email: "",
      mobile: "",
      community: "",
      monthly_handovers: "",
      tracks: [],
      preferred_start: "",
      notes: "",
      consent: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      if ((window as any).gtag) {
        (window as any).gtag('event', 'form_submit_success');
      }

      const { error } = await supabase.from("alh_pilot_requests").insert({
        company_name: data.company_name,
        contact_person: data.contact_person,
        email: data.email,
        mobile: data.mobile,
        community: data.community,
        monthly_handovers: data.monthly_handovers,
        tracks: data.tracks,
        preferred_start: data.preferred_start || null,
        notes: data.notes || null,
        source: "alh-72h",
      });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Request Submitted!",
        description: "We'll contact you within 24 hours to confirm your pilot slots.",
      });
    } catch (error: any) {
      if ((window as any).gtag) {
        (window as any).gtag('event', 'form_submit_error');
      }
      toast({
        title: "Error",
        description: error.message || "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsApp = () => {
    if ((window as any).gtag) {
      (window as any).gtag('event', 'whatsapp_fallback_click');
    }
    const message = "Hi! I'm interested in the ALH × TADMAIDS 72-Hour Pilot Program.";
    window.open(`https://wa.me/971565822258?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (submitted) {
    return (
      <section id="book" className="py-20 bg-gradient-to-br from-[#27AE60]/10 to-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 bg-[#27AE60] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-[#1E1E1E] mb-4">Request Received!</h2>
          <p className="text-xl text-[#4A4A4A] mb-8">
            Thank you for your interest. Our team will contact you within 24 hours to discuss your pilot program.
          </p>
          <Button
            onClick={handleWhatsApp}
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-6 text-lg font-semibold rounded-3xl"
            size="lg"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Chat on WhatsApp
          </Button>
        </div>
      </section>
    );
  }

  const trackOptions = [
    "Pre-Handover Snagging Clean",
    "Move-In Detail Clean",
    "Welcome-Home Setup (TADACADEMY option)",
    "Buyer Perks (voucher/credit)",
    "Data Exchange (PDPL referral)",
  ];

  return (
    <section id="book" className="py-20 bg-gradient-to-br from-[#F5F7FA] to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-[#0B409C] mb-4">
            Book a 60-Day Pilot
          </h2>
          <p className="text-xl text-[#4A4A4A]">
            Choose your track(s) and we'll confirm your start window
          </p>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#1E1E1E] font-semibold">Company Name *</FormLabel>
                      <FormControl>
                        <Input {...field} className="rounded-xl border-[#B6BBC4]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_person"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#1E1E1E] font-semibold">Contact Person *</FormLabel>
                      <FormControl>
                        <Input {...field} className="rounded-xl border-[#B6BBC4]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#1E1E1E] font-semibold">Email *</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" className="rounded-xl border-[#B6BBC4]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#1E1E1E] font-semibold">Mobile *</FormLabel>
                      <FormControl>
                        <Input {...field} type="tel" className="rounded-xl border-[#B6BBC4]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="community"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#1E1E1E] font-semibold">Community / Project(s) *</FormLabel>
                    <FormControl>
                      <Input {...field} className="rounded-xl border-[#B6BBC4]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="monthly_handovers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#1E1E1E] font-semibold">Estimated Monthly Handovers *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl border-[#B6BBC4]">
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="<50">&lt;50</SelectItem>
                        <SelectItem value="50-100">50–100</SelectItem>
                        <SelectItem value="100-250">100–250</SelectItem>
                        <SelectItem value="250+">250+</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tracks"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-[#1E1E1E] font-semibold">Track(s) Interested *</FormLabel>
                    <div className="space-y-3 mt-2">
                      {trackOptions.map((track) => (
                        <FormField
                          key={track}
                          control={form.control}
                          name="tracks"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(track)}
                                  onCheckedChange={(checked) => {
                                    const updatedValue = checked
                                      ? [...(field.value || []), track]
                                      : field.value?.filter((value) => value !== track) || [];
                                    field.onChange(updatedValue);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal text-[#4A4A4A] cursor-pointer">
                                {track}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferred_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#1E1E1E] font-semibold">Preferred Start Date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" className="rounded-xl border-[#B6BBC4]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#1E1E1E] font-semibold">Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} className="rounded-xl border-[#B6BBC4]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consent"
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm text-[#4A4A4A]">
                        I agree to PDPL-compliant contact and data processing for this collaboration. *
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#F58220] hover:bg-[#F58220]/90 text-white py-6 text-lg font-semibold rounded-3xl"
                size="lg"
              >
                {isSubmitting ? "Submitting..." : "Request Pilot Slots"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
};

export default ALHForm;
