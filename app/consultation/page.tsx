"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Clock, CreditCard, CheckCircle, Star, Video, MessageSquare, Shield } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

export default function ConsultationPage() {
  const { lang } = useLanguage()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedTime, setSelectedTime] = useState("")
  const [selectedPlan, setSelectedPlan] = useState("consultation")
  const [bookingForm, setBookingForm] = useState({ name: "", email: "", phone: "", issue: "", documents: "" })

  const timeSlots = ["09:00 AM","10:00 AM","11:00 AM","12:00 PM","02:00 PM","03:00 PM","04:00 PM","05:00 PM","06:00 PM","07:00 PM","08:00 PM"]

  const consultationPlans = [
    {
      id: "instant",
      name: lang === "hi" ? "तत्काल सहायता" : "Quick Help",
      price: 299, duration: lang === "hi" ? "15 मिनट" : "15 min", type: lang === "hi" ? "चैट" : "Chat",
      description: lang === "hi" ? "तुरंत कानूनी सलाह पाएं" : "Instant legal advice",
      features: lang === "hi"
        ? ["तत्काल चैट सपोर्ट", "दस्तावेज़ की त्वरित समीक्षा", "बुनियादी कानूनी सलाह", "ईमेल सारांश"]
        : ["Instant chat support", "Quick document review", "Basic legal advice", "Email summary"],
      icon: MessageSquare, color: "from-orange-500 to-red-500",
      available: lang === "hi" ? "तुरंत उपलब्ध" : "Available Now",
    },
    {
      id: "consultation",
      name: lang === "hi" ? "विस्तृत परामर्श" : "Detailed Consultation",
      price: 799, duration: lang === "hi" ? "45 मिनट" : "45 min", type: lang === "hi" ? "वीडियो कॉल" : "Video Call",
      description: lang === "hi" ? "विशेषज्ञ से विस्तृत चर्चा" : "In-depth discussion with expert",
      features: lang === "hi"
        ? ["वीडियो कॉल परामर्श", "विस्तृत दस्तावेज़ विश्लेषण", "कानूनी रणनीति सुझाव", "फॉलो-अप ईमेल", "रिकॉर्डेड सेशन"]
        : ["Video call consultation", "Detailed document analysis", "Legal strategy advice", "Follow-up email", "Recorded session"],
      icon: Video, color: "from-blue-500 to-purple-500",
      available: lang === "hi" ? "आज से बुकिंग" : "Book Today",
    },
    {
      id: "premium",
      name: lang === "hi" ? "प्रीमियम सेवा" : "Premium Service",
      price: 1499, duration: lang === "hi" ? "90 मिनट" : "90 min", type: lang === "hi" ? "व्यक्तिगत मीटिंग" : "Personal Meeting",
      description: lang === "hi" ? "संपूर्ण कानूनी समाधान" : "Complete legal solution",
      features: lang === "hi"
        ? ["वरिष्ठ वकील से परामर्श", "संपूर्ण केस विश्लेषण", "कानूनी दस्तावेज़ तैयारी", "असीमित फॉलो-अप", "प्राथमिकता सहायता"]
        : ["Senior lawyer consultation", "Complete case analysis", "Legal document preparation", "Unlimited follow-ups", "Priority support"],
      icon: Star, color: "from-purple-500 to-pink-500",
      available: lang === "hi" ? "अग्रिम बुकिंग" : "Advance Booking",
    },
  ]

  const selectedPlanData = consultationPlans.find((p) => p.id === selectedPlan)

  const handleInputChange = (field: string, value: string) =>
    setBookingForm((prev) => ({ ...prev, [field]: value }))

  // 🧠 STRIPE INTEGRATION — create checkout session and redirect
  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Booking:", { plan: selectedPlanData, date: selectedDate, time: selectedTime, form: bookingForm })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {lang === "hi" ? "कानूनी परामर्श बुक करें" : "Book Legal Consultation"}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {lang === "hi" ? "विशेषज्ञ वकीलों से तुरंत सलाह लें और अपनी समस्या का समाधान पाएं" : "Get instant advice from expert lawyers and solve your legal problems"}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — Plan + Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Plan Selection */}
            <Card className="bg-white dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-white">
                  {lang === "hi" ? "परामर्श प्लान चुनें" : "Choose Consultation Plan"}
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {lang === "hi" ? "अपनी आवश्यकता के अनुसार सबसे उपयुक्त प्लान चुनें" : "Choose the plan that best fits your needs"}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {consultationPlans.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-300 ${
                        selectedPlan === plan.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400"
                          : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 dark:bg-gray-700/30"
                      }`}
                    >
                      <div className={`inline-flex p-3 rounded-full bg-gradient-to-r ${plan.color} text-white mb-3`}>
                        <plan.icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{plan.name}</h3>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        ₹{plan.price}
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/{plan.duration}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{plan.type}</p>
                      <Badge variant="secondary" className="text-xs dark:bg-gray-600 dark:text-gray-200">
                        {plan.available}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Date & Time */}
            {selectedPlan !== "instant" && (
              <Card className="bg-white dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <CalendarIcon className="h-5 w-5" />
                    {lang === "hi" ? "दिनांक और समय चुनें" : "Choose Date & Time"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-base font-medium mb-3 block dark:text-gray-200">
                        {lang === "hi" ? "दिनांक चुनें" : "Select Date"}
                      </Label>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date()}
                        className="rounded-md border dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-base font-medium mb-3 block dark:text-gray-200">
                        {lang === "hi" ? "समय चुनें" : "Select Time"}
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {timeSlots.map((time) => (
                          <Button
                            key={time}
                            variant={selectedTime === time ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedTime(time)}
                            className={`text-sm ${selectedTime !== time ? "dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" : ""}`}
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Booking Form */}
            <Card className="bg-white dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-white">
                  {lang === "hi" ? "बुकिंग विवरण" : "Booking Details"}
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {lang === "hi" ? "अपनी जानकारी भरें और परामर्श बुक करें" : "Fill in your details to book the consultation"}
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBooking} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="dark:text-gray-300">{lang === "hi" ? "पूरा नाम *" : "Full Name *"}</Label>
                      <Input id="name" placeholder={lang === "hi" ? "आपका पूरा नाम" : "Your full name"} value={bookingForm.name} onChange={(e) => handleInputChange("name", e.target.value)} required className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-500" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="dark:text-gray-300">{lang === "hi" ? "ईमेल पता *" : "Email Address *"}</Label>
                      <Input id="email" type="email" placeholder={lang === "hi" ? "आपका ईमेल पता" : "Your email address"} value={bookingForm.email} onChange={(e) => handleInputChange("email", e.target.value)} required className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-500" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="dark:text-gray-300">{lang === "hi" ? "मोबाइल नंबर *" : "Mobile Number *"}</Label>
                    <Input id="phone" type="tel" placeholder={lang === "hi" ? "आपका मोबाइल नंबर" : "Your mobile number"} value={bookingForm.phone} onChange={(e) => handleInputChange("phone", e.target.value)} required className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="issue" className="dark:text-gray-300">{lang === "hi" ? "कानूनी समस्या का विवरण *" : "Legal Issue Description *"}</Label>
                    <Textarea id="issue" placeholder={lang === "hi" ? "अपनी कानूनी समस्या के बारे में विस्तार से बताएं..." : "Describe your legal issue in detail..."} rows={4} value={bookingForm.issue} onChange={(e) => handleInputChange("issue", e.target.value)} required className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="documents" className="dark:text-gray-300">{lang === "hi" ? "संबंधित दस्तावेज़ (वैकल्पिक)" : "Related Documents (optional)"}</Label>
                    <Textarea id="documents" placeholder={lang === "hi" ? "यदि आपके पास कोई संबंधित दस्तावेज़ हैं..." : "Describe any related documents you have..."} rows={2} value={bookingForm.documents} onChange={(e) => handleInputChange("documents", e.target.value)} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-500" />
                  </div>
                  <Button type="submit" className={`w-full bg-gradient-to-r ${selectedPlanData?.color} text-white hover:opacity-90`} size="lg">
                    <CreditCard className="h-5 w-5 mr-2" />
                    ₹{selectedPlanData?.price} {lang === "hi" ? "भुगतान करें और बुक करें" : "Pay & Book"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right — Booking Summary */}
          <div>
            <Card className="sticky top-6 bg-white dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-white">
                  {lang === "hi" ? "बुकिंग सारांश" : "Booking Summary"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedPlanData && (
                  <>
                    <div className="border-b dark:border-gray-700 pb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-full bg-gradient-to-r ${selectedPlanData.color} text-white`}>
                          <selectedPlanData.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold dark:text-white">{selectedPlanData.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{selectedPlanData.type}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{selectedPlanData.description}</p>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        ₹{selectedPlanData.price}
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/{selectedPlanData.duration}</span>
                      </div>
                    </div>

                    {selectedPlan !== "instant" && selectedDate && selectedTime && (
                      <div className="border-b dark:border-gray-700 pb-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          {lang === "hi" ? "चयनित समय" : "Selected Time"}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{selectedDate.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <Clock className="h-4 w-4" />
                          <span>{selectedTime}</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                        {lang === "hi" ? "शामिल सेवाएं:" : "Included:"}
                      </h4>
                      <ul className="space-y-2">
                        {selectedPlanData.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="font-medium text-green-800 dark:text-green-300">
                          {lang === "hi" ? "100% सुरक्षित भुगतान" : "100% Secure Payment"}
                        </span>
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-400">
                        {lang === "hi" ? "यदि आप संतुष्ट नहीं हैं, तो 24 घंटे के भीतर पूरा रिफंड" : "Full refund within 24 hours if not satisfied"}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}