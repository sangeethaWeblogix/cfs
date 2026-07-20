"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, EffectFade } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/effect-fade";
import "./popup.css";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
// import Link from "next/link";

type CaravanDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
  product: {
    id?: string | number;
    slug?: string;
    name: string;
    image: string;
    price: number;
    regularPrice: string | number;
    salePrice: string | number;
    isPOA: boolean;
    location?: string;
  };
};

export default function CaravanDetailModal({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  product,
}: CaravanDetailModalProps) {
  const swiperRef = useRef<SwiperType | null>(null);
  const fsSwiperRef = useRef<SwiperType | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    postcode: "",
    message: "",
  });
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
    postcode: false,
    message: false,
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [submitting, setSubmitting] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [isFinanceQuoteChecked, setFinanceQuoteChecked] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(1);
  const router = useRouter();

  // Validation regex
  const NAME_RE = /^[A-Za-z][A-Za-z\s'.-]{1,49}$/;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^\d{7,15}$/;
  const POST_RE = /^\d{4}$/;

  const validate = (f = form) => {
    const e: Partial<typeof form> = {};
    if (!f.name.trim()) e.name = "Name is required";
    else if (!NAME_RE.test(f.name.trim()))
      e.name = "Use letters & spaces only (2–50 chars)";
    if (!f.email.trim()) e.email = "Email is required";
    else if (!EMAIL_RE.test(f.email.trim())) e.email = "Enter a valid email";
    if (!f.phone.trim()) e.phone = "Phone is required";
    else if (!PHONE_RE.test(f.phone.trim())) e.phone = "Digits only (7–15)";
    if (!f.postcode.trim()) e.postcode = "Postcode is required";
    else if (!POST_RE.test(f.postcode.trim())) e.postcode = "4 digit postcode";
    return e;
  };

  const setField = (key: keyof typeof form, value: string) => {
    if (key === "phone" || key === "postcode") value = value.replace(/\D/g, "");
    setForm((p) => ({ ...p, [key]: value }));
    if (touched[key]) setErrors(validate({ ...form, [key]: value }));
  };

  const onBlur = (key: keyof typeof form) => {
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors(validate(form));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    setTouched({
      name: true,
      email: true,
      phone: true,
      postcode: true,
      message: false,
    });
    if (Object.keys(v).length) return;

    setSubmitting(true);
    setOkMsg(null);
    try {
      const navHistory = sessionStorage.getItem("nav_history");
      const navigation_path = navHistory
        ? (() => { try { return JSON.parse(navHistory).join(", "); } catch { return ""; } })()
        : "";

      const res = await fetch("/api/enquiry/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id ?? product.slug ?? product.name,
          email: form.email.trim(),
          name: form.name.trim(),
          phone: form.phone.trim(),
          message: form.message.trim() || "",
          postcode: form.postcode.trim(),
          page_url: navigation_path,
          finance: isFinanceQuoteChecked,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message || "Failed to send. Try again.");
      }
      const data = await res.json();

      if (data?.success && data.data?.redirect_slug) {
        router.push(`/${data.data.redirect_slug}`);
      } else {
        router.push("/thank-you-default");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to send. Try again.";
      setErrors((p) => ({ ...p, email: message }));
      setOkMsg(null);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    if (isOpen && initialIndex > 0) {
      setTimeout(() => { swiperRef.current?.slideTo(initialIndex, 0); }, 50);
    }
  }, [isOpen, initialIndex]);

  useEffect(() => {
    if (!isOpen) {
      setOkMsg(null);
      setErrors({});
      setTouched({
        name: false,
        email: false,
        phone: false,
        postcode: false,
        message: false,
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getDisplayPrice = () => {
    const sale = Number(String(product.salePrice).replace(/[^0-9.]/g, ""));
    const regular = Number(
      String(product.regularPrice).replace(/[^0-9.]/g, "")
    );

    if (sale > 0) return product.salePrice;
    if (regular > 0) return product.regularPrice;

    return "POA";
  };

  return (
    <div className="cfs-modal" role="dialog" aria-modal="true">
      {/* Close button */}
      <button className="cfs-modal-close" onClick={onClose} aria-label="Close">
        ×
      </button>

      <div className="cfs-modal-layout">
        {/* ── Left: dark image panel ── */}
        <div className="cfs-modal-media">
          <div className="cfs-modal-header">
            <div className="cfs-modal-title-wrap">
              <h3 className="cfs-modal-title">{product.name}</h3>
              {product.location && (
                <p className="cfs-modal-location">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{marginRight:4,flexShrink:0}}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                  {product.location}
                </p>
              )}
            </div>
            <span className="cfs-modal-price">{getDisplayPrice()}</span>
          </div>

          <div className="cfs-modal-swiper">
            <Swiper
              modules={[Navigation, EffectFade]}
              navigation
              effect="fade"
              fadeEffect={{ crossFade: true }}
              watchOverflow={false}
              onSwiper={(swiper) => { swiperRef.current = swiper; }}
              onSlideChange={(swiper) => setCurrentSlide(swiper.realIndex + 1)}
              loop={images.length > 1}
            >
              {images.map((img, idx) => (
                <SwiperSlide key={`slide-${idx}-${img}`}>
                  <div
                    onClick={() => { if (window.innerWidth < 768) setIsFullscreen(true); }}
                    style={{ cursor: "pointer" }}
                  >
                    <Image
                      src={img}
                      alt={`Slide ${idx + 1}`}
                      width={0}
                      height={0}
                      sizes="100vw"
                      unoptimized
                      priority={idx < 2}
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
            {/* Mobile fullscreen expand button */}
            <button
              className="cfs-expand-btn"
              onClick={() => setIsFullscreen(true)}
              aria-label="View fullscreen"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
            </button>
          </div>

          {images.length > 1 && (
            <div className="cfs-modal-counter">
              {currentSlide} / {images.length}
            </div>
          )}
        </div>

        {/* ── Fullscreen lightbox (mobile) ── */}
        {isFullscreen && (
          <div className="cfs-fs-overlay" role="dialog" aria-modal="true">
            <button
              className="cfs-fs-close"
              onClick={() => setIsFullscreen(false)}
              aria-label="Close fullscreen"
            >
              ×
            </button>
            <Swiper
              modules={[Navigation]}
              navigation
              initialSlide={currentSlide - 1}
              onSwiper={(s) => { fsSwiperRef.current = s; }}
              onSlideChange={(s) => setCurrentSlide(s.realIndex + 1)}
              loop={images.length > 1}
              className="cfs-fs-swiper"
            >
              {images.map((img, idx) => (
                <SwiperSlide key={`fs-${idx}`}>
                  <Image
                    src={img}
                    alt={`Slide ${idx + 1}`}
                    width={0}
                    height={0}
                    sizes="100vw"
                    unoptimized
                  />
                </SwiperSlide>
              ))}
            </Swiper>
            <div className="cfs-fs-counter">
              {currentSlide} / {images.length}
            </div>
          </div>
        )}

        {/* ── Right: white form panel ── */}
        <div className="cfs-modal-sidebar">
          <form className="cfs-modal-form" noValidate onSubmit={onSubmit}>
            <h4 className="cfs-modal-form-title">Contact Seller</h4>

            {/* Name */}
            <div className="form-item">
              <label htmlFor="m-name" className="cfs-field-label">Full name</label>
              <input
                id="m-name"
                name="m-name"
                type="text"
                className={`cfs-field${errors.name && touched.name ? " is-invalid" : ""}`}
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                onBlur={() => onBlur("name")}
                required
                autoComplete="off"
              />
              {touched.name && errors.name && (
                <div className="cfs-error">{errors.name}</div>
              )}
            </div>

            {/* Email */}
            <div className="form-item">
              <label htmlFor="m-email" className="cfs-field-label">Email</label>
              <input
                id="m-email"
                name="m-email"
                type="email"
                className={`cfs-field${errors.email && touched.email ? " is-invalid" : ""}`}
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                onBlur={() => onBlur("email")}
                required
                autoComplete="off"
              />
              {touched.email && errors.email && (
                <div className="cfs-error">{errors.email}</div>
              )}
            </div>

            {/* Phone + Postcode row */}
            <div className="cfs-field-row">
              <div className="form-item">
                <label htmlFor="m-phone" className="cfs-field-label">Phone number</label>
                <div className="cfs-phone-wrap">
                  <span className="cfs-phone-prefix">+61</span>
                  <input
                    id="m-phone"
                    name="m-phone"
                    type="tel"
                    inputMode="numeric"
                    className={`cfs-field cfs-field-phone${errors.phone && touched.phone ? " is-invalid" : ""}`}
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    onBlur={() => onBlur("phone")}
                    required
                    autoComplete="off"
                  />
                </div>
                {touched.phone && errors.phone && (
                  <div className="cfs-error">{errors.phone}</div>
                )}
              </div>
              <div className="form-item">
                <label htmlFor="m-postcode" className="cfs-field-label">Postcode</label>
                <input
                  id="m-postcode"
                  name="m-postcode"
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  className={`cfs-field${errors.postcode && touched.postcode ? " is-invalid" : ""}`}
                  value={form.postcode}
                  onChange={(e) => setField("postcode", e.target.value)}
                  onBlur={() => onBlur("postcode")}
                  required
                  autoComplete="off"
                />
                {touched.postcode && errors.postcode && (
                  <div className="cfs-error">{errors.postcode}</div>
                )}
              </div>
            </div>

            {/* Message */}
            <div className="form-item">
              <label htmlFor="enquiry4-message" className="cfs-field-label">
                Message (optional)
              </label>
              <textarea
                id="enquiry4-message"
                name="enquiry4-message"
                value={form.message}
                onBlur={() => onBlur("message")}
                onChange={(e) => setField("message", e.target.value)}
                className="cfs-field"
                rows={4}
                placeholder="Type your message here"
              />
            </div>

            {okMsg && <div className="cfs-success">{okMsg}</div>}

            {/* Finance checkbox */}
            <div className="cfs-checkbox-wrap">
              <input
                type="checkbox"
                id="m-finance"
                onChange={() => setFinanceQuoteChecked((p) => !p)}
                checked={isFinanceQuoteChecked}
              />
              <label htmlFor="m-finance">
                Get a no-obligation finance quote with competitive rates
              </label>
            </div>

            <p className="terms_text">
              By clicking &apos;Send Enquiry&apos;, you agree to Marketplace
              Network{" "}
              <a href="/privacy-collection-statement" target="_blank">
                Collection Statement
              </a>
              ,{" "}
              <a href="/privacy-policy" target="_blank">Privacy Policy</a> and{" "}
              <a href="/terms-conditions" target="_blank">Terms and Conditions</a>.
            </p>

            <button
              type="submit"
              className="cfs-modal-submit"
              disabled={submitting}
            >
              {submitting ? "Sending..." : "Send Enquiry"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
