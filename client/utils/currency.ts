const kesFormatter = new Intl.NumberFormat("en-KE", { maximumFractionDigits: 2 });

/** Formats an amount in Kenyan shillings, e.g. 1500 -> "KES 1,500". */
export function formatKES(amount: number) {
  return `KES ${kesFormatter.format(amount)}`;
}
