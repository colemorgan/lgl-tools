import { Heading, Link, Section, Text } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, styles } from './components/layout';

interface TrialEndingEmailProps {
  userName: string;
  daysRemaining: number;
}

export default function TrialEndingEmail({
  userName = 'there',
  daysRemaining = 3,
}: TrialEndingEmailProps) {
  return (
    <EmailLayout preview={`Your LGL Tools trial ends in ${daysRemaining} days`}>
      <Heading style={styles.h1}>Your Trial is Ending Soon</Heading>

      <Text style={styles.text}>Hi {userName},</Text>

      <Text style={styles.text}>
        Just a friendly reminder that your free trial of LGL Tools will end in{' '}
        <strong>{daysRemaining} days</strong>.
      </Text>

      <Section style={styles.warningBox}>
        <Text style={styles.warningText}>
          Upgrade now for just <strong>$9/month</strong> to keep access to all tools.
        </Text>
      </Section>

      <Text style={styles.text}>
        With an active subscription, you&apos;ll get:
      </Text>

      <Text style={styles.listItem}>- Full access to Timer, Prompter, and VOG tools</Text>
      <Text style={styles.listItem}>- New features as they&apos;re released</Text>
      <Text style={styles.listItem}>- Priority support</Text>

      <Section style={styles.buttonContainer}>
        <Link
          href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://lgltools.com'}/dashboard`}
          style={styles.button}
        >
          Upgrade Now
        </Link>
      </Section>

      <Text style={styles.text}>
        Have questions? Just reply to this email - we&apos;re happy to help!
      </Text>
    </EmailLayout>
  );
}
