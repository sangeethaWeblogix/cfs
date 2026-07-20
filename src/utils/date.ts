// // utils/date.ts
// export function formatPostDate(input: string | Date): string {
//   if (!input) return "";
//   // Handle strings like "2025-08-15 19:53:20" (no timezone)
//   if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}\s\d/.test(input)) {
//     input = input.replace(" ", "T") + "Z"; // treat as UTC
//   }
//   const d = new Date(input);
//   if (Number.isNaN(d.getTime())) return "";
//   return d.toLocaleDateString("en-US", {
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//   });
// }
// utils/date.ts
export function formatPostDate(input: string | Date): string {
  if (!input) return "";

  let d: Date;

  if (typeof input === "string") {
    // Handle strings like "2025-08-15 19:53:20" (no timezone)
    if (/^\d{4}-\d{2}-\d{2}\s\d/.test(input)) {
      // replace space with 'T' and add Z → interpret as UTC
      input = input.replace(" ", "T") + "Z";
    }
    d = new Date(input);
  } else {
    d = input;
  }

  if (Number.isNaN(d.getTime())) return "";

  // ✅ Force UTC date instead of local
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
