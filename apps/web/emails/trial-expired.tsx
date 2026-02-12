import { Heading, Link, Section, Text } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, styles } from './components/layout';

interface TrialExpiredEmailProps {
  userName: string;
}

export default function TrialExpiredEmail({
  userName = 'there',
}: TrialExpiredEmailProps) {
  return (
    <EmailLayout preview="Your LGL Tools trial has expired">
      <Heading style={styles.h1}>Your Trial Has Expired</Heading>

      <Text style={styles.text}>Hi {userName},</Text>

      <Text style={styles.text}>
        Your 14-day free trial of LGL Tools has ended. We hope you enjoyed using
        our tools!
      </Text>

      <Section style={styles.errorBox}>
        <Text style={styles.errorText}>
          Don&apos;t lose access! Upgrade for just <strong>$9/month</strong> to continue
          using all LGL Tools.
        </Text>
      </Section>

      <Text style={styles.text}>
        Here&apos;s what you&apos;ll get with a subscription:
      </Text>

      <Text style={styles.listItem}>- Unlimited access to Timer</Text>
      <Text style={styles.listItem}>- Access to Prompter when it launches</Text>
      <Text style={styles.listItem}>- Access to VOG when it launches</Text>
      <Text style={styles.listItem}>- All future tools and features</Text>

      <Section style={styles.buttonContainer}>
        <Link
          href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://lgltools.com'}/dashboard`}
          style={styles.button}
        >
          Reactivate Your Account
        </Link>
      </Section>

      <Text style={styles.text}>
        If you have any feedback about your trial experience, we&apos;d love to hear it.
        Just reply to this email.
      </Text>
    </EmailLayout>
  );
}
