"use client";

import React, { useState } from "react";

type FormState = {
  name: string;
  email: string;
  phone: string;
  postcode: string; 
  message: string;
};

export default function ContactSection() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    postcode: "",
    message: "",
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
    if (!formData.name.trim()) next.name = "Name is required.";
    if (!formData.email.trim()) {
      next.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      next.email = "Enter a valid email.";
    }
    if (!formData.phone.trim()) {
      next.phone = "Phone is required.";
    } else if (!/^[0-9\s+\-()]{7,20}$/.test(formData.phone)) {
      next.phone = "Enter a valid phone number.";
    }
    if (!formData.postcode.trim()) {
      next.postcode = "Postcode is required.";
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

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.status === "mail_sent") {
        setMessage("✅ Message sent successfully!");
        // clear form + errors
        setFormData({
          name: "",
          email: "",
          phone: "",
          postcode: "",
          message: "",
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
                          name="name"
                          className="form-control"
                          placeholder="Name*"
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />
                        {errors.name && (
                          <small className="text-danger">
                            {errors.name}
                          </small>
                        )}
                      </div>
                    </div>

                    <div className="col-lg-12">
                      <div className="form-group mb-20">
                        <input
                          type="email"
                          name="email"
                          className="form-control"
                          placeholder="Email*"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                        {errors.email && (
                          <small className="text-danger">
                            {errors.email}
                          </small>
                        )}
                      </div>
                    </div>

                    <div className="col-lg-12">
                      <div className="form-group mb-20">
                        <input
                          type="tel"
                          name="phone"
                          className="form-control"
                          placeholder="Phone*"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                        />
                        {errors.phone && (
                          <small className="text-danger">
                            {errors.phone}
                          </small>
                        )}
                      </div>
                    </div>

                    <div className="col-lg-12">
                      <div className="form-group mb-20">
                        <input
                          type="text"
                          name="postcode"
                          className="form-control"
                          placeholder="Postcode*"
                          value={formData.postcode}
                          onChange={handleChange}
                          required
                        />
                        {errors.postcode && (
                          <small className="text-danger">
                            {errors.postcode}
                          </small>
                        )}
                      </div>
                    </div>

                    <div className="col-lg-12">
                      <div className="form-group mb-20">
                        <textarea
                          className="form-control"
                          name="message"
                          value={formData.message}
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
