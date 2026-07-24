export type ContentStatus = "published" | "draft" | "unpublished";

export type FieldType =
  | "text"
  | "textarea"
  | "image"
  | "link"
  | "toggle"
  | "number"
  | "select"
  | "readonly";

export type HomeModuleId =
  | "navbar"
  | "hero"
  | "toursSection"
  | "categoryGrid"
  | "exploreByMonth"
  | "aboutSection"
  | "testimonials"
  | "finalCta"
  | "newsletter"
  | "footer";

export type ContentValue = string | number | boolean;

export type FieldDefinition = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  helper?: string;
  maxLength?: number;
  options?: string[];
  value?: ContentValue;
};

export type HomeModuleDefinition = {
  id: HomeModuleId;
  name: string;
};

export type HomeModuleRecord = {
  id: HomeModuleId;
  index: number;
  name: string;
  description: string;
  status: ContentStatus;
  publishedVersion: number;
  draftVersion: number | null;
  updatedAt: string;
  fields: FieldDefinition[];
  data: Record<string, ContentValue>;
};

export type TourFareFields = {
  child: string;
  single: string;
  double: string;
  triple: string;
  quad: string;
};

export type TourRecord = {
  slug: string;
  code: string;
  title: string;
  localizedTitle: string;
  image: string;
  region: string;
  subregion: string;
  duration: string;
  localizedDuration: string;
  tourType: string;
  departures: string;
  localizedDepartures: string;
  highlights: string;
  localizedHighlights: string;
  description: string;
  localizedDescription: string;
  fares: TourFareFields;
  pdfTitle: string;
  localizedPdfTitle: string;
  pdfFileName: string;
  specialOffer: boolean;
  specialDeals: boolean;
  vacationPackage: boolean;
  travelNewsPackage: boolean;
  busTourPackage: boolean;
  status: ContentStatus;
  updatedAt: string;
};

export type MediaAsset = {
  id: string;
  fileName: string;
  type: "image" | "qr";
  url: string;
  sizeLabel: string;
  usedBy: string[];
  uploadedAt: string;
};

export type SiteSettings = {
  siteName: string;
  tagline: string;
  primaryPhoneLabel: string;
  primaryPhoneHref: string;
  secondaryPhoneLabel: string;
  secondaryPhoneHref: string;
  emailLabel: string;
  emailHref: string;
  officeAddress: string;
};

export type BookingStatus = "new" | "contacted" | "confirmed" | "cancelled" | "completed";

export type BookingSource = "tour_email" | "phone" | "quote_request" | "manual";

export type BookingRecord = {
  id: string;
  reference: string;
  status: BookingStatus;
  source: BookingSource;
  tourSlug?: string;
  tourTitle?: string;
  tourCode?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  departureDate?: string;
  partySize?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type PaymentStatus = "pending" | "paid" | "partial" | "refunded" | "failed";

export type PaymentMethod = "card" | "bank_transfer" | "e_transfer" | "cash" | "other";

export type PaymentType = "deposit" | "balance" | "full" | "refund";

export type PaymentRecord = {
  id: string;
  reference: string;
  bookingId: string;
  bookingReference: string;
  customerName: string;
  tourTitle?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  type: PaymentType;
  transactionId?: string;
  description: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
