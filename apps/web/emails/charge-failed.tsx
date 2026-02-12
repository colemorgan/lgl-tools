import { Heading, Link, Section, Text } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, styles } from './components/layout';

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
    <EmailLayout preview="A scheduled payment failed">
      <Heading style={styles.h1}>Payment Failed</Heading>

      <Text style={styles.text}>Hi {userName},</Text>

      <Text style={styles.text}>
        We weren&apos;t able to process a scheduled payment on your account.
      </Text>

      <Section style={styles.errorBox}>
        <Text style={styles.errorText}>
          <strong>Amount:</strong> {amount}
        </Text>
        <Text style={{ ...styles.errorText, marginTop: '4px' }}>
          <strong>Description:</strong> {description}
        </Text>
      </Section>

      <Text style={styles.text}>
        This may be due to an expired card or insufficient funds. Please update
        your payment method to resolve this.
      </Text>

      <Section style={styles.buttonContainer}>
        <Link
          href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://lgltools.com'}/account`}
          style={styles.button}
        >
          Update Payment Method
        </Link>
      </Section>

      <Text style={styles.text}>
        If you believe this is an error or need assistance, please reply to this
        email and we&apos;ll help you resolve it.
      </Text>
    </EmailLayout>
  );
}
