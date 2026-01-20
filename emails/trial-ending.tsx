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

interface TrialEndingEmailProps {
  userName: string;
  daysRemaining: number;
}

export default function TrialEndingEmail({
  userName = 'there',
  daysRemaining = 3,
}: TrialEndingEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Your LGL Tools trial ends in ${daysRemaining} days`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Your Trial is Ending Soon</Heading>

          <Text style={text}>Hi {userName},</Text>

          <Text style={text}>
            Just a friendly reminder that your free trial of LGL Tools will end in{' '}
            <strong>{daysRemaining} days</strong>.
          </Text>

          <Section style={section}>
            <Text style={highlightText}>
              Upgrade now for just <strong>$9/month</strong> to keep access to all tools.
            </Text>
          </Section>

          <Text style={text}>
            With an active subscription, you&apos;ll get:
          </Text>

          <Text style={listItem}>
            - Full access to Timer, Prompter, and VOG tools
          </Text>
          <Text style={listItem}>
            - New features as they&apos;re released
          </Text>
          <Text style={listItem}>
            - Priority support
          </Text>

          <Section style={buttonContainer}>
            <Link
              href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://lgltools.com'}/dashboard`}
              style={button}
            >
              Upgrade Now
            </Link>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Have questions? Just reply to this email - we&apos;re happy to help!
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
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '24px 0',
  borderLeft: '4px solid #f59e0b',
};

const highlightText = {
  color: '#92400e',
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
