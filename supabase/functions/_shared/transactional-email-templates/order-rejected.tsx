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

interface Props {
  customerName?: string
  orderId?: string
  transactionId?: string | null
  totalPrice?: number | string
  items?: Item[]
  reason?: string | null
}

const Email = ({
  customerName,
  orderId,
  transactionId,
  totalPrice,
  items = [],
  reason,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>আপনার Tech Subx BD অর্ডারটি ভেরিফাই করা যায়নি</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img
            src="https://www.myproduct.tech/logo.png"
            alt="Tech Subx BD"
            width="160"
            style={logo}
          />
          <Text style={brandSub}>Payment Verification Failed</Text>
        </Section>

        <Section style={card}>
          <Heading style={h1}>
            {customerName ? `প্রিয় ${customerName},` : 'প্রিয় গ্রাহক,'}
          </Heading>
          <Text style={p}>
            দুঃখিত — আপনার পেমেন্ট ভেরিফাই করতে সমস্যা হয়েছে, তাই অর্ডারটি এই মুহূর্তে
            প্রসেস করা যায়নি। দয়া করে আমাদের সাপোর্টে যোগাযোগ করুন, আমরা দ্রুত সমাধান
            করে দেব।
          </Text>

          <Section style={alertBox}>
            <Text style={alertTitle}>কারণ</Text>
            <Text style={alertText}>
              {reason && String(reason).trim()
                ? reason
                : 'পেমেন্ট ভেরিফিকেশনে সমস্যা হয়েছে। দয়া করে সাপোর্টে যোগাযোগ করুন।'}
            </Text>
          </Section>

          {items.length > 0 && (
            <Section style={block}>
              <Text style={label}>Your Order</Text>
              {items.map((it, i) => (
                <Text key={i} style={itemLine}>
                  • {it.name ?? 'Item'}
                  {it.option ? ` (${it.option})` : ''}
                  {it.quantity ? ` × ${it.quantity}` : ''}
                </Text>
              ))}
            </Section>
          )}

          <Hr style={hr} />

          {orderId ? <Text style={meta}>Order ID: {orderId}</Text> : null}
          {transactionId ? (
            <Text style={meta}>Transaction ID: {transactionId}</Text>
          ) : null}
          {totalPrice !== undefined && totalPrice !== null ? (
            <Text style={meta}>Amount: BDT {String(totalPrice)}</Text>
          ) : null}

          <Link href="https://www.myproduct.tech/" style={button}>
            সাপোর্টে যোগাযোগ করুন
          </Link>

          <Text style={support}>
            আপনি এই ইমেইলের রিপ্লাই দিতে পারেন, অথবা ওয়েবসাইটের লাইভ চ্যাট থেকে আমাদের
            সাথে কথা বলতে পারেন।
          </Text>
        </Section>

        <Text style={footer}>Tech Subx BD — Premium digital subscriptions</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'পেমেন্ট ভেরিফিকেশন সমস্যা — Tech Subx BD',
  displayName: 'Order Rejected',
  previewData: {
    customerName: 'Tamim',
    orderId: '8f2a1c34-1111-2222-3333-444455556666',
    transactionId: 'TRX123456',
    totalPrice: 450,
    items: [{ name: 'Netflix Premium', option: '1 Month', quantity: 1 }],
    reason: 'ট্রানজেকশন আইডি খুঁজে পাওয়া যায়নি।',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }
const header = { textAlign: 'center' as const, paddingBottom: '16px' }
const logo = { display: 'block', margin: '0 auto', maxWidth: '160px', height: 'auto' }
const brandSub = { fontSize: '13px', color: '#dc2626', margin: '4px 0 0', letterSpacing: '1px', textTransform: 'uppercase' as const }
const card = { border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }
const h1 = { fontSize: '20px', color: '#0f172a', margin: '0 0 8px' }
const p = { fontSize: '14px', lineHeight: '24px', color: '#334155', margin: '0 0 16px' }
const alertBox = { backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '14px', margin: '0 0 16px' }
const alertTitle = { fontSize: '12px', fontWeight: 'bold', color: '#b91c1c', textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 6px' }
const alertText = { fontSize: '14px', lineHeight: '24px', color: '#7f1d1d', whiteSpace: 'pre-wrap' as const, margin: '0' }
const block = { margin: '0 0 16px' }
const label = { fontSize: '12px', fontWeight: 'bold', color: '#0f766e', textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 8px' }
const itemLine = { fontSize: '14px', color: '#0f172a', margin: '0 0 4px' }
const hr = { borderColor: '#e2e8f0', margin: '20px 0' }
const meta = { fontSize: '12px', color: '#64748b', margin: '0 0 4px' }
const button = { display: 'inline-block', backgroundColor: '#0f766e', color: '#ffffff', fontSize: '14px', fontWeight: 'bold', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', marginTop: '12px' }
const support = { fontSize: '13px', color: '#64748b', margin: '16px 0 0' }
const footer = { fontSize: '12px', color: '#94a3b8', textAlign: 'center' as const, marginTop: '20px' }
