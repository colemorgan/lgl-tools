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

interface WelcomeEmailProps {
  userName: string;
  trialDays: number;
}

export default function WelcomeEmail({
  userName = 'there',
  trialDays = 15,
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Welcome to LGL Tools - Your ${trialDays}-day free trial has started!`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to LGL Tools!</Heading>

          <Text style={text}>Hi {userName},</Text>

          <Text style={text}>
            Thanks for signing up! Your {trialDays}-day free trial has officially started.
            You now have full access to all our tools.
          </Text>

          <Section style={section}>
            <Heading as="h2" style={h2}>What you can do now:</Heading>
            <Text style={listItem}>
              <strong>Timer</strong> - Track your time with precision
            </Text>
            <Text style={listItem}>
              <strong>Prompter</strong> - Professional teleprompter for presentations (Coming Soon)
            </Text>
            <Text style={listItem}>
              <strong>VOG</strong> - Voice of God announcer tool (Coming Soon)
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Link
              href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://lgltools.com'}/dashboard`}
              style={button}
            >
              Go to Dashboard
            </Link>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            If you have any questions, just reply to this email. We&apos;re here to help!
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

const h2 = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: '600',
  lineHeight: '28px',
  margin: '0 0 12px',
};

const text = {
  color: '#484848',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const section = {
  backgroundColor: '#f6f9fc',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const listItem = {
  color: '#484848',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 8px',
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
