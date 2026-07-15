"use client";

import { ProTable } from "@ant-design/pro-components";
import type { ProColumns } from "@ant-design/pro-components";
import { App, Button, Card, Col, Descriptions, Divider, Empty, Row, Space, Statistic, Tag, Typography } from "antd";
import { useCallback, useMemo, useState } from "react";
import { getPaymentStatusCounts } from "@/lib/workspace-view-models";
import type {
  BookingRecord,
  PaymentMethod,
  PaymentRecord,
  PaymentStatus,
  PaymentType,
} from "@/types/cms";

type PaymentsWorkspaceProps = {
  payments: PaymentRecord[];
  bookings: BookingRecord[];
  focusPaymentId?: string | null;
  onFocusHandled?: () => void;
  onViewBooking?: (bookingId: string) => void;
};

const statusLabels: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  partial: "Partial",
  refunded: "Refunded",
  failed: "Failed",
};

const methodLabels: Record<PaymentMethod, string> = {
  card: "Card",
  bank_transfer: "Bank transfer",
  e_transfer: "Interac e-Transfer",
  cash: "Cash",
  other: "Other",
};

const typeLabels: Record<PaymentType, string> = {
  deposit: "Deposit",
  balance: "Balance",
  full: "Full payment",
  refund: "Refund",
};

const statusTagClassNames: Record<PaymentStatus, string> = {
  pending: "cms-payment-tag cms-payment-tag--pending",
  paid: "cms-payment-tag cms-payment-tag--paid",
  partial: "cms-payment-tag cms-payment-tag--partial",
  refunded: "cms-payment-tag cms-payment-tag--refunded",
  failed: "cms-payment-tag cms-payment-tag--failed",
};

export function PaymentsWorkspace({
  payments,
  bookings,
  focusPaymentId,
  onFocusHandled,
  onViewBooking,
}: PaymentsWorkspaceProps) {
  const { message } = App.useApp();
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);
  const [loading] = useState(false);
  const counts = getPaymentStatusCounts(payments);
  const focusedPaymentExists =
    focusPaymentId !== null &&
    focusPaymentId !== undefined &&
    payments.some((payment) => payment.id === focusPaymentId);
  const selectedId = focusedPaymentExists ? focusPaymentId : localSelectedId;

  const selectedPayment = useMemo(
    () => payments.find((payment) => payment.id === selectedId) ?? null,
    [payments, selectedId],
  );

  const linkedBooking = useMemo(
    () =>
      selectedPayment
        ? (bookings.find((booking) => booking.id === selectedPayment.bookingId) ?? null)
        : null,
    [bookings, selectedPayment],
  );

  const handleSelectPayment = useCallback(
    (paymentId: string) => {
      setLocalSelectedId(paymentId);
      onFocusHandled?.();
    },
    [onFocusHandled],
  );

  const columns: ProColumns<PaymentRecord>[] = useMemo(
    () => [
      {
        title: "Reference",
        dataIndex: "reference",
        render: (_, record) => (
          <span className="cms-table-title-link">{record.reference}</span>
        ),
      },
      {
        title: "Booking",
        dataIndex: "bookingReference",
        render: (_, record) => (
          <Typography.Link
            className="cms-table-title-link"
            onClick={(event) => {
              event.stopPropagation();
              onViewBooking?.(record.bookingId);
            }}
          >
            {record.bookingReference}
          </Typography.Link>
        ),
      },
      {
        title: "Customer",
        dataIndex: "customerName",
      },
      {
        title: "Amount",
        dataIndex: "amount",
        render: (_, record) => (
          <span className={record.type === "refund" ? "cms-payment-amount--refund" : "cms-payment-amount"}>
            {formatAmount(record.amount, record.currency, record.type === "refund")}
          </span>
        ),
      },
      {
        title: "Type",
        dataIndex: "type",
        render: (_, record) => (
          <Tag className="cms-payment-type-tag">{typeLabels[record.type]}</Tag>
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
        title: "Paid at",
        dataIndex: "paidAt",
        render: (_, record) => (record.paidAt ? formatDate(record.paidAt) : "—"),
      },
    ],
    [onViewBooking],
  );

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Paid" value={counts.paid} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Pending" value={counts.pending} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Partial" value={counts.partial} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Refunded / Failed" value={counts.refunded + counts.failed} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={16}>
          <ProTable<PaymentRecord>
            columns={columns}
            dataSource={payments}
            loading={loading}
            rowKey="id"
            search={false}
            options={{ density: true, setting: true, reload: false }}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 980 }}
            toolBarRender={() => [
              <Button
                key="export"
                onClick={() => message.info("Export will be available when API is connected")}
              >
                Export
              </Button>,
            ]}
            onRow={(record) => ({
              onClick: () => handleSelectPayment(record.id),
              style: {
                cursor: "pointer",
                background: record.id === selectedId ? "#fbf9f4" : undefined,
              },
            })}
            locale={{
              emptyText: (
                <Empty description="No payment records yet">
                  <Typography.Text type="secondary">
                    Deposits, balances, and refunds will appear here once payments are recorded.
                  </Typography.Text>
                </Empty>
              ),
            }}
          />
        </Col>

        <Col xs={24} xl={8}>
          <PaymentDetailsPanel
            payment={selectedPayment}
            booking={linkedBooking}
            onViewBooking={onViewBooking}
          />
        </Col>
      </Row>
    </Space>
  );
}

function PaymentDetailsPanel({
  payment,
  booking,
  onViewBooking,
}: {
  payment: PaymentRecord | null;
  booking: BookingRecord | null;
  onViewBooking?: (bookingId: string) => void;
}) {
  if (!payment) {
    return (
      <Card>
        <Empty description="Select a payment to see details" />
      </Card>
    );
  }

  const isRefund = payment.type === "refund";

  return (
    <Card title="Payment details">
      <div className="cms-payment-receipt">
        <div className="cms-payment-receipt__amount">
          <Typography.Text type="secondary">Amount</Typography.Text>
          <div className={isRefund ? "cms-payment-receipt__value--refund" : "cms-payment-receipt__value"}>
            {formatAmount(payment.amount, payment.currency, isRefund)}
          </div>
        </div>

        <Tag bordered className={statusTagClassNames[payment.status]}>
          {statusLabels[payment.status]}
        </Tag>
      </div>

      <Divider style={{ margin: "16px 0" }} />

      <Descriptions column={1} styles={{ content: { minWidth: 0 } }}>
        <Descriptions.Item label="Payment reference">{payment.reference}</Descriptions.Item>
        <Descriptions.Item label="Transaction ID">{payment.transactionId ?? "—"}</Descriptions.Item>
        <Descriptions.Item label="Type">{typeLabels[payment.type]}</Descriptions.Item>
        <Descriptions.Item label="Method">{methodLabels[payment.method]}</Descriptions.Item>
        <Descriptions.Item label="Description">{payment.description}</Descriptions.Item>
        <Descriptions.Item label="Customer">{payment.customerName}</Descriptions.Item>
        <Descriptions.Item label="Tour">{payment.tourTitle ?? "—"}</Descriptions.Item>
        <Descriptions.Item label="Booking">
          <Typography.Link onClick={() => onViewBooking?.(payment.bookingId)}>
            {payment.bookingReference}
          </Typography.Link>
        </Descriptions.Item>
        <Descriptions.Item label="Booking status">
          {booking ? formatBookingStatus(booking.status) : "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Paid at">
          {payment.paidAt ? formatDate(payment.paidAt) : "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Created">{formatDate(payment.createdAt)}</Descriptions.Item>
        <Descriptions.Item label="Updated">{formatDate(payment.updatedAt)}</Descriptions.Item>
        <Descriptions.Item label="Notes">{payment.notes ?? "—"}</Descriptions.Item>
      </Descriptions>
    </Card>
  );
}

function formatAmount(amount: number, currency: string, isRefund: boolean): string {
  const formatted = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
  }).format(amount);

  return isRefund ? `-${formatted}` : formatted;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatBookingStatus(status: BookingRecord["status"]): string {
  const labels: Record<BookingRecord["status"], string> = {
    new: "New",
    contacted: "Contacted",
    confirmed: "Confirmed",
    cancelled: "Cancelled",
    completed: "Completed",
  };

  return labels[status];
}
