"use client";

import { ProTable } from "@ant-design/pro-components";
import type { ProColumns } from "@ant-design/pro-components";
import { App, Button, Card, Col, Descriptions, Divider, Empty, Row, Space, Statistic, Tag, Tooltip, Typography } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getBookingStatusCounts, getPaymentsForBooking } from "@/lib/workspace-view-models";
import type { BookingRecord, BookingSource, BookingStatus, PaymentRecord } from "@/types/cms";

type BookingsWorkspaceProps = {
  bookings: BookingRecord[];
  payments?: PaymentRecord[];
  focusBookingId?: string | null;
  onFocusHandled?: () => void;
  onViewPayment?: (paymentId: string) => void;
};

const sourceLabels: Record<BookingSource, string> = {
  tour_email: "Tour email",
  phone: "Phone",
  quote_request: "Quote request",
  manual: "Manual",
};

const statusLabels: Record<BookingStatus, string> = {
  new: "New",
  contacted: "Contacted",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
};

const statusTagClassNames: Record<BookingStatus, string> = {
  new: "cms-booking-tag cms-booking-tag--new",
  contacted: "cms-booking-tag cms-booking-tag--contacted",
  confirmed: "cms-booking-tag cms-booking-tag--confirmed",
  cancelled: "cms-booking-tag cms-booking-tag--cancelled",
  completed: "cms-booking-tag cms-booking-tag--completed",
};

export function BookingsWorkspace({
  bookings,
  payments = [],
  focusBookingId,
  onFocusHandled,
  onViewPayment,
}: BookingsWorkspaceProps) {
  const { message } = App.useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading] = useState(false);
  const counts = getBookingStatusCounts(bookings);

  const selectedBooking = useMemo(
    () => bookings.find((booking) => booking.id === selectedId) ?? null,
    [bookings, selectedId],
  );

  const relatedPayments = useMemo(
    () => (selectedBooking ? getPaymentsForBooking(payments, selectedBooking.id) : []),
    [payments, selectedBooking],
  );

  useEffect(() => {
    if (!focusBookingId) {
      return;
    }

    const bookingExists = bookings.some((booking) => booking.id === focusBookingId);
    if (bookingExists) {
      setSelectedId(focusBookingId);
    }

    onFocusHandled?.();
  }, [bookings, focusBookingId, onFocusHandled]);

  const markContactedDisabledReason = getMarkContactedDisabledReason(selectedBooking);

  const handleSelectBooking = useCallback((bookingId: string) => {
    setSelectedId(bookingId);
  }, []);

  const columns: ProColumns<BookingRecord>[] = useMemo(
    () => [
      {
        title: "Reference",
        dataIndex: "reference",
        render: (_, record) => (
          <span className="cms-table-title-link">{record.reference}</span>
        ),
      },
      {
        title: "Customer",
        dataIndex: "customerName",
      },
      {
        title: "Tour",
        dataIndex: "tourTitle",
        render: (_, record) => record.tourTitle ?? "General inquiry",
      },
      {
        title: "Source",
        dataIndex: "source",
        render: (_, record) => (
          <Tag className="cms-booking-source-tag">{sourceLabels[record.source]}</Tag>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        render: (_, record) => (
          <Tag bordered className={statusTagClassNames[record.status]}>
            {statusLabels[record.status]}
          </Tag>
        ),
      },
      {
        title: "Created",
        dataIndex: "createdAt",
        render: (_, record) => formatDate(record.createdAt),
      },
    ],
    [],
  );

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="New" value={counts.new} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Contacted" value={counts.contacted} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Confirmed" value={counts.confirmed} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Completed" value={counts.completed} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={16}>
          <ProTable<BookingRecord>
            columns={columns}
            dataSource={bookings}
            loading={loading}
            rowKey="id"
            search={false}
            options={{ density: true, setting: true, reload: false }}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 860 }}
            toolBarRender={() => [
              <Button
                key="export"
                onClick={() => message.info("Export will be available when API is connected")}
              >
                Export
              </Button>,
              <Tooltip
                key="mark-contacted-tooltip"
                title={markContactedDisabledReason ?? "Mark this booking as contacted"}
              >
                <span className="cms-disabled-action-wrap">
                  <Button
                    key="mark-contacted"
                    type="primary"
                    className="cms-primary-action"
                    disabled={markContactedDisabledReason !== null}
                    onClick={() => message.success("Booking marked as contacted")}
                  >
                    Mark contacted
                  </Button>
                </span>
              </Tooltip>,
            ]}
            onRow={(record) => ({
              onClick: () => handleSelectBooking(record.id),
              style: {
                cursor: "pointer",
                background: record.id === selectedId ? "#fbf9f4" : undefined,
              },
            })}
            locale={{
              emptyText: (
                <Empty description="No booking requests yet">
                  <Typography.Text type="secondary">
                    Requests from tour emails, phone calls, and quote forms will appear here.
                  </Typography.Text>
                </Empty>
              ),
            }}
          />
        </Col>

        <Col xs={24} xl={8}>
          <BookingDetailsPanel
            booking={selectedBooking}
            relatedPayments={relatedPayments}
            onViewPayment={onViewPayment}
          />
        </Col>
      </Row>
    </Space>
  );
}

function BookingDetailsPanel({
  booking,
  relatedPayments,
  onViewPayment,
}: {
  booking: BookingRecord | null;
  relatedPayments: PaymentRecord[];
  onViewPayment?: (paymentId: string) => void;
}) {
  if (!booking) {
    return (
      <Card>
        <Empty description="Select a booking to see details" />
      </Card>
    );
  }

  return (
    <Card title="Booking details">
      <Descriptions key={booking.id} column={1} styles={{ content: { minWidth: 0 } }}>
        <Descriptions.Item label="Reference">{booking.reference}</Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag bordered className={statusTagClassNames[booking.status]}>
            {statusLabels[booking.status]}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Source">{sourceLabels[booking.source]}</Descriptions.Item>
        <Descriptions.Item label="Customer">{booking.customerName}</Descriptions.Item>
        <Descriptions.Item label="Email">{booking.customerEmail ?? "—"}</Descriptions.Item>
        <Descriptions.Item label="Phone">{booking.customerPhone ?? "—"}</Descriptions.Item>
        <Descriptions.Item label="Tour">{booking.tourTitle ?? "General inquiry"}</Descriptions.Item>
        <Descriptions.Item label="Tour code">{booking.tourCode ?? "—"}</Descriptions.Item>
        <Descriptions.Item label="Departure">
          {booking.departureDate ? formatDateOnly(booking.departureDate) : "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Party size">{booking.partySize ?? "—"}</Descriptions.Item>
        <Descriptions.Item label="Notes">{booking.notes ?? "—"}</Descriptions.Item>
        <Descriptions.Item label="Created">{formatDate(booking.createdAt)}</Descriptions.Item>
        <Descriptions.Item label="Updated">{formatDate(booking.updatedAt)}</Descriptions.Item>
      </Descriptions>

      <Divider style={{ margin: "16px 0" }} />

      <Typography.Title level={5} style={{ marginTop: 0 }}>
        Payment records
      </Typography.Title>

      {relatedPayments.length === 0 ? (
        <Typography.Text type="secondary">No payments recorded for this booking.</Typography.Text>
      ) : (
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          {relatedPayments.map((payment) => (
            <Card key={payment.id} size="small" className="cms-related-payment-card">
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Space align="center" style={{ justifyContent: "space-between", width: "100%" }}>
                  <Typography.Link onClick={() => onViewPayment?.(payment.id)}>
                    {payment.reference}
                  </Typography.Link>
                  <Typography.Text strong>
                    {formatPaymentAmount(payment.amount, payment.currency, payment.type === "refund")}
                  </Typography.Text>
                </Space>
                <Typography.Text type="secondary">{payment.description}</Typography.Text>
                <Typography.Text type="secondary">
                  {payment.paidAt ? formatDate(payment.paidAt) : "Not paid yet"} · {payment.status}
                </Typography.Text>
              </Space>
            </Card>
          ))}
        </Space>
      )}
    </Card>
  );
}

function getMarkContactedDisabledReason(booking: BookingRecord | null): string | null {
  if (!booking) {
    return "Select a booking from the list first";
  }

  if (booking.status !== "new") {
    return "Only new bookings can be marked as contacted";
  }

  return null;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDateOnly(value: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatPaymentAmount(amount: number, currency: string, isRefund: boolean): string {
  const formatted = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
  }).format(amount);

  return isRefund ? `-${formatted}` : formatted;
}
