  import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

interface Product {
  id: number | string;
  slug?: string;
  name: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  postcode?: string;
  message?: string;
}

interface FormTouched {
  name: boolean;
  email: boolean;
  phone: boolean;
  postcode: boolean;
  message: boolean;
}

export function useEnquiryForm(product: Product) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    postcode: "",
    message: "",
  });

  const [touched, setTouched] = useState<FormTouched>({
    name: false,
    email: false,
    phone: false,
    postcode: false,
    message: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [isFinanceQuoteChecked, setFinanceQuoteChecked] = useState(false);

  const NAME_RE = /^[A-Za-z][A-Za-z\s'.-]{1,49}$/;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^\d{7,15}$/;
  const POST_RE = /^\d{4}$/;

  const validate = (f = form): FormErrors => {
    const e: FormErrors = {};

    if (!f.name.trim()) e.name = "Name is required";
    else if (!NAME_RE.test(f.name.trim()))
      e.name = "Use letters & spaces only (2–50 chars)";

    if (!f.email.trim()) e.email = "Email is required";
    else if (!EMAIL_RE.test(f.email.trim()))
      e.email = "Enter a valid email";

    if (!f.phone.trim()) e.phone = "Phone is required";
    else if (!PHONE_RE.test(f.phone.trim()))
      e.phone = "Digits only (7–15)";

    if (!f.postcode.trim()) e.postcode = "Postcode is required";
    else if (!POST_RE.test(f.postcode.trim()))
      e.postcode = "4 digit postcode";

    return e;
  };

  const setField = (key: string, value: string) => {
    if (key === "phone" || key === "postcode") {
      value = value.replace(/\D/g, "");
    }

    setForm((prev) => ({ ...prev, [key]: value }));

    if (touched[key as keyof FormTouched]) {
      setErrors(validate({ ...form, [key]: value }));
    }
  };

  const onBlur = (key: keyof FormTouched) => {
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors(validate(form));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const v = validate();
    setErrors(v);

    setTouched({
      name: true,
      email: true,
      phone: true,
      postcode: true,
      message: true,
    });

    if (Object.keys(v).length) return;

    setSubmitting(true);

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
          message: form.message.trim(),
          postcode: form.postcode.trim(),
          page_url: navigation_path,
          finance: isFinanceQuoteChecked,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message || "Product enquiry failed");
      }
      const data = await res.json();

      if (data?.success && data.data?.redirect_slug) {
        router.push(`/${data.data.redirect_slug}`);
      } else {
        router.push("/thank-you-default");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return {
    form,
    errors,
    touched,
    submitting,
    setField,
    onBlur,
    onSubmit,
    isFinanceQuoteChecked,
    setFinanceQuoteChecked,
  };
}
