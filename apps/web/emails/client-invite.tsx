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

interface ClientInviteEmailProps {
  companyName: string;
  inviteUrl: string;
}

export default function ClientInviteEmail({
  companyName = 'Your Organization',
  inviteUrl = 'https://lgltools.com/invite/token',
}: ClientInviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You&apos;ve been invited to join {companyName} on LGL Tools</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>You&apos;re Invited!</Heading>

          <Text style={text}>Hi there,</Text>

          <Text style={text}>
            You&apos;ve been invited to join <strong>{companyName}</strong> on LGL Tools.
            Click the link below to create your account and get started.
          </Text>

          <Section style={buttonContainer}>
            <Link href={inviteUrl} style={button}>
              Accept Invite
            </Link>
          </Section>

          <Section style={section}>
            <Heading as="h2" style={h2}>What is LGL Tools?</Heading>
            <Text style={listItem}>
              Professional Timer, Prompter, and VOG tools for content creators and live
              productions.
            </Text>
          </Section>

          <Text style={expiry}>
            This invite link will expire in 7 days.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            If you weren&apos;t expecting this invite, you can safely ignore this email.
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

const expiry = {
  color: '#8898aa',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 0 16px',
  textAlign: 'center' as const,
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
