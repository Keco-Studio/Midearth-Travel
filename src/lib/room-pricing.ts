export const DEFAULT_ROOM_PRICE_CENTS = 6600;

export function normalizeRoomPriceCents(value: unknown): number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : DEFAULT_ROOM_PRICE_CENTS;
}

export function calculateRoomPriceTotal(
  roomPriceCents: number,
  rooms?: number,
): number {
  if (!Number.isSafeInteger(roomPriceCents) || roomPriceCents < 0) {
    throw new Error("Room price must be a non-negative whole number of cents");
  }
  if (rooms === undefined) return 0;
  if (!Number.isInteger(rooms) || rooms < 1) {
    throw new Error("Rooms must be a positive whole number");
  }

  return roomPriceCents * rooms;
}
