import { InviteRegistrationForm } from '@/components/auth/invite-registration-form';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Accept Invite - Let's Go Live",
  description: 'Complete your registration to join your organization',
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return <InviteRegistrationForm token={token} />;
}
