"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Phone, Mail, Clock, Video, CreditCard, CheckCircle, Star, Users, Zap } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

export default function SupportPage() {
  const { lang } = useLanguage()
  const [contactForm, setContactForm] = useState({ name: "", email: "", subject: "", message: "", priority: "medium" })

  const handleInputChange = (field: string, value: string) =>
    setContactForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Support form submitted:", contactForm)
  }

  const consultationPlans = [
    {
      id: "instant",
      name: lang === "hi" ? "तत्काल सहायता" : "Quick Help",
      price: lang === "hi" ? "₹299" : "₹299",
      duration: lang === "hi" ? "15 मिनट" : "15 min",
      description: lang === "hi" ? "तुरंत कानूनी सलाह पाएं" : "Instant legal advice",
      features: lang === "hi"
        ? ["तत्काल चैट सपोर्ट", "दस्तावेज़ की त्वरित समीक्षा", "बुनियादी कानूनी सलाह", "ईमेल सारांश"]
        : ["Instant chat support", "Quick document review", "Basic legal advice", "Email summary"],
      popular: false, icon: Zap, color: "from-orange-500 to-red-500",
    },
    {
      id: "consultation",
      name: lang === "hi" ? "विस्तृत परामर्श" : "Detailed Consultation",
      price: "₹799",
      duration: lang === "hi" ? "45 मिनट" : "45 min",
      description: lang === "hi" ? "विशेषज्ञ से विस्तृत चर्चा" : "In-depth discussion with expert",
      features: lang === "hi"
        ? ["वीडियो कॉल परामर्श", "विस्तृत दस्तावेज़ विश्लेषण", "कानूनी रणनीति सुझाव", "फॉलो-अप ईमेल", "रिकॉर्डेड सेशन"]
        : ["Video call consultation", "Detailed document analysis", "Legal strategy advice", "Follow-up email", "Recorded session"],
      popular: true, icon: Video, color: "from-blue-500 to-purple-500",
    },
    {
      id: "premium",
      name: lang === "hi" ? "प्रीमियम सेवा" : "Premium Service",
      price: "₹1,499",
      duration: lang === "hi" ? "90 मिनट" : "90 min",
      description: lang === "hi" ? "संपूर्ण कानूनी समाधान" : "Complete legal solution",
      features: lang === "hi"
        ? ["वरिष्ठ वकील से परामर्श", "संपूर्ण केस विश्लेषण", "कानूनी दस्तावेज़ तैयारी", "असीमित फॉलो-अप", "प्राथमिकता सहायता"]
        : ["Senior lawyer consultation", "Complete case analysis", "Legal document preparation", "Unlimited follow-ups", "Priority support"],
      popular: false, icon: Star, color: "from-purple-500 to-pink-500",
    },
  ]

  const supportOptions = [
    {
      title: lang === "hi" ? "लाइव चैट" : "Live Chat",
      description: lang === "hi" ? "तुरंत सहायता पाएं" : "Get instant help",
      icon: MessageSquare, availability: lang === "hi" ? "24/7 उपलब्ध" : "Available 24/7",
      action: lang === "hi" ? "चैट शुरू करें" : "Start Chat",
      iconBg: "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400",
    },
    {
      title: lang === "hi" ? "फोन सपोर्ट" : "Phone Support",
      description: lang === "hi" ? "सीधे बात करें" : "Speak directly",
      icon: Phone, availability: lang === "hi" ? "सुबह 9 - रात 9" : "9 AM - 9 PM",
      action: "+91 98765 43210",
      iconBg: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",
    },
    {
      title: lang === "hi" ? "ईमेल सपोर्ट" : "Email Support",
      description: lang === "hi" ? "विस्तृत सहायता" : "Detailed support",
      icon: Mail, availability: lang === "hi" ? "24 घंटे में जवाब" : "Reply within 24 hours",
      action: "help@legalsimplify.in",
      iconBg: "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400",
    },
  ]

  const faqItems = lang === "hi"
    ? [
        { q: "क्या मेरे दस्तावेज़ सुरक्षित हैं?", a: "हाँ, हम बैंक-स्तरीय एन्क्रिप्शन का उपयोग करते हैं और आपके दस्तावेज़ पूर्णतः सुरक्षित हैं।" },
        { q: "परामर्श कैसे बुक करें?", a: "ऊपर दिए गए प्लान में से कोई भी चुनें और 'अभी बुक करें' पर क्लिक करें।" },
        { q: "रिफंड पॉलिसी क्या है?", a: "यदि आप संतुष्ट नहीं हैं, तो 24 घंटे के भीतर पूरा रिफंड मिलेगा।" },
      ]
    : [
        { q: "Are my documents secure?", a: "Yes, we use bank-level encryption and your documents are completely secure." },
        { q: "How do I book a consultation?", a: "Choose any plan from above and click 'Book Now'." },
        { q: "What is the refund policy?", a: "If you are not satisfied, you will get a full refund within 24 hours." },
      ]

  const legalAreas = lang === "hi"
    ? ["संपत्ति कानून", "व्यापारिक कानून", "पारिवारिक कानून", "श्रम कानून"]
    : ["Property Law", "Business Law", "Family Law", "Labour Law"]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="py-8">
        <div className="max-w-6xl mx-auto text-center px-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {lang === "hi" ? "सहायता केंद्र" : "Support Centre"}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {lang === "hi" ? "हम आपकी हर समस्या का समाधान करने के लिए यहाँ हैं" : "We're here to solve every problem you have"}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Quick Support Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {supportOptions.map((option, i) => (
            <Card key={i} className="bg-white dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6 text-center">
                <div className={`inline-flex p-4 rounded-full ${option.iconBg} mb-4`}>
                  <option.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{option.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">{option.description}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">{option.availability}</p>
                <Button className="w-full dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white">{option.action}</Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Consultation Plans */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {lang === "hi" ? "तत्काल कानूनी परामर्श" : "Instant Legal Consultation"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {lang === "hi" ? "विशेषज्ञ वकीलों से तुरंत सलाह लें" : "Get instant advice from expert lawyers"}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {consultationPlans.map((plan) => (
              <Card key={plan.id} className={`bg-white dark:bg-gray-800 dark:border-gray-700 relative hover:shadow-xl transition-all duration-300 ${plan.popular ? "ring-2 ring-blue-500 scale-105" : ""}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white px-4 py-1">
                      {lang === "hi" ? "सबसे लोकप्रिय" : "Most Popular"}
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <div className={`inline-flex p-4 rounded-full bg-gradient-to-r ${plan.color} text-white mb-4 mx-auto`}>
                    <plan.icon className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-xl font-bold dark:text-white">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {plan.price}
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/{plan.duration}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className={`w-full bg-gradient-to-r ${plan.color} text-white hover:opacity-90`}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    {lang === "hi" ? "अभी बुक करें" : "Book Now"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card className="bg-white dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Mail className="h-5 w-5" />
                {lang === "hi" ? "संपर्क फॉर्म" : "Contact Form"}
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {lang === "hi" ? "अपनी समस्या विस्तार से बताएं और हम 24 घंटे में जवाब देंगे" : "Describe your issue and we'll reply within 24 hours"}
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="dark:text-gray-300">{lang === "hi" ? "नाम" : "Name"}</Label>
                    <Input placeholder={lang === "hi" ? "आपका नाम" : "Your name"} value={contactForm.name} onChange={(e) => handleInputChange("name", e.target.value)} required className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="dark:text-gray-300">{lang === "hi" ? "ईमेल" : "Email"}</Label>
                    <Input type="email" placeholder={lang === "hi" ? "आपका ईमेल" : "Your email"} value={contactForm.email} onChange={(e) => handleInputChange("email", e.target.value)} required className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-gray-300">{lang === "hi" ? "विषय" : "Subject"}</Label>
                  <Input placeholder={lang === "hi" ? "आपकी समस्या का विषय" : "Subject of your issue"} value={contactForm.subject} onChange={(e) => handleInputChange("subject", e.target.value)} required className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-500" />
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-gray-300">{lang === "hi" ? "प्राथमिकता" : "Priority"}</Label>
                  <select
                    value={contactForm.priority}
                    onChange={(e) => handleInputChange("priority", e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="low">{lang === "hi" ? "कम" : "Low"}</option>
                    <option value="medium">{lang === "hi" ? "मध्यम" : "Medium"}</option>
                    <option value="high">{lang === "hi" ? "उच्च" : "High"}</option>
                    <option value="urgent">{lang === "hi" ? "तत्काल" : "Urgent"}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="dark:text-gray-300">{lang === "hi" ? "संदेश" : "Message"}</Label>
                  <Textarea placeholder={lang === "hi" ? "अपनी समस्या विस्तार से बताएं..." : "Describe your issue in detail..."} rows={5} value={contactForm.message} onChange={(e) => handleInputChange("message", e.target.value)} required className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-500" />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  {lang === "hi" ? "संदेश भेजें" : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* FAQ + Info */}
          <div className="space-y-6">
            <Card className="bg-white dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-white">
                  {lang === "hi" ? "अक्सर पूछे जाने वाले प्रश्न" : "Frequently Asked Questions"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {faqItems.map((item, i) => (
                  <div key={i} className={i < faqItems.length - 1 ? "border-b dark:border-gray-700 pb-4" : ""}>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{item.q}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.a}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <Clock className="h-5 w-5" />
                  {lang === "hi" ? "सहायता समय" : "Support Hours"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    [lang === "hi" ? "चैट सपोर्ट:" : "Chat Support:", "24/7"],
                    [lang === "hi" ? "फोन सपोर्ट:" : "Phone Support:", "9:00 AM – 9:00 PM"],
                    [lang === "hi" ? "ईमेल सपोर्ट:" : "Email Support:", lang === "hi" ? "24 घंटे में जवाब" : "Reply in 24 hours"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{label}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <Users className="h-5 w-5" />
                  {lang === "hi" ? "हमारे विशेषज्ञ" : "Our Experts"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {lang === "hi"
                    ? "हमारी टीम में 50+ अनुभवी वकील हैं जो विभिन्न कानूनी क्षेत्रों में विशेषज्ञता रखते हैं।"
                    : "Our team includes 50+ experienced lawyers specializing in various areas of law."}
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300">
                  {legalAreas.map((area) => (
                    <div key={area} className="flex items-center gap-1">
                      <span className="text-green-500">•</span> {area}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
