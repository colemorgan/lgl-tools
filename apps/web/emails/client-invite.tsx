import { Heading, Link, Section, Text } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, styles } from './components/layout';

interface ClientInviteEmailProps {
  companyName: string;
  inviteUrl: string;
}

export default function ClientInviteEmail({
  companyName = 'Your Organization',
  inviteUrl = 'https://lgltools.com/invite/token',
}: ClientInviteEmailProps) {
  return (
    <EmailLayout preview={`You've been invited to join ${companyName} on LGL Tools`}>
      <Heading style={styles.h1}>You&apos;re Invited!</Heading>

      <Text style={styles.text}>Hi there,</Text>

      <Text style={styles.text}>
        You&apos;ve been invited to join <strong>{companyName}</strong> on LGL Tools.
        Click the link below to create your account and get started.
      </Text>

      <Section style={styles.buttonContainer}>
        <Link href={inviteUrl} style={styles.button}>
          Accept Invite
        </Link>
      </Section>

      <Section style={styles.infoBox}>
        <Heading as="h2" style={styles.h2}>What is LGL Tools?</Heading>
        <Text style={styles.listItem}>
          Professional Timer, Prompter, and VOG tools for content creators and live
          productions.
        </Text>
      </Section>

      <Text style={{ ...styles.text, color: '#8898aa', fontSize: '13px', textAlign: 'center' as const }}>
        This invite link will expire in 7 days.
      </Text>
    </EmailLayout>
  );
}
