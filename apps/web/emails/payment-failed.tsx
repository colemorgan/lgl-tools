import { Heading, Link, Section, Text } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, styles } from './components/layout';

interface PaymentFailedEmailProps {
  userName: string;
}

export default function PaymentFailedEmail({
  userName = 'there',
}: PaymentFailedEmailProps) {
  return (
    <EmailLayout preview="Action required: Your payment failed">
      <Heading style={styles.h1}>Payment Failed</Heading>

      <Text style={styles.text}>Hi {userName},</Text>

      <Text style={styles.text}>
        We weren&apos;t able to process your latest payment for LGL Tools. This can
        happen for a few reasons:
      </Text>

      <Text style={styles.listItem}>- Your card may have expired</Text>
      <Text style={styles.listItem}>- There may be insufficient funds</Text>
      <Text style={styles.listItem}>- Your bank may have declined the charge</Text>

      <Section style={styles.errorBox}>
        <Text style={styles.errorText}>
          Please update your payment method to avoid losing access to LGL Tools.
        </Text>
      </Section>

      <Section style={styles.buttonContainer}>
        <Link
          href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://lgltools.com'}/account`}
          style={styles.button}
        >
          Update Payment Method
        </Link>
      </Section>

      <Text style={styles.text}>
        Once your payment method is updated, we&apos;ll automatically retry the charge.
      </Text>

      <Text style={styles.text}>
        If you believe this is an error or need assistance, please reply to this
        email and we&apos;ll help you resolve it.
      </Text>
    </EmailLayout>
  );
}
