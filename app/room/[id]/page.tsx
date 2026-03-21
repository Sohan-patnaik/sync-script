import Editor from "@/components/Editor";

interface RoomPageProps {
  params: Promise<{ id: string }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { id: roomId } = await params;

  return <Editor roomId={roomId} />;
}