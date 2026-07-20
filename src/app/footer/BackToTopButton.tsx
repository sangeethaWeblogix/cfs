"use client";
import { BsChevronUp } from "react-icons/bs";

export default function BackToTopButton() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="to_top bg-gray rounded-circle icon-40 d-inline-flex align-items-center justify-content-center show"
      aria-label="Back to top"
    >
      <BsChevronUp className="fs-6 text-white" />
    </button>
  );
}
