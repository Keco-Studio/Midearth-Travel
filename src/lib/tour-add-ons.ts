export type TourAddOnCategory = "activity" | "meal" | "service_fee";
export type TourAddOnTicketType = { id: string; label: string; localizedLabel: string; priceCents: number };
export type TourAddOn = {
  id: string; name: string; localizedName: string; category: TourAddOnCategory;
  icon: string; required: boolean; ticketTypes: TourAddOnTicketType[];
};
export type TourAddOnSelection = { addOnId: string; ticketTypeId: string; quantity: number };

export function defaultAddOnSelections(addOns: readonly TourAddOn[]): TourAddOnSelection[] {
  return addOns.filter((item) => item.required).map((item) => ({
    addOnId: item.id, ticketTypeId: item.ticketTypes[0]?.id ?? "", quantity: 1,
  })).filter((selection) => selection.ticketTypeId);
}

export function validateAddOnSelections(addOns: readonly TourAddOn[], selections: readonly TourAddOnSelection[]): TourAddOnSelection[] {
  const byId = new Map(addOns.map((item) => [item.id, item]));
  const seen = new Set<string>();
  const normalized = selections.map((selection) => {
    const item = byId.get(selection.addOnId);
    if (!item) throw new Error("Unknown add-on");
    const selectionKey = `${item.id}:${selection.ticketTypeId}`;
    if (seen.has(selectionKey)) throw new Error("Duplicate ticket type");
    seen.add(selectionKey);
    const ticket = item.ticketTypes.find((candidate) => candidate.id === selection.ticketTypeId);
    if (!ticket) throw new Error("Unknown ticket type");
    if (!Number.isInteger(selection.quantity) || selection.quantity < 1 || selection.quantity > 99) throw new Error("Quantity must be between 1 and 99");
    return { addOnId: item.id, ticketTypeId: ticket.id, quantity: selection.quantity };
  });
  for (const item of addOns) if (item.required && !normalized.some((selection) => selection.addOnId === item.id)) throw new Error("Required add-on is missing");
  return normalized;
}

export function calculateAddOnTotal(addOns: readonly TourAddOn[], selections: readonly TourAddOnSelection[]): number {
  const byId = new Map(addOns.map((item) => [item.id, item]));
  return selections.reduce((total, selection) => {
    const item = byId.get(selection.addOnId);
    const ticket = item?.ticketTypes.find((candidate) => candidate.id === selection.ticketTypeId);
    return total + (ticket?.priceCents ?? 0) * selection.quantity;
  }, 0);
}
