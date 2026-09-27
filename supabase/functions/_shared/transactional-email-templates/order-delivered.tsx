import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Item {
  name?: string
  option?: string | null
  quantity?: number
}

interface Note {
  note?: string
  link?: string
}

interface Props {
  customerName?: string
  orderId?: string
  transactionId?: string | null
  totalPrice?: number | string
  items?: Item[]
  notes?: Note[]
}

const Email = ({
  customerName,
  orderId,
  transactionId,
  totalPrice,
  items = [],
  notes = [],
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Tech Subx BD order is delivered — access details inside</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img
            src="https://www.myproduct.tech/logo.png"
            alt="Tech Subx BD"
            width="160"
            style={logo}
          />
          <Text style={brandSub}>Order Delivered</Text>
        </Section>

        <Section style={card}>
          <Heading style={h1}>
            {customerName ? `Hi ${customerName},` : 'Hello,'}
          </Heading>
          <Text style={p}>
            Great news — your order has been delivered. Your subscription access
            details are below. Please keep this email safe.
          </Text>

          {items.length > 0 && (
            <Section style={block}>
              <Text style={label}>Your Items</Text>
              {items.map((it, i) => (
                <Text key={i} style={itemLine}>
                  • {it.name ?? 'Item'}
                  {it.option ? ` (${it.option})` : ''}
                  {it.quantity ? ` × ${it.quantity}` : ''}
                </Text>
              ))}
            </Section>
          )}

          {notes.length > 0 && (
            <Section style={block}>
              <Text style={label}>Delivery Details</Text>
              {notes.map((n, i) => (
                <Section key={i} style={noteBox}>
                  {n.note ? <Text style={noteText}>{n.note}</Text> : null}
                  {n.link ? (
                    <Link href={n.link} style={button}>
                      Get Subscription
                    </Link>
                  ) : null}
                </Section>
              ))}
            </Section>
          )}

          <Hr style={hr} />

          <Text style={meta}>
            {orderId ? `Order ID: ${orderId}` : ''}
          </Text>
          {transactionId ? (
            <Text style={meta}>Transaction ID: {transactionId}</Text>
          ) : null}
          {totalPrice !== undefined && totalPrice !== null ? (
            <Text style={meta}>Total Paid: BDT {String(totalPrice)}</Text>
          ) : null}

          <Text style={p}>
            You can also view this order anytime in your account on{' '}
            <Link href="https://www.myproduct.tech/account" style={link}>
              myproduct.tech
            </Link>
            .
          </Text>

          <Text style={support}>
            Need help? Reply to this email or contact us through the live chat on
            our website.
          </Text>
        </Section>

        <Text style={footer}>Tech Subx BD — Premium digital subscriptions</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    data?.orderId
      ? `Your order is delivered — Tech Subx BD`
      : 'Your order is delivered — Tech Subx BD',
  displayName: 'Order Delivered',
  previewData: {
    customerName: 'Tamim',
    orderId: '8f2a1c34-1111-2222-3333-444455556666',
    transactionId: 'TRX123456',
    totalPrice: 450,
    items: [{ name: 'Netflix Premium', option: '1 Month', quantity: 1 }],
    notes: [
      {
        note: 'Email: movee@myproduct.tech\nProfile Name: Tamim\nProfile PIN: 2706',
        link: 'https://www.netflix.com',
      },
    ],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }
const header = { textAlign: 'center' as const, paddingBottom: '16px' }
const logo = { display: 'block', margin: '0 auto', maxWidth: '160px', height: 'auto' }
const brandSub = { fontSize: '13px', color: '#7c3aed', margin: '4px 0 0', letterSpacing: '1px', textTransform: 'uppercase' as const }
const card = { border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }
const h1 = { fontSize: '20px', color: '#0f172a', margin: '0 0 8px' }
const p = { fontSize: '14px', lineHeight: '22px', color: '#334155', margin: '0 0 16px' }
const block = { margin: '0 0 16px' }
const label = { fontSize: '12px', fontWeight: 'bold', color: '#0f766e', textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 8px' }
const itemLine = { fontSize: '14px', color: '#0f172a', margin: '0 0 4px' }
const noteBox = { backgroundColor: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: '8px', padding: '14px', margin: '0 0 12px' }
const noteText = { fontSize: '14px', lineHeight: '22px', color: '#0f172a', whiteSpace: 'pre-wrap' as const, margin: '0 0 12px' }
const button = { display: 'inline-block', backgroundColor: '#0f766e', color: '#ffffff', fontSize: '14px', fontWeight: 'bold', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none' }
const hr = { borderColor: '#e2e8f0', margin: '20px 0' }
const meta = { fontSize: '12px', color: '#64748b', margin: '0 0 4px' }
const link = { color: '#7c3aed', textDecoration: 'underline' }
const support = { fontSize: '13px', color: '#64748b', margin: '16px 0 0' }
const footer = { fontSize: '12px', color: '#94a3b8', textAlign: 'center' as const, marginTop: '20px' }
