export function formatDateTime(value: string | null) {
  if (!value) {
    return "None";
  }
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
