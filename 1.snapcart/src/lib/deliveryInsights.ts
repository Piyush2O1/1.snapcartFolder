export type DeliveryInsightMetric =
  | "today-earning"
  | "today-deliveries"
  | "weekly-completed"
  | "total-completed"

export const DELIVERY_EARNING_PER_ORDER = 40

export const deliveryInsightMeta: Record<
  DeliveryInsightMetric,
  {
    label: string
    shortLabel: string
    description: string
  }
> = {
  "today-earning": {
    label: "Today Earning",
    shortLabel: "Today Earning",
    description: "Completed deliveries from today with earning breakdown and customer locations.",
  },
  "today-deliveries": {
    label: "Today Deliveries",
    shortLabel: "Today Deliveries",
    description: "All deliveries completed today with customer details, route context, and delivery locations.",
  },
  "weekly-completed": {
    label: "Weekly Completed",
    shortLabel: "Weekly Completed",
    description: "Completed deliveries from the last 7 days with per-order detail and mapped delivery addresses.",
  },
  "total-completed": {
    label: "Total Completed",
    shortLabel: "Total Completed",
    description: "Your full completed delivery history with order details and customer location view.",
  },
}

export const isDeliveryInsightMetric = (value: string): value is DeliveryInsightMetric => {
  return value in deliveryInsightMeta
}
