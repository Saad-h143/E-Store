"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  MessageCircle,
  Mail,
  Clock,
  MapPin,
  Send,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const contactCards = [
  {
    icon: Phone,
    title: "Phone",
    lines: ["+351 924 288 509", "+351 966 283 925", "+351 920 068 814"],
    cta: { label: "Call Now", href: "tel:+351924288509" },
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    lines: ["+351 924 288 509"],
    cta: {
      label: "Chat",
      href: "https://wa.me/351924288509",
    },
  },
  {
    icon: Mail,
    title: "Email",
    lines: ["info@ezeetrading.com"],
    cta: { label: "Email", href: "mailto:info@ezeetrading.com" },
  },
  {
    icon: Clock,
    title: "Hours",
    lines: ["Mon-Fri: 9AM-6PM", "Sat: 10AM-4PM"],
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.message) {
      toast.error("Please fill in your name and message");
      return;
    }
    setSending(true);

    const text = `Hi, I'm ${form.name}.${form.email ? ` Email: ${form.email}.` : ""}${form.phone ? ` Phone: ${form.phone}.` : ""} ${form.message}`;
    const waUrl = `https://wa.me/351924288509?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");

    setSending(false);
    toast.success("Redirecting to WhatsApp...");
    setForm({ name: "", email: "", phone: "", message: "" });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-2xl mx-auto"
      >
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Contact <span className="gradient-text">Us</span>
        </h1>
        <div className="h-1 w-12 rounded-full bg-gradient-to-r from-primary to-purple-500 mt-3 mx-auto" />
        <p className="text-muted-foreground mt-3">
          We&apos;re here to help. Reach out to us through any of the channels below.
        </p>
      </motion.div>

      {/* Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {contactCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border bg-card/80 backdrop-blur-xl p-6 text-center hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
          >
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mb-4">
              <card.icon className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-semibold text-lg">{card.title}</h3>
            <div className="mt-2 space-y-0.5">
              {card.lines.map((line) => (
                <p key={line} className="text-sm text-muted-foreground">
                  {line}
                </p>
              ))}
            </div>
            {card.cta && (
              <a href={card.cta.href} target="_blank" rel="noopener noreferrer">
                <Button
                  size="sm"
                  className="mt-4 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-white cursor-pointer"
                >
                  {card.cta.label}
                </Button>
              </a>
            )}
          </motion.div>
        ))}
      </div>

      {/* Form + Map Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Message Form */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border bg-card/80 backdrop-blur-xl p-6 sm:p-8"
        >
          <h2 className="text-xl font-bold mb-1">Send us a Message</h2>
          <p className="text-sm text-muted-foreground mb-6">
            We&apos;ll respond via WhatsApp
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
                className="h-11 rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="john@example.com"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1 234 567 890"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="I'm interested in..."
                rows={5}
                className="rounded-xl"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={sending}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-white text-base cursor-pointer"
            >
              <Send className="h-4 w-4 mr-2" aria-hidden="true" />
              Send via WhatsApp
            </Button>
          </form>
        </motion.div>

        {/* Location + Map */}
        <motion.div
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-4"
        >
          {/* Location Card */}
          <div className="rounded-2xl bg-gradient-to-br from-primary to-purple-600 p-6 text-white">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Our Location</h3>
                <p className="text-white/90 mt-1">Rua Principal 123</p>
                <p className="text-white/90">4000-001 Porto, Portugal</p>
              </div>
            </div>
            <div className="mt-4 bg-white/10 rounded-xl px-4 py-2.5">
              <p className="text-sm text-white/80">
                Serving customers in 30+ countries worldwide
              </p>
            </div>
          </div>

          {/* Google Map */}
          <div className="rounded-2xl overflow-hidden border bg-card/80">
            <iframe
              title="Ezee Trading Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d48097.40456634!2d-8.6539!3d41.1496!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd2465abc4e153c1%3A0xa648d95640b114!2sPorto%2C%20Portugal!5e0!3m2!1sen!2s!4v1710000000000"
              width="100%"
              height="250"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="p-3">
              <a
                href="https://maps.google.com/?q=Rua+Principal+123+Porto+Portugal"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl cursor-pointer"
                >
                  Open in Maps
                  <ExternalLink className="h-3.5 w-3.5 ml-1.5" aria-hidden="true" />
                </Button>
              </a>
            </div>
          </div>

          {/* Immediate Help Card */}
          <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white">
            <h3 className="text-lg font-bold">Need Immediate Help?</h3>
            <p className="text-sm text-white/60 mt-1">
              Call or WhatsApp for fastest response
            </p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <a href="tel:+351924288509">
                <Button className="w-full rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-white cursor-pointer">
                  <Phone className="h-4 w-4 mr-2" aria-hidden="true" />
                  Call Now
                </Button>
              </a>
              <a
                href="https://wa.me/351924288509"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 text-white cursor-pointer">
                  <MessageCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                  WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
