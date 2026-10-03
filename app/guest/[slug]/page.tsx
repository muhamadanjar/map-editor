import { GuestSubmissionView } from "@/features/guest/views/guest-submission-view";

type GuestPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function GuestPage({ params }: GuestPageProps) {
  const { slug } = await params;
  return <GuestSubmissionView slug={slug} />;
}
