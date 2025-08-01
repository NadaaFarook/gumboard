import { auth } from "@/auth"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user with organization
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    })

    if (!user?.organization) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 })
    }

    // Get all boards for the organization
    const boards = await db.board.findMany({
      where: { organizationId: user.organization.id },
      select: {
        id: true,
        name: true,
        description: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ boards })
  } catch (error) {
    console.error("Error fetching boards:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Board name is required" }, { status: 400 })
    }

    // Get user with organization
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    })

    if (!user?.organization) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 })
    }

    // Create new board
    const board = await db.board.create({
      data: {
        name,
        description,
        organizationId: user.organization.id,
        createdBy: session.user.id
      }
    })

    return NextResponse.json({ board }, { status: 201 })
  } catch (error) {
    console.error("Error creating board:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 