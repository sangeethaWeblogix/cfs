"use client";

import React, { useState } from "react";

type FormState = {
  "your-name": string;
  "your-email": string;
  "your-phone": string;
  "you-postcode": string; // keep as-is since your CF7 works with this key
  "your-message": string;
};

export default function ContactSection() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState<FormState>({
    "your-name": "",
    "your-email": "",
    "your-phone": "",
    "you-postcode": "",
    "your-message": "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // clear field error on change
    if (errors[e.target.name as keyof FormState]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    }
  };

  const validate = () => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!formData["your-name"].trim()) next["your-name"] = "Name is required.";
    if (!formData["your-email"].trim()) {
      next["your-email"] = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData["your-email"])) {
      next["your-email"] = "Enter a valid email.";
    }
    if (!formData["your-phone"].trim()) {
      next["your-phone"] = "Phone is required.";
    } else if (!/^[0-9\s+\-()]{7,20}$/.test(formData["your-phone"])) {
      next["your-phone"] = "Enter a valid phone number.";
    }
    if (!formData["you-postcode"].trim()) {
      next["you-postcode"] = "Postcode is required.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (loading) return; // guard
    if (!validate()) {
      setMessage("⚠️ All fields are required. Description is optional.");
      return;
    }

    try {
      setLoading(true);

      const form = new FormData();
      form.append("_wpcf7", "3290");
      form.append("_wpcf7_version", "5.9.3");
      form.append("_wpcf7_locale", "en_US");
      form.append("_wpcf7_unit_tag", "wpcf7-f3290-p45-o1");
      form.append("_wpcf7_container_post", "45");

      Object.entries(formData).forEach(([key, value]) =>
        form.append(key, value)
      );

      const res = await fetch(
        "https://admin.caravansforsale.com.au/wp-json/contact-form-7/v1/contact-forms/3290/feedback",
        { method: "POST", body: form }
      );

      const data = await res.json();

      if (data.status === "mail_sent") {
        setMessage("✅ Message sent successfully!");
        // clear form + errors
        setFormData({
          "your-name": "",
          "your-email": "",
          "your-phone": "",
          "you-postcode": "",
          "your-message": "",
        });
        setErrors({});
      } else {
        setMessage("❌ Error: " + (data.message || "Failed to send message."));
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="community contact_top section-padding style-5">
        <div className="container">
          <div className="section-head text-center style-4">
            <h2 className="text-center mb-20">Get in Touch</h2>
          </div>
        </div>
      </section>

      <section className="contact section-padding pt-0 style-6">
        <div className="container">
          <div className="content">
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-3 max-w-md mx-auto p-4"
                  noValidate
                >
                  {/* Top alert only when errors exist */}

                  {/* Show server message */}
                  {message && (
                    <p className="text-center mb-2" aria-live="polite">
                      {message}
                    </p>
                  )}

                  <div className="row">
                    <div className="col-lg-12">
                      <div className="form-group mb-20">
                        <input
                          type="text"
                          name="your-name"
                          className="form-control"
                          placeholder="Name*"
                          value={formData["your-name"]}
                          onChange={handleChange}
                          required
                        />
                        {errors["your-name"] && (
                          <small className="text-danger">
                            {errors["your-name"]}
                          </small>
                        )}
                      </div>
                    </div>

                    <div className="col-lg-12">
                      <div className="form-group mb-20">
                        <input
                          type="email"
                          name="your-email"
                          className="form-control"
                          placeholder="Email*"
                          value={formData["your-email"]}
                          onChange={handleChange}
                          required
                        />
                        {errors["your-email"] && (
                          <small className="text-danger">
                            {errors["your-email"]}
                          </small>
                        )}
                      </div>
                    </div>

                    <div className="col-lg-12">
                      <div className="form-group mb-20">
                        <input
                          type="tel"
                          name="your-phone"
                          className="form-control"
                          placeholder="Phone*"
                          value={formData["your-phone"]}
                          onChange={handleChange}
                          required
                        />
                        {errors["your-phone"] && (
                          <small className="text-danger">
                            {errors["your-phone"]}
                          </small>
                        )}
                      </div>
                    </div>

                    <div className="col-lg-12">
                      <div className="form-group mb-20">
                        <input
                          type="text"
                          name="you-postcode"
                          className="form-control"
                          placeholder="Postcode*"
                          value={formData["you-postcode"]}
                          onChange={handleChange}
                          required
                        />
                        {errors["you-postcode"] && (
                          <small className="text-danger">
                            {errors["you-postcode"]}
                          </small>
                        )}
                      </div>
                    </div>

                    <div className="col-lg-12">
                      <div className="form-group mb-20">
                        <textarea
                          className="form-control"
                          name="your-message"
                          value={formData["your-message"]}
                          onChange={handleChange}
                          placeholder="How can we help you?*"
                          rows={4}
                        />
                      </div>
                    </div>

                    <div className="col-lg-12 text-center">
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn bg-blue4 fw-bold text-white text-light fs-12px"
                      >
                        {loading ? "SUBMITTING..." : "SUBMIT"}
                      </button>
                    </div>
                  </div>
                </form>

                {/* Optional: small hint below the form */}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
