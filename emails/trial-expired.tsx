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

interface TrialExpiredEmailProps {
  userName: string;
}

export default function TrialExpiredEmail({
  userName = 'there',
}: TrialExpiredEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your LGL Tools trial has expired</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Your Trial Has Expired</Heading>

          <Text style={text}>Hi {userName},</Text>

          <Text style={text}>
            Your 15-day free trial of LGL Tools has ended. We hope you enjoyed using
            our tools!
          </Text>

          <Section style={section}>
            <Text style={highlightText}>
              Don&apos;t lose access! Upgrade for just <strong>$9/month</strong> to continue
              using all LGL Tools.
            </Text>
          </Section>

          <Text style={text}>
            Here&apos;s what you&apos;ll get with a subscription:
          </Text>

          <Text style={listItem}>
            - Unlimited access to Timer
          </Text>
          <Text style={listItem}>
            - Access to Prompter when it launches
          </Text>
          <Text style={listItem}>
            - Access to VOG when it launches
          </Text>
          <Text style={listItem}>
            - All future tools and features
          </Text>

          <Section style={buttonContainer}>
            <Link
              href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://lgltools.com'}/dashboard`}
              style={button}
            >
              Reactivate Your Account
            </Link>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            If you have any feedback about your trial experience, we&apos;d love to hear it.
            Just reply to this email.
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
