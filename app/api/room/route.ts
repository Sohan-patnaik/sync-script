import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";


export async function POST() {
  const roomId = uuid();

  return NextResponse.json({ roomId });
}