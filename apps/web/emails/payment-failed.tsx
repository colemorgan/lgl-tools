import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface PaymentFailedEmailProps {
  userName: string;
}

export default function PaymentFailedEmail({
  userName = 'there',
}: PaymentFailedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Action required: Your payment failed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Payment Failed</Heading>

          <Text style={text}>Hi {userName},</Text>

          <Text style={text}>
            We weren&apos;t able to process your latest payment for LGL Tools. This can
            happen for a few reasons:
          </Text>

          <Text style={listItem}>
            - Your card may have expired
          </Text>
          <Text style={listItem}>
            - There may be insufficient funds
          </Text>
          <Text style={listItem}>
            - Your bank may have declined the charge
          </Text>

          <Section style={section}>
            <Text style={highlightText}>
              Please update your payment method to avoid losing access to LGL Tools.
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Link
              href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://lgltools.com'}/account`}
              style={button}
            >
              Update Payment Method
            </Link>
          </Section>

          <Text style={text}>
            Once your payment method is updated, we&apos;ll automatically retry the charge.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            If you believe this is an error or need assistance, please reply to this
            email and we&apos;ll help you resolve it.
          </Text>

          <Text style={footer}>
            - The LGL Tools Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '560px',
  borderRadius: '8px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '40px',
  margin: '0 0 20px',
  textAlign: 'center' as const,
};

const text = {
  color: '#484848',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const section = {
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '24px 0',
  borderLeft: '4px solid #ef4444',
};

const highlightText = {
  color: '#991b1b',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
};

const listItem = {
  color: '#484848',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 4px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
};

const button = {
  backgroundColor: '#0f172a',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 24px',
  display: 'inline-block',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '24px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 8px',
};
