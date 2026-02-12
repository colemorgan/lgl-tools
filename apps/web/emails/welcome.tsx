import { Heading, Link, Section, Text } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, styles } from './components/layout';

interface WelcomeEmailProps {
  userName: string;
  trialDays: number;
}

export default function WelcomeEmail({
  userName = 'there',
  trialDays = 15,
}: WelcomeEmailProps) {
  return (
    <EmailLayout preview={`Welcome to LGL Tools - Your ${trialDays}-day free trial has started!`}>
      <Heading style={styles.h1}>Welcome to LGL Tools!</Heading>

      <Text style={styles.text}>Hi {userName},</Text>

      <Text style={styles.text}>
        Thanks for signing up! Your {trialDays}-day free trial has officially started.
        You now have full access to all our tools.
      </Text>

      <Section style={styles.infoBox}>
        <Heading as="h2" style={styles.h2}>What you can do now:</Heading>
        <Text style={styles.listItem}>
          <strong>Timer</strong> - Track your time with precision
        </Text>
        <Text style={styles.listItem}>
          <strong>Prompter</strong> - Professional teleprompter for presentations (Coming Soon)
        </Text>
        <Text style={styles.listItem}>
          <strong>VOG</strong> - Voice of God announcer tool (Coming Soon)
        </Text>
      </Section>

      <Section style={styles.buttonContainer}>
        <Link
          href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://lgltools.com'}/dashboard`}
          style={styles.button}
        >
          Go to Dashboard
        </Link>
      </Section>

      <Text style={styles.text}>
        If you have any questions, just reply to this email. We&apos;re here to help!
      </Text>
    </EmailLayout>
  );
}
