import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lgltools.com';

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header with logo */}
          <Section style={header}>
            <Img
              src={`${APP_URL}/lgl-logo.png`}
              width="120"
              height="40"
              alt="LGL Tools"
              style={logo}
            />
          </Section>

          {/* Main content */}
          <Section style={content}>{children}</Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              LGL Tools — Professional AV tools for live productions
            </Text>
            <Text style={footerLinks}>
              <a href={`${APP_URL}/dashboard`} style={footerLink}>
                Dashboard
              </a>
              {' | '}
              <a href={`${APP_URL}/account`} style={footerLink}>
                Account
              </a>
              {' | '}
              <a href={APP_URL} style={footerLink}>
                lgltools.com
              </a>
            </Text>
            <Text style={copyright}>
              &copy; {new Date().getFullYear()} Let&apos;s Go Live LLC. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Shared styles exported for use in individual templates
export const styles = {
  h1: {
    color: '#1a1a1a',
    fontSize: '24px',
    fontWeight: '600' as const,
    lineHeight: '32px',
    margin: '0 0 20px',
    textAlign: 'center' as const,
  },
  h2: {
    color: '#1a1a1a',
    fontSize: '18px',
    fontWeight: '600' as const,
    lineHeight: '28px',
    margin: '0 0 12px',
  },
  text: {
    color: '#484848',
    fontSize: '16px',
    lineHeight: '26px',
    margin: '0 0 16px',
  },
  listItem: {
    color: '#484848',
    fontSize: '14px',
    lineHeight: '24px',
    margin: '0 0 6px',
  },
  buttonContainer: {
    textAlign: 'center' as const,
    margin: '28px 0',
  },
  button: {
    backgroundColor: '#0f172a',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600' as const,
    textDecoration: 'none',
    textAlign: 'center' as const,
    padding: '12px 28px',
    display: 'inline-block',
  },
  infoBox: {
    backgroundColor: '#f6f9fc',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    borderRadius: '8px',
    padding: '16px 20px',
    margin: '24px 0',
    borderLeft: '4px solid #f59e0b',
  },
  warningText: {
    color: '#92400e',
    fontSize: '16px',
    lineHeight: '24px',
    margin: '0',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    padding: '16px 20px',
    margin: '24px 0',
    borderLeft: '4px solid #ef4444',
  },
  errorText: {
    color: '#991b1b',
    fontSize: '16px',
    lineHeight: '24px',
    margin: '0',
  },
  successBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: '8px',
    padding: '16px 20px',
    margin: '24px 0',
    borderLeft: '4px solid #22c55e',
  },
  successText: {
    color: '#166534',
    fontSize: '16px',
    lineHeight: '24px',
    margin: '0',
  },
} as const;

// Internal layout styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '40px auto',
  padding: '0',
  maxWidth: '560px',
  borderRadius: '8px',
  border: '1px solid #e6ebf1',
};

const header = {
  backgroundColor: '#0f172a',
  borderRadius: '8px 8px 0 0',
  padding: '24px 0',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto',
};

const content = {
  padding: '32px 32px 16px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '0',
};

const footer = {
  padding: '24px 32px',
};

const footerText = {
  color: '#8898aa',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 0 8px',
  textAlign: 'center' as const,
};

const footerLinks = {
  color: '#8898aa',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 0 8px',
  textAlign: 'center' as const,
};

const footerLink = {
  color: '#6366f1',
  textDecoration: 'none',
};

const copyright = {
  color: '#b0bec5',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '0',
  textAlign: 'center' as const,
};
