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

interface ChargeFailedEmailProps {
  userName: string;
  amount: string;
  description: string;
}

export default function ChargeFailedEmail({
  userName = 'there',
  amount = '$0.00',
  description = 'Scheduled charge',
}: ChargeFailedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>A scheduled payment failed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Payment Failed</Heading>

          <Text style={text}>Hi {userName},</Text>

          <Text style={text}>
            We weren&apos;t able to process a scheduled payment on your account.
          </Text>

          <Section style={section}>
            <Text style={highlightText}>
              <strong>Amount:</strong> {amount}
            </Text>
            <Text style={highlightText}>
              <strong>Description:</strong> {description}
            </Text>
          </Section>

          <Text style={text}>
            This may be due to an expired card or insufficient funds. Please update
            your payment method to resolve this.
          </Text>

          <Section style={buttonContainer}>
            <Link
              href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://lgltools.com'}/account`}
              style={button}
            >
              Update Payment Method
            </Link>
          </Section>

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
